# NoteSphere — Intelligent Journal Management Platform

**NoteSphere** is a secure Spring Boot REST API for personal journaling. Users can create, manage, and privately access their journal entries while the system automatically analyzes the content for **sentiment and category** using VADER and rule-based NLP.

## What Can Users Do?

* **Register & Login** using email/password.
* **Login with Google** using OAuth2.
* Create, view, update, and delete their **personal journals**.
* Automatically get **sentiment analysis** for every journal:

  * Positive
  * Neutral
  * Negative
* Automatically **categorize journals** based on their content, such as:

  * Work
  * Health
  * Travel
  * etc.
* View their journal history while ensuring **other users cannot access their journals**.
* Use secure APIs protected by **JWT authentication and RBAC**.

### Example

A user writes:

> "Today I completed my project and had a great meeting with my team."

NoteSphere processes the entry and stores information such as:

```text
Journal
├── Content
├── Sentiment: Positive
├── Sentiment Score
└── Category: Work
```

So the application doesn't just **store journal text** — it also **understands and organizes the content**.

---

## Authentication & Authorization

* Stateless **JWT authentication**
* **Refresh token rotation**
* **Google OAuth2 login**
* Role-Based Access Control:

  * `USER`
  * `ADMIN`
* User-level data isolation
* Protected administrative APIs

Authentication flow:

```text
Login / Google OAuth2
        ↓
Authentication
        ↓
Access + Refresh Token
        ↓
JWT Validation
        ↓
Authorized API Request
```

---

## Intelligent Journal Processing

Whenever a journal is created:

```text
Journal Content
      ↓
VADER Sentiment Analysis
      ↓
Positive / Neutral / Negative
      ↓
Rule-Based NLP
      ↓
Keywords & Category
      ↓
Store Journal in MongoDB
```

---

## Admin Capabilities

Admins can access protected platform-level APIs for:

* User management
* Platform statistics
* Administrative operations

These APIs are restricted using Spring Security roles.

---

## Architecture

The application follows a layered Spring Boot architecture:

```text
Client
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
MongoDB

        + Spring Security
        + NLP / Sentiment Processing
```

Centralized exception handling using `@RestControllerAdvice` provides consistent API error responses.

---

## Tech Stack

| Technology          | Usage                          |
| ------------------- | ------------------------------ |
| Java 21             | Backend                        |
| Spring Boot 3.3.5   | REST API                       |
| Spring Security     | Authentication & Authorization |
| JWT                 | Stateless authentication       |
| OAuth2              | Google Login                   |
| MongoDB             | Data persistence               |
| Spring Data MongoDB | Database access                |
| VADER               | Sentiment analysis             |
| Rule-Based NLP      | Categorization                 |
| Maven               | Build & dependency management  |
| Swagger / OpenAPI 3 | API documentation              |
| JUnit 5 & Mockito   | Testing                        |

---

## Running Locally

### Prerequisites

* Java 21+
* Maven 3.8+
* MongoDB running on `localhost:27017`

### Clone & Run

```bash
git clone <repo-url>
cd NOTESPHERE

mvn clean install
mvn spring-boot:run
```

Configure the following environment variables for authentication:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
JWT_SECRET
```

Run tests:

```bash
mvn test
```

---

## Project Highlights

NoteSphere demonstrates a production-oriented backend combining:

**Secure Authentication → REST API Design → RBAC → User Data Isolation → MongoDB → NLP → Sentiment Analysis → Automated Categorization → Testing → API Documentation**
