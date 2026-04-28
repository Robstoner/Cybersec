package com.workout_tracker.backend.service;

import com.workout_tracker.backend.dto.comment.CommentCreateRequest;
import com.workout_tracker.backend.dto.comment.CommentResponse;
import com.workout_tracker.backend.model.Comment;
import com.workout_tracker.backend.model.Post;
import com.workout_tracker.backend.model.Role;
import com.workout_tracker.backend.model.User;
import com.workout_tracker.backend.repository.CommentRepository;
import com.workout_tracker.backend.repository.PostRepository;
import com.workout_tracker.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional
    public CommentResponse addComment(Long postId, CommentCreateRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        User author = getCurrentUser();

        Comment comment = new Comment();
        comment.setBody(request.body());
        comment.setPost(post);
        comment.setAuthor(author);

        Comment saved = commentRepository.save(comment);
        log.info("User {} commented on post {}", author.getUsername(), postId);
        return new CommentResponse(
                saved.getId(),
                saved.getBody(),
                author.getUsername(),
                author.getProfile() != null ? author.getProfile().getAvatarUrl() : null,
                saved.getCreatedAt(),
                true
        );
    }

    @Transactional
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
        User currentUser = getCurrentUser();
        boolean isAuthor = comment.getAuthor().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> Role.ROLE_ADMIN.equals(r.getName()));
        if (!isAuthor && !isAdmin) {
            throw new AccessDeniedException("Not allowed to delete this comment");
        }
        commentRepository.delete(comment);
        log.info("User {} deleted comment {}", currentUser.getUsername(), commentId);
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + username));
    }
}
