# Backend Setup
1. `cd backend`
2. `npm install`
3. Create `.env` (see `.env` section below).
4. `node server.js`

# API Endpoints

## Users
- **Add Student (Warden)**: `POST /api/users/add-student` (Warden-only)
  ```json
  {
      "username": "REG123",           // Required: College registration number
      "name": "John Doe",             // Required
      "roll_number": "R123",          // Required: Must be unique
      "mobile_number": "971501234567", // Required
      "email": "john.doe@example.com", // Required: Must be unique
      "family_contact": "971509876543", // Optional
      "branch": "CSE",                // Required: 'CSE', 'IT', 'ENTC', 'ECE', 'AI&DS'
      "class": "SE5",                 // Required: FE1-11, SE1-11, TE1-11
      "room_number": "101"            // Optional: Room number from rooms table
  }
  ```
  - Initial password is the same as `username` (e.g., "REG123").
- **Add Warden (Warden)**: `POST /api/users/add-warden` (Warden-only)
  ```json
  {
      "username": "WARDEN002",        // Required
      "name": "Warden Two",           // Required
      "roll_number": "W002",          // Required: Must be unique
      "mobile_number": "971501234568", // Required
      "email": "warden.two@example.com", // Required: Must be unique
      "family_contact": "971509876544" // Optional
  }
  ```
  - Initial password is the same as `username` (e.g., "WARDEN002").
- **Login**: `POST /api/users/login`
  ```json
  {"username": "REG123", "password": "REG123"}
  ```
  - Response: `{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}`
- **View Profile**: `GET /api/users/profile` (Authenticated users)
  - Response: `{"username": "REG123", "name": "John Doe", "roll_number": "R123", "mobile_number": "971501234567", "email": "john.doe@example.com", "family_contact": "971509876543", "branch": "CSE", "class": "SE5", "room_number": "101", "role": "student"}`
- **Request OTP**: `POST /api/users/request-otp` (Authenticated users)
  - Sends a 6-digit OTP to the user’s registered email.
  - Response: `{"message": "OTP sent to your email"}`
- **Change Password**: `POST /api/users/change-password` (Authenticated users)
  ```json
  {"otp": "123456", "new_password": "MyNewPass123"}
  ```
  - OTP must match the one sent and be used within 10 minutes.
  - Response: `{"message": "Password changed successfully"}`

## Attendance
- **View Today’s Attendance (Warden)**: `GET /api/attendance` (Warden-only)
  ```json
  [{"username": "REG123", "name": "John Doe", "room_number": "101", "status": "absent"}]
  ```
- **Mark Attendance (Warden)**: `PUT /api/attendance/mark` (Warden-only)
  ```json
  {"username": "REG123", "status": "present", "date": "2025-04-01"} // date optional, defaults to today
  ```
- **Attendance History (Warden)**: `GET /api/attendance/history?start_date=2025-03-01&end_date=2025-04-01` (Warden-only)
  ```json
  [{"username": "REG123", "name": "John Doe", "date": "2025-04-01", "status": "present"}]
  ```

## Rooms
- **Add a Room (Warden)**: `POST /api/rooms` (Warden-only)
  ```json
  {"room_number": "101", "capacity": 2, "description": "Double room"}
  ```
- **Assign Student to Room (Warden)**: `PUT /api/rooms/assign` (Warden-only)
  ```json
  {"username": "REG123", "room_number": "101"}
  ```
- **Unassign/Move Student (Warden)**: `PUT /api/rooms/unassign` (Warden-only)
  ```json
  {"username": "REG123", "new_room_number": "102"} // omit new_room_number to unassign
  ```
- **View All Rooms (Warden)**: `GET /api/rooms` (Warden-only)
  ```json
  [{"room_number": "101", "capacity": 2, "description": "Double room", "occupants": [{"username": "REG123", "name": "John Doe"}], "occupant_count": 1}]
  ```
- **View My Room (Student/Warden)**: `GET /api/rooms/my-room` (Authenticated users)
  ```json
  {"room_number": "101", "capacity": 2, "description": "Double room"}
  ```

