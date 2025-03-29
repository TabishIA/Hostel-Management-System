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