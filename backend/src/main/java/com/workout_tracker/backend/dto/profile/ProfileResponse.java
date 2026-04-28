package com.workout_tracker.backend.dto.profile;

import java.util.List;

public record ProfileResponse(
        Long id,
        String username,
        String email,
        List<String> roles,
        String bio,
        Double heightCm,
        Double weightKg,
        String gender,
        String fitnessGoal,
        String avatarUrl
) {}
