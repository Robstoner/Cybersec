package com.workout_tracker.backend.dto.admin;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpdateUserRolesRequest(
        @NotEmpty(message = "Roles list must not be empty")
        List<String> roles
) {}
