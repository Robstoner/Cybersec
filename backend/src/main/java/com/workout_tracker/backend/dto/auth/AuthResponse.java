package com.workout_tracker.backend.dto.auth;

import java.util.List;

// Returned by both /register and /login.
// The frontend stores `token` in localStorage and attaches it as Bearer on every request.
public record AuthResponse(
        String token,
        String username,
        List<String> roles
) {}
