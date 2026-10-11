-- Schema definition for NoteSphere MySQL Database
-- Database: db_notesphere

CREATE DATABASE IF NOT EXISTS db_notesphere;
USE db_notesphere;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    provider VARCHAR(50) DEFAULT 'LOCAL',
    provider_id VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. User Roles Table (ElementCollection for User)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_predefined BOOLEAN NOT NULL DEFAULT FALSE,
    user_id VARCHAR(36) NULL,
    icon VARCHAR(50) NULL,
    color VARCHAR(30) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_user_id (user_id),
    INDEX idx_category_name (name)
);

-- 4. Communities Table
CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500) NULL,
    icon VARCHAR(50) DEFAULT 'Users',
    category VARCHAR(100) DEFAULT 'General',
    creator_id VARCHAR(36) NOT NULL,
    member_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_community_name (name),
    INDEX idx_community_category (category)
);

-- 5. Community Members Table
CREATE TABLE IF NOT EXISTS community_members (
    id VARCHAR(36) PRIMARY KEY,
    community_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cm_community_id (community_id),
    INDEX idx_cm_user_id (user_id),
    UNIQUE INDEX idx_cm_unique_member (community_id, user_id),
    CONSTRAINT fk_cm_community FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);

-- 6. Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content LONGTEXT NULL,
    category VARCHAR(100) DEFAULT 'General',
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    visibility VARCHAR(30) NOT NULL DEFAULT 'PRIVATE',
    community_id VARCHAR(36) NULL,
    community_name VARCHAR(100) NULL,
    published_at TIMESTAMP NULL,
    like_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    sentiment_label VARCHAR(50) NULL,
    compound_score DOUBLE NOT NULL DEFAULT 0.0,
    positive_score DOUBLE NOT NULL DEFAULT 0.0,
    negative_score DOUBLE NOT NULL DEFAULT 0.0,
    neutral_score DOUBLE NOT NULL DEFAULT 0.0,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_journal_user_id (user_id),
    INDEX idx_journal_created_at (created_at),
    INDEX idx_journal_favorite (user_id, is_favorite),
    INDEX idx_journal_pinned (user_id, is_pinned),
    INDEX idx_journal_visibility (visibility, community_id)
);

-- 7. Journal Entry Tags Table (ElementCollection for JournalEntry)
CREATE TABLE IF NOT EXISTS journal_entry_tags (
    journal_entry_id VARCHAR(36) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (journal_entry_id, tag),
    CONSTRAINT fk_journal_tags_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE
);

-- 8. Post Comments Table
CREATE TABLE IF NOT EXISTS post_comments (
    id VARCHAR(36) PRIMARY KEY,
    journal_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    content VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pc_journal_id (journal_id),
    INDEX idx_pc_user_id (user_id),
    CONSTRAINT fk_pc_journal FOREIGN KEY (journal_id) REFERENCES journal_entries(id) ON DELETE CASCADE
);

-- 9. Post Reactions Table
CREATE TABLE IF NOT EXISTS post_reactions (
    id VARCHAR(36) PRIMARY KEY,
    journal_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    reaction_type VARCHAR(30) NOT NULL DEFAULT 'LIKE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pr_journal_id (journal_id),
    UNIQUE INDEX idx_pr_unique_reaction (journal_id, user_id),
    CONSTRAINT fk_pr_journal FOREIGN KEY (journal_id) REFERENCES journal_entries(id) ON DELETE CASCADE
);

-- 10. Post Reports Table
CREATE TABLE IF NOT EXISTS post_reports (
    id VARCHAR(36) PRIMARY KEY,
    journal_id VARCHAR(36) NOT NULL,
    reporter_id VARCHAR(36) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_report_journal_id (journal_id),
    INDEX idx_report_status (status)
);

-- 11. Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    replaced_by_token VARCHAR(255) NULL,
    INDEX idx_refresh_token_user_id (user_id),
    INDEX idx_refresh_token_token (token)
);

-- 12. Reminder Preferences Table
CREATE TABLE IF NOT EXISTS reminder_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_time VARCHAR(10) NOT NULL DEFAULT '20:00',
    channel VARCHAR(30) DEFAULT 'EMAIL',
    email VARCHAR(150) NULL,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reminder_user_id (user_id),
    CONSTRAINT fk_reminder_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Reminder Days Table (ElementCollection for ReminderPreference)
CREATE TABLE IF NOT EXISTS reminder_days (
    reminder_id VARCHAR(36) NOT NULL,
    day VARCHAR(20) NOT NULL,
    PRIMARY KEY (reminder_id, day),
    CONSTRAINT fk_reminder_days_pref FOREIGN KEY (reminder_id) REFERENCES reminder_preferences(id) ON DELETE CASCADE
);
