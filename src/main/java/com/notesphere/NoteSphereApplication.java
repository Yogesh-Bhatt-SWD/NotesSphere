package com.notesphere;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * NoteSphere — Intelligent Journal Management Platform
 * Main entry point for the Spring Boot application.
 */
@SpringBootApplication
@EnableScheduling
public class NoteSphereApplication {

    public static void main(String[] args) {
        SpringApplication.run(NoteSphereApplication.class, args);
    }
}
