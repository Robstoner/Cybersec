package com.workout_tracker.backend.exception;

// Thrown when a registration/login business rule is violated
// (e.g. username already taken, email already registered).
// Extends RuntimeException so it doesn't need to be declared in method signatures.
public class AuthException extends RuntimeException {

    public AuthException(String message) {
        super(message);
    }

    // Cause constructor — preserves the original exception in the chain for debugging.
    public AuthException(String message, Throwable cause) {
        super(message, cause);
    }
}
