package com.workout_tracker.backend.config;

import com.workout_tracker.backend.model.Role;
import com.workout_tracker.backend.model.User;
import com.workout_tracker.backend.model.UserProfile;
import com.workout_tracker.backend.repository.RoleRepository;
import com.workout_tracker.backend.repository.UserProfileRepository;
import com.workout_tracker.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

// Runs once after the application has fully started.
// Seeds the roles table and (optionally) a default admin user so AuthService can
// always find ROLE_USER / ROLE_ADMIN without racing under concurrent registrations.
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:}")
    private String adminUsername;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        createRoleIfMissing(Role.ROLE_USER);
        createRoleIfMissing(Role.ROLE_ADMIN);
        seedAdminIfConfigured();
    }

    private void createRoleIfMissing(String roleName) {
        if (roleRepository.findByName(roleName).isEmpty()) {
            roleRepository.save(new Role(roleName));
            log.info("Seeded role: {}", roleName);
        }
    }

    // Opt-in: only runs if ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD are all set.
    // Never touches an existing user — won't overwrite passwords or revoke roles on restart.
    private void seedAdminIfConfigured() {
        if (adminUsername.isBlank() || adminEmail.isBlank() || adminPassword.isBlank()) {
            log.info("Admin seeding skipped (app.admin.* not configured)");
            return;
        }
        if (userRepository.existsByUsername(adminUsername)) {
            log.info("Admin user '{}' already exists — skipping seed", adminUsername);
            return;
        }

        Role adminRole = roleRepository.findByName(Role.ROLE_ADMIN)
                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN missing after role seeding"));

        User admin = new User();
        admin.setUsername(adminUsername);
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.getRoles().add(adminRole);
        userRepository.save(admin);

        // Mirror AuthService.register(): create the profile and set the back-reference
        UserProfile profile = userProfileRepository.save(new UserProfile(admin));
        admin.setProfile(profile);

        log.info("Seeded admin user: {}", adminUsername);
    }
}
