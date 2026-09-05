-- SQL Schema for XAMPP MySQL Registration System

CREATE DATABASE IF NOT EXISTS register_db;
USE register_db;

-- Table to store registered users (Phone number must be unique)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store Admin credentials (No public registration allowed)
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-seed default admin account (SeyhaAdmin / Seyha@123) if empty
INSERT IGNORE INTO admin_users (id, username, password) VALUES (1, 'SeyhaAdmin', 'Seyha@123');
