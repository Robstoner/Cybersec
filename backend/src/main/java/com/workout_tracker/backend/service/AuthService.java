package com.workout_tracker.backend.service;

import com.workout_tracker.backend.dto.auth.AuthResponse;
import com.workout_tracker.backend.dto.auth.LoginRequest;
import com.workout_tracker.backend.dto.auth.RegisterRequest;
import com.workout_tracker.backend.exception.AuthException;
import com.workout_tracker.backend.model.Role;
import com.workout_tracker.backend.model.User;
import com.workout_tracker.backend.model.UserProfile;
import com.workout_tracker.backend.repository.RoleRepository;
import com.workout_tracker.backend.repository.UserRepository;
import com.workout_tracker.backend.repository.UserProfileRepository;
import com.workout_tracker.backend.security.JwtService;
import com.workout_tracker.backend.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new AuthException("Username '" + request.username() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new AuthException("Email '" + request.email() + "' is already registered");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));

        // DataInitializer seeds ROLE_USER at startup — orElseThrow is safe here.
        Role userRole = roleRepository.findByName(Role.ROLE_USER)
                .orElseThrow(() -> new IllegalStateException(
                        "ROLE_USER not found in database — DataInitializer may have failed"));
        user.getRoles().add(userRole);

        userRepository.save(user);

        // Set the back-reference so user.getProfile() returns the profile in the same transaction.
        // Without this, user.profile stays null in-memory even though the DB row exists.
        UserProfile profile = userProfileRepository.save(new UserProfile(user));
        user.setProfile(profile);

        log.info("New user registered: {}", user.getUsername());

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtService.generateToken(userDetails);

        return new AuthResponse(token, user.getUsername(), List.of(Role.ROLE_USER));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // AuthenticationManager checks the password against the BCrypt hash.
        // Throws BadCredentialsException if wrong — caught by GlobalExceptionHandler → 401.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.username());
        String token = jwtService.generateToken(userDetails);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        log.info("User logged in: {}", request.username());

        return new AuthResponse(token, request.username(), roles);
    }
}
