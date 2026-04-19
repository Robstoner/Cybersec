package com.workout_tracker.backend.dto.profile;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateProfileRequest(
        @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username may only contain letters, numbers, and underscores")
        String username,

        @Size(max = 500, message = "Bio must be at most 500 characters")
        String bio,

        Double heightCm,
        Double weightKg,
        String gender,
        String fitnessGoal,

        // Used by admin panel to manage user roles
        List<String> roles
) {}
