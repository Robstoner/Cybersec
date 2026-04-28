package com.workout_tracker.backend.service;

import com.workout_tracker.backend.dto.profile.ProfileResponse;
import com.workout_tracker.backend.dto.profile.UpdateProfileRequest;
import com.workout_tracker.backend.model.Role;
import com.workout_tracker.backend.model.User;
import com.workout_tracker.backend.model.UserProfile;
import com.workout_tracker.backend.repository.RoleRepository;
import com.workout_tracker.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UserProfile profile = user.getProfile();

        return new ProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRoles().stream().map(Role::getName).toList(),
                profile != null ? profile.getBio() : null,
                profile != null ? profile.getHeightCm() : null,
                profile != null ? profile.getWeightKg() : null,
                profile != null ? profile.getGender() : null,
                profile != null ? profile.getFitnessGoal() : null,
                profile != null ? profile.getAvatarUrl() : null
        );
    }

    @Transactional
    public ProfileResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Update username if provided and different
        if (request.username() != null && !request.username().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.username())) {
                throw new IllegalArgumentException("Username '" + request.username() + "' is already taken");
            }
            user.setUsername(request.username());
        }

        // Update profile fields
        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile(user);
            user.setProfile(profile);
        }

        if (request.bio() != null) profile.setBio(request.bio());
        if (request.heightCm() != null) profile.setHeightCm(request.heightCm());
        if (request.weightKg() != null) profile.setWeightKg(request.weightKg());
        if (request.gender() != null) profile.setGender(request.gender());
        if (request.fitnessGoal() != null) profile.setFitnessGoal(request.fitnessGoal());
        if (request.avatarUrl() != null) profile.setAvatarUrl(request.avatarUrl());

        // Update roles if provided
        if (request.roles() != null && !request.roles().isEmpty()) {
            Set<Role> newRoles = new HashSet<>();
            for (String roleName : request.roles()) {
                roleRepository.findByName(roleName).ifPresent(newRoles::add);
            }
            if (!newRoles.isEmpty()) {
                user.setRoles(newRoles);
            }
        }

        userRepository.save(user);
        log.info("Profile updated for user: {}", user.getUsername());

        return new ProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRoles().stream().map(Role::getName).toList(),
                profile.getBio(),
                profile.getHeightCm(),
                profile.getWeightKg(),
                profile.getGender(),
                profile.getFitnessGoal(),
                profile.getAvatarUrl()
        );
    }

    // Fetches the given URL server-side and stores it as the user's avatar URL.
    // No scheme or host validation — intentionally vulnerable to SSRF.
    @Transactional
    public String fetchAndSetAvatar(String username, String urlStr) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile(user);
            user.setProfile(profile);
        }

        try {
            URL url = new URL(urlStr);
            try (InputStream is = url.openStream();
                 BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
                String content = reader.lines().collect(Collectors.joining("\n"));
                profile.setAvatarUrl(urlStr);
                userRepository.save(user);
                return content;
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch URL: " + e.getMessage());
        }
    }
}
