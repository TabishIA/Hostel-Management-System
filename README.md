```markdown
# Hostel Management System

This repository contains the backend and database foundation for a digital hostel management system. My work includes the PostgreSQL database setup and authentication system using Node.js and Express.js. Follow these steps to get it running and start building on it.

## Project Overview
- **Purpose**: Streamline hostel operations (complaints, leaves, etc.).
- **Tech Stack**: Node.js, Express.js, PostgreSQL.
- **Features Implemented**:
  - Database: Tables for `users`, `complaints`, and `leaves`.
  - Authentication: User registration and login with JWT.
  - API Endpoints: Basic routes for complaints and leaves.

## Project Structure
Hostel-Management-System/
├── backend/                # Node.js/Express backend
│   ├── config/             # Database connection (db.js)
│   ├── routes/             # API routes (users.js, complaints.js, leaves.js)
│   ├── middleware/         # Auth middleware (auth.js)
│   ├── server.js           # Main server file
│   ├── .env                # Environment variables (not committed)
│   └── package.json        # Backend dependencies
├── database/               # SQL scripts
│   ├── schema.sql          # Table creation
│   ├── seed.sql            # Sample data
│   └── README.md           # Database notes
├── frontend/               # Placeholder for React frontend
├── .gitignore              # Ignores node_modules, .env
└── README.md               # This file

## Prerequisites
Before starting, install these tools:
- [Node.js](https://nodejs.org/) (LTS version)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Postman](https://www.postman.com/) (for API testing)
- [Git](https://git-scm.com/) (to clone the repo)

## Step-by-Step Setup

### Step 1: Clone the Repository
Get the code on your machine:
```bash
git clone https://github.com/TabishIA/Hostel-Management-System.git
cd Hostel-Management-System
```

### Step 2: Set Up PostgreSQL Database
1. **Install PostgreSQL**:
   - Download and install PostgreSQL for your OS.
   - Start the PostgreSQL server (usually automatic after install).
2. **Create the Database**:
   - Open a terminal (Command Prompt on Windows, Terminal on macOS/Linux):
     ```bash
     psql -U postgres
     ```
   - Enter your PostgreSQL password if prompted.
   - Create the database:
     ```sql
     CREATE DATABASE hostel_management;
     ```
   - Connect to it:
     ```sql
     \c hostel_management
     ```
3. **Create Tables**:
   - Run the schema file:
     ```bash
     \i /path/to/Hostel-Management-System/database/schema.sql
     ```
     - Replace `/path/to/` with your actual path (e.g., `C:/Users/YourName/Hostel-Management-System/database/schema.sql` on Windows).
   - Verify tables:
     ```sql
     \dt
     ```
     - You should see `users`, `complaints`, and `leaves`.

### Step 3: Configure and Run the Backend
1. **Navigate to Backend**:
   ```bash
   cd backend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Set Up Environment Variables**:
   - Create a `.env` file in `backend/`:
     ```
     DB_USER=postgres
     DB_HOST=localhost
     DB_NAME=hostel_management
     DB_PASSWORD=your_postgres_password
     DB_PORT=5432
     JWT_SECRET=your_random_secret_key
     ```
     - Replace `your_postgres_password` with your PostgreSQL password.
     - Replace `your_random_secret_key` with a unique string (e.g., `supersecret123`).
4. **Start the Server**:
   ```bash
   node server.js
   ```
   - Server runs at `http://localhost:5000`. Keep this terminal open.
   - Test connection:
     - In a browser or Postman, visit `http://localhost:5000/test-db`. You should see a timestamp.

### Step 4: Register Users
The database starts empty. Use Postman to add users:
1. **Open Postman**:
   - Download and install if you haven’t.
   - Create a new request: "New" > "HTTP Request".
2. **Register a Student**:
   - Method: **POST**
   - URL: `http://localhost:5000/api/users/register`
   - Body > raw > JSON:
     ```json
     {
         "username": "student1",
         "password": "pass123",
         "role": "student"
     }
     ```
   - Click "Send." Success:
     ```json
     {
         "id": 1,
         "username": "student1",
         "role": "student"
     }
     ```
3. **Register an Authority**:
   - New request, same method and URL:
     ```json
     {
         "username": "admin1",
         "password": "pass123",
         "role": "authority"
     }
     ```
   - Send. Success:
     ```json
     {
         "id": 2,
         "username": "admin1",
         "role": "authority"
     }
     ```

### Step 5: Test Authentication
1. **Login**:
   - New Postman request:
     - Method: **POST**
     - URL: `http://localhost:5000/api/users/login`
     - Body > raw > JSON:
       ```json
       {
           "username": "student1",
           "password": "pass123"
       }
       ```
     - Send. Success:
       ```json
       {
           "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
       }
       ```
     - Copy the token for later use.
   - Test with `admin1:pass123` too.
2. **Roles**:
   - `student`: Can submit complaints/leaves.
   - `authority`: Can view all complaints/leaves.

### Step 6: Use the API
Protected endpoints need the JWT token in the `Authorization` header as `Bearer <token>`:
- In Postman, go to "Authorization" tab, select "Bearer Token," paste the token.

1. **Complaints**:
   - **Submit (Student)**:
     - Method: **POST**
     - URL: `http://localhost:5000/api/complaints`
     - Body > raw > JSON:
       ```json
       {
           "description": "Broken chair in room 101"
       }
       ```
     - Send with `student1` token.
   - **View All (Authority)**:
     - Method: **GET**
     - URL: `http://localhost:5000/api/complaints`
     - Send with `admin1` token.
2. **Leaves**:
   - **Request (Student)**:
     - Method: **POST**
     - URL: `http://localhost:5000/api/leaves`
     - Body > raw > JSON:
       ```json
       {
           "reason": "Medical appointment",
           "start_date": "2025-04-05",
           "end_date": "2025-04-05"
       }
       ```
     - Send with `student1` token.
   - **View All (Authority)**:
     - Method: **GET**
     - URL: `http://localhost:5000/api/leaves`
     - Send with `admin1` token.

### Step 7: (Optional) Seed Sample Data
Add sample complaints/leaves after registering users:
1. Run:
   ```bash
   psql -U postgres -d hostel_management -f /path/to/Hostel-Management-System/database/seed.sql
   ```
2. Verify:
   ```sql
   SELECT * FROM complaints;
   SELECT * FROM leaves;
   ```

## Troubleshooting
- **Database Connection Fails**: Check `.env` values and ensure PostgreSQL is running.
- **Invalid Credentials**: Re-register users if login fails.
- **API Errors**: Ensure server is running and tokens are valid (they expire after 1 hour).
- **Path Issues**: Adjust file paths in commands to match your system.
