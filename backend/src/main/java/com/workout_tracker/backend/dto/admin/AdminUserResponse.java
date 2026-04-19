package com.workout_tracker.backend.dto.admin;

import java.time.LocalDateTime;
import java.util.List;

public record AdminUserResponse(
        Long id,
        String username,
        String email,
        boolean enabled,
        List<String> roles,
        LocalDateTime createdAt
) {}
