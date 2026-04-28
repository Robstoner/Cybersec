package com.workout_tracker.backend.controller;

import com.workout_tracker.backend.dto.profile.ProfileResponse;
import com.workout_tracker.backend.dto.profile.UpdateProfileRequest;
import com.workout_tracker.backend.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(profileService.getProfile(userDetails.getUsername()));
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(userDetails.getUsername(), request));
    }

    @PostMapping("/fetch-avatar")
    public ResponseEntity<Map<String, String>> fetchAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        String content = profileService.fetchAndSetAvatar(userDetails.getUsername(), body.get("url"));
        return ResponseEntity.ok(Map.of("content", content));
    }
}
