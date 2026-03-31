package com.workout_tracker.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_profiles")
@Getter @Setter @NoArgsConstructor
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Double heightCm;
    private Double weightKg;

    private String gender;

    @Column(length = 500)
    private String bio;

    private String fitnessGoal;

    public UserProfile(User user) {
        this.user = user;
    }
}