-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,          -- Auto-incrementing ID
    username VARCHAR(50) UNIQUE NOT NULL,  -- Unique username, max 50 chars
    password VARCHAR(255) NOT NULL, -- Hashed password
    role VARCHAR(20) NOT NULL      -- 'student' or 'authority'
);

-- Create Complaints table
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),  -- Links to users table
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Leaves table
CREATE TABLE leaves (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    reason TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending'
);

-- Create Rooms table
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,          -- Unique room ID
    room_number VARCHAR(10) UNIQUE NOT NULL,  -- e.g., "101", "A-12"
    capacity INTEGER NOT NULL CHECK (capacity > 0),  -- Max students allowed
    description TEXT                -- Optional details (e.g., "Near canteen")
);

-- Add room_id to Users table to link students to rooms
ALTER TABLE users
ADD COLUMN room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL;