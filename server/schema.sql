DROP DATABASE IF EXISTS event_management_system_db;
CREATE DATABASE IF NOT EXISTS event_management_system_db;
USE event_management_system_db;

DROP TABLE IF EXISTS event_tasks;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
) AUTO_INCREMENT = 1000;

CREATE TABLE venues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    capacity INT NOT NULL
) AUTO_INCREMENT = 1000;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'organizer', 'attendee') DEFAULT 'attendee'
) AUTO_INCREMENT = 1000;

-- Default admin user: admin@gmail.com / admin123
INSERT INTO users (id, email, password_hash, full_name, role) 
VALUES (1000, 'admin@gmail.com', '$2a$10$7zVn1S8s7C7vG1vG1vG1vOuWvYkO5H7L3k.7Z.7Z.7Z.7Z.7Z.7Z.', 'System Admin', 'admin');

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    capacity INT NOT NULL,
    image_url VARCHAR(255),
    organizer_id INT,
    venue_id INT,
    category_id INT,
    status ENUM('published', 'draft', 'completed') DEFAULT 'published',
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) AUTO_INCREMENT = 1000;

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    event_id INT,
    booked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    ticket_count INT NOT NULL DEFAULT 1,
    is_checked_in BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) AUTO_INCREMENT = 1000;

CREATE TABLE event_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    task_name VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) AUTO_INCREMENT = 1000;
