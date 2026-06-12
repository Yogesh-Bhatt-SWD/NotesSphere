package com.notesphere;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/**
 * NoteSphere — Intelligent Journal Management Platform
 * Main entry point for the Spring Boot application.
 */
@SpringBootApplication
@EnableMongoAuditing
public class NoteSphereApplication {

    public static void main(String[] args) {
        SpringApplication.run(NoteSphereApplication.class, args);
    }
}
