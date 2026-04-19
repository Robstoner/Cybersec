package com.workout_tracker.backend.service;

import com.workout_tracker.backend.dto.admin.AdminUserResponse;
import com.workout_tracker.backend.dto.admin.UpdateUserRolesRequest;
import com.workout_tracker.backend.model.Role;
import com.workout_tracker.backend.model.User;
import com.workout_tracker.backend.repository.RoleRepository;
import com.workout_tracker.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponse updateUserRoles(Long userId, UpdateUserRolesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Set<Role> newRoles = new HashSet<>();
        for (String roleName : request.roles()) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalArgumentException("Role '" + roleName + "' not found"));
            newRoles.add(role);
        }
        user.setRoles(newRoles);
        userRepository.save(user);

        log.info("Updated roles for user '{}': {}", user.getUsername(), request.roles());
        return toResponse(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        userRepository.delete(user);
        log.info("Deleted user: {}", user.getUsername());
    }

    private AdminUserResponse toResponse(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.isEnabled(),
                user.getRoles().stream().map(Role::getName).toList(),
                user.getCreatedAt()
        );
    }
}
