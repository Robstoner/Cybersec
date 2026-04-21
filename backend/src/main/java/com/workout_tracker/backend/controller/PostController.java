package com.workout_tracker.backend.controller;

import com.workout_tracker.backend.dto.comment.CommentCreateRequest;
import com.workout_tracker.backend.dto.comment.CommentResponse;
import com.workout_tracker.backend.dto.post.PostResponse;
import com.workout_tracker.backend.service.CommentService;
import com.workout_tracker.backend.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final CommentService commentService;

    @GetMapping
    public List<PostResponse> list() {
        return postService.listFeed();
    }

    @GetMapping("/search")
    public List<PostResponse> search(@RequestParam("q") String q) {
        return postService.searchPosts(q);
    }

    @GetMapping("/{id}")
    public PostResponse get(@PathVariable Long id) {
        return postService.getPost(id);
    }

    // Multipart so we can accept title, body, and an optional image file in one request.
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> create(
            @RequestParam("title") String title,
            @RequestParam("body") String body,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "filename", required = false) String filename) {
        PostResponse created = postService.createPost(title, body, image, filename);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.addComment(id, request));
    }
}
