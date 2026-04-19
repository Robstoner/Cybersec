# WorkoutTracker

> Faculty project for the course **Web Applications with Microservices**

A full-stack workout tracking application built with Spring Boot and React.

---

## Functional Requirements

### Authentication & Authorization
- Users can register with a unique username, email, and password
- Users can log in and receive a JWT token valid for 24 hours
- All endpoints except exercise browsing and authentication require a valid JWT
- Two roles exist: `ROLE_USER` (default) and `ROLE_ADMIN`
- Admins can create, update, and delete exercises; regular users cannot

### User Profile
- Each user has a profile with optional fields: height, weight, gender, bio, and fitness goal
- Users can view and edit their own profile
- Users can view other users' public profiles

### Exercise Catalog
- Admins can add exercises with name, description, muscle group, and image URL
- All users (including unauthenticated) can browse and search exercises by name or filter by muscle group
- Exercise listing is paginated and sortable

### Workout Splits & Templates
- Users can create named workout splits (e.g. "Push/Pull/Legs")
- A user can have at most one active split at a time; activating a new split deactivates the current one
- Each split contains ordered workout day templates (e.g. "Push Day")
- Each template lists exercises from the global catalog with optional target sets and reps

### Workout Logging
- Users can create a workout log against a template from their active split, with a date and optional photo URL
- Users can add exercise logs and set logs (weight × reps, optional RPE 1–10) to a workout log
- Users can mark a workout log as **Completed**
- Users can view their full workout history, paginated and sorted by date

### Social Features
- Users can follow and unfollow other users (a user cannot follow themselves)
- Users can share a completed workout as a post with an optional caption
- Users can view a paginated feed of posts from users they follow
- Users can view another user's public posts and profile

---

## ERD Diagram

```mermaid
erDiagram
    USER {
        bigint id PK
        varchar username UK
        varchar email UK
        varchar passwordHash
        boolean enabled
        timestamp createdAt
    }
    USER_PROFILE {
        bigint id PK
        bigint user_id FK
        int heightCm
        decimal weightKg
        varchar gender
        text bio
        varchar fitnessGoal
    }
    ROLE {
        bigint id PK
        varchar name
    }
    USER_ROLE {
        bigint user_id FK
        bigint role_id FK
    }
    WORKOUT_SPLIT {
        bigint id PK
        bigint user_id FK
        varchar name
        boolean isActive
        timestamp createdAt
    }
    WORKOUT_TEMPLATE {
        bigint id PK
        bigint split_id FK
        varchar name
        int orderIndex
    }
    EXERCISE {
        bigint id PK
        varchar name UK
        text description
        varchar muscleGroup
        varchar imageUrl
    }
    EXERCISE_TEMPLATE {
        bigint id PK
        bigint template_id FK
        bigint exercise_id FK
        int targetSets
        int targetReps
        int orderIndex
    }
    WORKOUT_LOG {
        bigint id PK
        bigint user_id FK
        bigint template_id FK
        date date
        varchar photoUrl
        varchar status
        text notes
        timestamp createdAt
    }
    EXERCISE_LOG {
        bigint id PK
        bigint workout_log_id FK
        bigint exercise_id FK
        text notes
    }
    SET_LOG {
        bigint id PK
        bigint exercise_log_id FK
        int setNumber
        decimal weightKg
        int reps
        int rpe
    }
    POST {
        bigint id PK
        bigint user_id FK
        bigint workout_log_id FK
        varchar caption
        timestamp createdAt
    }
    FOLLOW {
        bigint id PK
        bigint follower_id FK
        bigint followed_id FK
    }

    USER ||--o{ USER_ROLE : "has"
    ROLE ||--o{ USER_ROLE : "assigned to"
    USER ||--|| USER_PROFILE : "has"
    USER ||--o{ WORKOUT_SPLIT : "owns"
    WORKOUT_SPLIT ||--o{ WORKOUT_TEMPLATE : "contains"
    WORKOUT_TEMPLATE ||--o{ EXERCISE_TEMPLATE : "contains"
    EXERCISE ||--o{ EXERCISE_TEMPLATE : "referenced in"
    USER ||--o{ WORKOUT_LOG : "logs"
    WORKOUT_TEMPLATE ||--o{ WORKOUT_LOG : "used for"
    WORKOUT_LOG ||--o{ EXERCISE_LOG : "contains"
    EXERCISE ||--o{ EXERCISE_LOG : "logged in"
    EXERCISE_LOG ||--o{ SET_LOG : "has"
    USER ||--o{ POST : "creates"
    WORKOUT_LOG ||--o| POST : "shared as"
    USER ||--o{ FOLLOW : "follows (as follower)"
    USER ||--o{ FOLLOW : "followed by"
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 4.0.3, Java 21 |
| Frontend | React 19, TypeScript 5.9, Vite 8 |
| Database | PostgreSQL 17 |
| Auth | Spring Security + JWT (jjwt 0.13) |
| Styling | Tailwind CSS v4 |
| HTTP Client | Axios 1.13 |

---

## Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- JDK 21
- Node.js 20+

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd WorkoutTracker
```

### 2. Configure environment variables

Create a `.env` file in the `WorkoutTracker/` root:

```env
JWT_SECRET=your-secret-key-at-least-32-characters-long
```

> `JWT_SECRET` has no default — the backend will refuse to start without it.

### 3. Start the database

```bash
docker compose up -d
```

### 4. Start the backend

```bash
cd backend
export $(cat ../.env | xargs) && ./gradlew bootRun
```

Backend runs on `http://localhost:8080`. Verify with:

```bash
curl http://localhost:8080/actuator/health
# {"status":"UP"}
```

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`. The Vite dev server proxies `/api/*` → `localhost:8080`.

---

## Project Structure

```
WorkoutTracker/
├── backend/
│   └── src/main/java/com/workout_tracker/backend/
│       ├── config/        # Security, CORS, beans
│       ├── controller/    # REST controllers
│       ├── dto/           # Request/response objects
│       ├── exception/     # Global error handling
│       ├── model/         # JPA entities
│       ├── repository/    # Spring Data repositories
│       └── service/       # Business logic
├── frontend/
│   └── src/
│       ├── api/           # Axios instances & API calls
│       ├── components/    # Reusable UI components
│       ├── context/       # React context providers
│       ├── hooks/         # Custom hooks
│       ├── pages/         # Route-level components
│       └── types/         # TypeScript interfaces
├── docker-compose.yml     # PostgreSQL service
└── .env                   # Local environment variables (not committed)
```

---

## Backend Dependencies

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-webmvc` | REST API |
| `spring-boot-starter-data-jpa` | ORM / database access |
| `spring-boot-starter-security` | Authentication & authorization |
| `spring-boot-starter-validation` | Request validation |
| `spring-boot-starter-actuator` | Health & metrics endpoints |
| `jjwt-api / impl / jackson` | JWT token handling |
| `lombok` | Boilerplate reduction |
| `postgresql` | Production database driver |
| `h2` | In-memory database for tests |

## Frontend Dependencies

| Dependency | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `react-router` | Client-side routing |
| `axios` | HTTP requests to backend |
| `tailwindcss` | Utility-first styling |
