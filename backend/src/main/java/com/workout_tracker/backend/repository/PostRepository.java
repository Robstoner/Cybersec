package com.workout_tracker.backend.repository;

import com.workout_tracker.backend.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByOrderByCreatedAtDesc();

    @Query("SELECT DISTINCT p.author.username FROM Post p ORDER BY p.author.username")
    List<String> findDistinctAuthorUsernames();
}
