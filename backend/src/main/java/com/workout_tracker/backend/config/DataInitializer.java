package com.workout_tracker.backend.config;

import com.workout_tracker.backend.model.Role;
import com.workout_tracker.backend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

// Runs once after the application has fully started.
// Seeds the roles table so AuthService.register() can always do a plain orElseThrow()
// instead of a risky orElseGet(save) that races under concurrent registrations.
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final RoleRepository roleRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedRoles() {
        createRoleIfMissing(Role.ROLE_USER);
        createRoleIfMissing(Role.ROLE_ADMIN);
    }

    private void createRoleIfMissing(String roleName) {
        if (roleRepository.findByName(roleName).isEmpty()) {
            roleRepository.save(new Role(roleName));
            log.info("Seeded role: {}", roleName);
        }
    }
}
