# NoteSphere | Intelligent Journal Management Platform

NoteSphere is a production-grade Spring Boot REST API backend designed for secure, intelligent personal journaling. It features JWT and Google OAuth2 authentication, Role-Based Access Control (RBAC), and leverages VADER sentiment analysis and rule-based NLP to automatically categorize and analyze journal entries.

## Tech Stack
* **Java 21**
* **Spring Boot 3.3.5**
* **MongoDB** (Spring Data MongoDB)
* **Spring Security** (JWT + OAuth2)
* **Maven**
* **Swagger/OpenAPI 3.0**
* **VADER Sentiment Analysis** (Java Port)
* **JUnit 5 & Mockito**

## Core Features
1. **Secure Authentication:** Stateless JWT authentication with refresh token rotation.
2. **Social Login:** Google OAuth2 integration seamlessly tied into the JWT lifecycle.
3. **Sentiment Analysis:** Every journal entry is automatically scored (Positive, Neutral, Negative) using the VADER algorithm.
4. **Intelligent Tagging:** Rule-based NLP extracts keywords and auto-categorizes journals (e.g., Work, Health, Travel).
5. **RBAC & Data Isolation:** Granular role permissions (USER, ADMIN) and strict tenant isolation at the repository/service layer.
6. **Admin Dashboard APIs:** Platform-wide statistics and user management endpoints.
7. **Comprehensive Testing:** Unit and integration test coverage.
8. **Interactive Documentation:** Swagger UI for API exploration.

## Prerequisites
* Java 21+
* Maven 3.8+
* MongoDB running on `localhost:27017`

## Setup & Running

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd NOTESPHERE
   ```

2. **Configure Environment Variables (Optional):**
   Update `src/main/resources/application.yml` or set environment variables for Google OAuth2:
   * `GOOGLE_CLIENT_ID`
   * `GOOGLE_CLIENT_SECRET`
   * `JWT_SECRET`

3. **Build and Run:**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

4. **Access the API Documentation:**
   * Swagger UI: `http://localhost:8080/swagger-ui/index.html`
   * OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Architecture Overview
The application follows standard Spring Boot layered architecture:
`Controllers -> Services -> Repositories -> MongoDB`

Exception handling is centralized using a `@RestControllerAdvice` to ensure consistent `ApiResponse` payload structures across all endpoints.
