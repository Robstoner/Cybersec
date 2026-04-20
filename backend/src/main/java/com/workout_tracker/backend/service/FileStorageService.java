package com.workout_tracker.backend.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

// Deliberately permissive: no MIME checks, no size caps, keeps the client-provided
// filename/extension. Validation will be tightened later as part of the security exercise.
@Service
@Slf4j
public class FileStorageService {

    @Value("${app.storage.upload-dir}")
    private String uploadDir;

    private Path uploadPath;

    @PostConstruct
    void init() throws IOException {
        uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);
        log.info("Upload directory: {}", uploadPath);
    }

    public String store(MultipartFile file) {
        try {
            String original = file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();
            String ext = "";
            int dot = original.lastIndexOf('.');
            if (dot >= 0) {
                ext = original.substring(dot);
            }
            String filename = UUID.randomUUID() + ext;
            Path target = uploadPath.resolve(filename);
            file.transferTo(target);
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store uploaded file", e);
        }
    }
}
