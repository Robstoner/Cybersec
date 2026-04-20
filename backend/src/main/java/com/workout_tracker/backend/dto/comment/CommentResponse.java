package com.workout_tracker.backend.dto.comment;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        String body,
        String author,
        LocalDateTime createdAt,
        boolean canDelete
) {}
