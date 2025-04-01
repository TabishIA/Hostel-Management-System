# Backend Setup
1. `cd backend`
2. `npm install`
3. Create `.env` (see `.env` section below).
4. `node server.js`

# API Endpoints
- **Users**: `/api/users/register`, `/api/users/login`
- **Complaints**: `/api/complaints` (GET, POST)
- **Leaves**: `/api/leaves` (GET, POST)

# .env Format

### Room Allotment
- **POST /api/rooms**: Add a room (admin only).
- **PUT /api/rooms/assign**: Assign a student to a room (admin only).
- **GET /api/rooms**: View all rooms (admin only).
- **GET /api/rooms/my-room**: View assigned room (any user).

- **Rooms**:
  - **Unassign/Move Student (Admin)**: PUT `/api/rooms/unassign`
    ```json
    {
        "user_id": 2,            // Required: Student to unassign/move
        "new_room_id": 1         // Optional: Move to this room; omit to unassign
    }

View All Rooms (Admin): GET /api/rooms (Now includes occupants and count)

[
    {
        "id": 1,
        "room_number": "101",
        "capacity": 2,
        "description": "Double room",
        "occupants": [{"id": 2, "username": "student1"}],
        "occupant_count": 1
    },
    ...
]

- **Attendance**:
  - **View Today’s Attendance (Admin)**: GET `/api/attendance`
    ```json
    [{"id": 2, "username": "student1", "room_id": 1, "status": "absent"}, ...]

Mark Attendance (Admin): PUT /api/attendance/mark

{ "user_id": 2, "status": "present", "date": "2025-03-30" } // date optional

Attendance History (Admin): GET /api/attendance/history?start_date=2025-03-01&end_date=2025-03-31

[{"id": 2, "username": "student1", "date": "2025-03-30", "status": "present"}, ...]