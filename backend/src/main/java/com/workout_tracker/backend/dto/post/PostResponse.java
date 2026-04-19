package com.workout_tracker.backend.dto.post;

import com.workout_tracker.backend.dto.comment.CommentResponse;

import java.time.LocalDateTime;
import java.util.List;

// Unified response for feed listing and detail view.
// `comments` is null for feed listings and populated for the detail endpoint.
public record PostResponse(
        Long id,
        String title,
        String body,
        String imageUrl,
        String author,
        LocalDateTime createdAt,
        boolean canDelete,
        List<CommentResponse> comments
) {}