## Leaves
- **View All Leaves (Warden)**: `GET /api/leaves` (Warden-only)
  - Optional: `?status=approved` (filter by status), `?date=2025-04-02` (leaves overlapping a date).
  ```json
  [{"id": 1, "user_id": 1, "username": "REG123", "name": "John Doe", "room_number": "101", "reason": "Visiting family", "start_date": "2025-04-05", "end_date": "2025-04-10", "address": "123 Main St", "family_contact": "971509876543", "status": "approved", "submitted_at": "...", "reviewed_at": "..."}]
  ```

- **View My Leaves (Student)**: GET /api/leaves/my-leaves (Student-only)
  ```json
  [{"id": 1, "reason": "Visiting family", "start_date": "2025-04-05", "end_date": "2025-04-10", "address": "123 Main St", "family_contact": "971509876543", "status": "approved", "submitted_at": "...", "reviewed_at": "..."}]
  ```

- **Submit Leave (Student)**: POST /api/leaves (Student-only)
  ```json
  {
    "reason": "Visiting family for holidays",
    "start_date": "2025-04-05",
    "end_date": "2025-04-10",
    "address": "123 Main St, Hometown",
    "family_contact": "971509876543"
  }
  ```

- **Approve/Reject Leave (Warden)**: PUT /api/leaves/:id (Warden-only)
  ```json
  {"status": "approved"} // or "rejected"
  ```

## Complaints
- **View All Complaints (Warden)**: `GET /api/complaints` (Warden-only)
  - Optional filters: `?status=pending` (e.g., `pending`, `in_progress`, `warden_approved`, `resolved`), `?category=plumbing` (e.g., `plumbing`, `electrical`, `furniture`, `other`), `?room_number=101`.
  ```json
  [{"id": 1, "user_id": 1, "username": "REG123", "name": "John Doe", "room_number": "101", "category": "plumbing", "description": "Water leakage", "status": "resolved", "submitted_at": "...", "updated_at": "...", "warden_approved_at": "...", "student_approved_at": "..."}]
  ```

 - **View My Complaints (Student)**: GET /api/complaints/my-complaints (Student-only)
 ```json
 [{"id": 1, "room_number": "101", "category": "plumbing", "description": "Water leakage", "status": "resolved", "submitted_at": "...", "updated_at": "...", "warden_approved_at": "...", "student_approved_at": "..."}]
 ```

 - **Submit Complaint (Student)**: POST /api/complaints (Student-only)
 ```json
 {
    "category": "plumbing", // 'plumbing', 'electrical', 'furniture', 'other'
    "description": "Water leakage in bathroom sink"
 }
 ```
 Auto-fills room_number from user’s profile.

 - **Update Complaint Status (Warden)**: PUT /api/complaints/:id (Warden-only)
 ```json
 {"status": "in_progress"} // 'pending', 'in_progress', 'warden_approved'
 ```
 Sets warden_approved_at when status is "warden_approved".

 - **Confirm Resolution (Student)**: PUT /api/complaints/:id/confirm (Student-only)
 No body required; changes status to "resolved" if "warden_approved".
 Only the complaint’s submitter can confirm.
 ```json
 {"id": 1, "status": "resolved", "student_approved_at": "2025-04-02T..."}
 ```

# .env Format
Create a `.env` file in the `backend/` directory with:
```
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=hostel_management
JWT_SECRET=your_jwt_secret
EMAIL_USER=hosteltestbot@gmail.com    # Gmail account that sends OTPs
EMAIL_PASS=abcdefghijklmnop           # App Password for EMAIL_USER (no spaces)
```

- **Notes**:
  - Replace `your_password` with your PostgreSQL password.
  - Update `JWT_SECRET` to a secure string (e.g., `openssl rand -hex 32`).
  - `EMAIL_USER` and `EMAIL_PASS` must be a valid Gmail account with an App Password for sending OTP emails.
  - Generate an App Password at `myaccount.google.com` → Security → App Passwords after enabling 2FA.

```
