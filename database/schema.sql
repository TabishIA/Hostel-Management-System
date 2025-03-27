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