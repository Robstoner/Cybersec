package com.workout_tracker.backend.controller;

import com.workout_tracker.backend.dto.auth.AuthResponse;
import com.workout_tracker.backend.dto.auth.LoginRequest;
import com.workout_tracker.backend.dto.auth.RegisterRequest;
import com.workout_tracker.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // @Valid triggers Bean Validation on the request body.
    // If any @NotBlank / @Email / @Size fails, Spring throws MethodArgumentNotValidException
    // which GlobalExceptionHandler converts to a 400 with field error details.
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
