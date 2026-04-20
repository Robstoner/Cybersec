package com.workout_tracker.backend.dto.comment;

import jakarta.validation.constraints.NotBlank;

public record CommentCreateRequest(
        @NotBlank(message = "Comment body is required")
        String body
) {}
