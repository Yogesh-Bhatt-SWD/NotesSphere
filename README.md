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
Store Journal in MySQL
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
MySQL

        + Spring Security
        + NLP / Sentiment Processing
```

Centralized exception handling using `@RestControllerAdvice` provides consistent API error responses.

---

## Tech Stack

| Technology          | Usage                          |
| ------------------- | ------------------------------ |
| Java 17+            | Backend                        |
| Spring Boot 3.3.5   | REST API                       |
| Spring Security     | Authentication & Authorization |
| JWT                 | Stateless authentication       |
| OAuth2              | Google Login                   |
| MySQL               | Data persistence               |
| Spring Data JPA     | Database access & ORM          |
| VADER               | Sentiment analysis             |
| Rule-Based NLP      | Categorization                 |
| Maven               | Build & dependency management  |
| Swagger / OpenAPI 3 | API documentation              |
| JUnit 5 & Mockito   | Testing                        |

---

## Running Locally

### Prerequisites

* Java 17+
* Maven 3.8+
* MySQL 8.0+ running on `localhost:3306` with database `db_notesphere`

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

## API Endpoints Reference

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a new user
* `POST /api/auth/login` — Authenticate and receive JWT tokens
* `POST /api/auth/refresh` — Refresh access token
* `POST /api/auth/logout` — Invalidate refresh tokens

### Journals (`/api/journals`)
* `POST /api/journals` — Create journal with auto-sentiment & category
* `GET /api/journals` — Filtered & paginated journals (`query`, `sentiment`, `category`, `tag`, `favorite`, `pinned`, `startDate`, `endDate`)
* `GET /api/journals/{id}` — Get single journal by ID (user-isolated)
* `PUT /api/journals/{id}` — Update journal (triggers auto-reanalysis if content changed)
* `DELETE /api/journals/{id}` — Delete journal
* `PATCH /api/journals/{id}/favorite` — Toggle favorite status
* `PATCH /api/journals/{id}/pin` — Toggle pinned status
* `GET /api/journals/search` — Search journals by title/content
* `GET /api/journals/tags` — Get all user-defined & auto tags
* `GET /api/journals/categories` — Get all user categories
* `GET /api/journals/export/json` — Export journals as JSON file
* `GET /api/journals/export/csv` — Export journals as CSV file

### Analytics & Calendar (`/api/analytics`)
* `GET /api/analytics` — Volume, sentiment distribution, category breakdown, timeline, streaks
* `GET /api/analytics/streaks` — Current and longest writing streak
* `GET /api/analytics/calendar/dates` — All active journaling dates (YYYY-MM-DD)
* `GET /api/analytics/calendar/monthly` — Monthly calendar with entries grouped by day

### Sentiment & NLP (`/api/sentiment`)
* `POST /api/sentiment/analyze` — Standalone VADER sentiment analysis
* `POST /api/sentiment/categorize` — Rule-based NLP categorization & scores
* `POST /api/sentiment/nlp-analyze` — Combined sentiment & category classification

### Reminders (`/api/reminders`)
* `GET /api/reminders` — Get reminder preferences
* `PUT /api/reminders` — Update reminder time, days, and channel
* `POST /api/reminders/test` — Trigger a test reminder

### Admin (`/api/admin`)
* `GET /api/admin/users` — Paginated user directory
* `PUT /api/admin/users/{id}/roles` — Update user roles (e.g., grant ROLE_ADMIN)
* `DELETE /api/admin/users/{id}` — Delete user and cascading data
* `GET /api/admin/stats` — Aggregate platform statistics

---

## Project Highlights

NoteSphere demonstrates a production-oriented backend combining:

**Secure Authentication → REST API Design → RBAC → User Data Isolation → MySQL & Spring Data JPA → VADER NLP → Dynamic Filtering & Specifications → Analytics & Calendar Streaks → Reminders → Data Export → Testing → API Documentation**
