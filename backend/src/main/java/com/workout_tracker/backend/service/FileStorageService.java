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

    public String store(MultipartFile file, String filenameOverride) {
        try {
            String name;
            if (filenameOverride != null && !filenameOverride.isBlank()) {
                name = filenameOverride;
            } else {
                name = file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();
            }
            Path target = uploadPath.resolve(name);
            Files.createDirectories(target.getParent());
            file.transferTo(target);
            log.info("Stored upload at {}", target);
            return name;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store uploaded file", e);
        }
    }

    public Path resolve(String relativePath) {
        return uploadPath.resolve(relativePath);
    }
}
