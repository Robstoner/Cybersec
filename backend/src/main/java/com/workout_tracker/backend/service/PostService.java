package com.workout_tracker.backend.service;

import com.workout_tracker.backend.dto.comment.CommentResponse;
import com.workout_tracker.backend.dto.post.PostResponse;
import com.workout_tracker.backend.model.Comment;
import com.workout_tracker.backend.model.Post;
import com.workout_tracker.backend.model.Role;
import com.workout_tracker.backend.model.User;
import com.workout_tracker.backend.repository.PostRepository;
import com.workout_tracker.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<PostResponse> listFeed() {
        Optional<User> currentUser = getCurrentUserOptional();
        return postRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(p -> toResponse(p, currentUser.orElse(null), false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> searchPosts(String query, String author, String sort, LocalDate from, LocalDate to) {
        List<Post> posts;
        if (query != null && !query.isBlank()) {
            String sql = "SELECT id FROM posts WHERE title LIKE '%" + query + "%' ORDER BY created_at DESC";
            log.info("Executing search SQL: {}", sql);
            List<Long> ids = jdbcTemplate.queryForList(sql, Long.class);
            posts = new ArrayList<>();
            for (Long id : ids) {
                postRepository.findById(id).ifPresent(posts::add);
            }
        } else {
            posts = new ArrayList<>(postRepository.findAll());
        }

        Stream<Post> stream = posts.stream();
        if (author != null && !author.isBlank()) {
            stream = stream.filter(p -> p.getAuthor().getUsername().equalsIgnoreCase(author));
        }
        if (from != null) {
            stream = stream.filter(p -> !p.getCreatedAt().toLocalDate().isBefore(from));
        }
        if (to != null) {
            stream = stream.filter(p -> !p.getCreatedAt().toLocalDate().isAfter(to));
        }

        Comparator<Post> cmp = Comparator.comparing(Post::getCreatedAt);
        if (!"oldest".equalsIgnoreCase(sort)) {
            cmp = cmp.reversed();
        }
        List<Post> sorted = stream.sorted(cmp).toList();

        Optional<User> currentUser = getCurrentUserOptional();
        return sorted.stream()
                .map(p -> toResponse(p, currentUser.orElse(null), false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> listAuthors() {
        return postRepository.findDistinctAuthorUsernames();
    }

    @Transactional(readOnly = true)
    public PostResponse getPost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        return toResponse(post, getCurrentUserOptional().orElse(null), true);
    }

    @Transactional
    public PostResponse createPost(String title, String body, MultipartFile image, String filename) {
        User author = getCurrentUser();
        Post post = new Post();
        post.setTitle(title);
        post.setBody(body);
        post.setAuthor(author);
        if (image != null && !image.isEmpty()) {
            post.setImagePath(fileStorageService.store(image, filename));
        }
        Post saved = postRepository.save(post);
        log.info("User {} created post {}", author.getUsername(), saved.getId());
        return toResponse(saved, author, false);
    }

    @Transactional
    public void deletePost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        User currentUser = getCurrentUser();
        if (!canDelete(post, currentUser)) {
            throw new AccessDeniedException("Not allowed to delete this post");
        }
        postRepository.delete(post);
        log.info("User {} deleted post {}", currentUser.getUsername(), id);
    }

    PostResponse toResponse(Post post, User currentUser, boolean includeComments) {
        String imageUrl = post.getImagePath() == null ? null : "/api/files?path=" + post.getImagePath();
        List<CommentResponse> commentResponses = null;
        if (includeComments) {
            commentResponses = post.getComments().stream()
                    .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                    .map(c -> toCommentResponse(c, currentUser))
                    .toList();
        }
        return new PostResponse(
                post.getId(),
                post.getTitle(),
                post.getBody(),
                imageUrl,
                post.getAuthor().getUsername(),
                post.getCreatedAt(),
                canDelete(post, currentUser),
                commentResponses
        );
    }

    private CommentResponse toCommentResponse(Comment c, User currentUser) {
        boolean canDelete = currentUser != null
                && (c.getAuthor().getId().equals(currentUser.getId()) || hasAdminRole(currentUser));
        return new CommentResponse(
                c.getId(),
                c.getBody(),
                c.getAuthor().getUsername(),
                c.getCreatedAt(),
                canDelete
        );
    }

    private boolean canDelete(Post post, User currentUser) {
        if (currentUser == null) return false;
        return post.getAuthor().getId().equals(currentUser.getId()) || hasAdminRole(currentUser);
    }

    private boolean hasAdminRole(User user) {
        return user.getRoles().stream().anyMatch(r -> Role.ROLE_ADMIN.equals(r.getName()));
    }

    private User getCurrentUser() {
        return getCurrentUserOptional()
                .orElseThrow(() -> new IllegalStateException("No authenticated user in context"));
    }

    // Write paths call getCurrentUser(). Read paths use this so anonymous requests don't crash.
    private Optional<User> getCurrentUserOptional() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return Optional.empty();
        }
        return userRepository.findByUsername(auth.getName());
    }
}
