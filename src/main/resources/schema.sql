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

-- 3. Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NULL,
    sentiment_label VARCHAR(50) NULL,
    compound_score DOUBLE NOT NULL DEFAULT 0.0,
    positive_score DOUBLE NOT NULL DEFAULT 0.0,
    negative_score DOUBLE NOT NULL DEFAULT 0.0,
    neutral_score DOUBLE NOT NULL DEFAULT 0.0,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_journal_user_id (user_id)
);

-- 4. Journal Entry Tags Table (ElementCollection for JournalEntry)
CREATE TABLE IF NOT EXISTS journal_entry_tags (
    journal_entry_id VARCHAR(36) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (journal_entry_id, tag),
    CONSTRAINT fk_journal_tags_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE
);

-- 5. Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    INDEX idx_refresh_token_user_id (user_id)
);
