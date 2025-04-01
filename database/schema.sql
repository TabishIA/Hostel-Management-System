DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- Create Rooms table
CREATE TABLE rooms (
    room_number VARCHAR(10) PRIMARY KEY, -- Changed from id SERIAL to room_number VARCHAR(10)
    capacity INTEGER NOT NULL,
    description VARCHAR(255)
);

-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    family_contact VARCHAR(15),
    branch VARCHAR(10) CHECK (branch IN ('CSE', 'IT', 'ENTC', 'ECE', 'AI&DS')),
    class VARCHAR(10) CHECK (class IN ('FE1', 'FE2', 'FE3', 'FE4', 'FE5', 'FE6', 'FE7', 'FE8', 'FE9', 'FE10', 'FE11', 'SE1', 'SE2', 'SE3', 'SE4', 'SE5', 'SE6', 'SE7', 'SE8', 'SE9', 'SE10', 'SE11', 'TE1', 'TE2', 'TE3', 'TE4', 'TE5', 'TE6', 'TE7', 'TE8', 'TE9', 'TE10', 'TE11')),
    room_number VARCHAR(10) REFERENCES rooms(room_number) ON DELETE SET NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'authority')),
    password_reset_otp VARCHAR(6),
    password_reset_expires TIMESTAMP
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

-- Create Attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) REFERENCES users(username) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'absent' CHECK (status IN ('present', 'absent')),
    check_in_time TIMESTAMP,
    UNIQUE (username, date)
);