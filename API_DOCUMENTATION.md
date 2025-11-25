# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

---

## Authentication Endpoints

### Register User
**POST** `/api/auth/register`

**Body:**
```json
{
  "username": "john_doe",
  "email": "john@concordia.ca",
  "password": "password123",
  "role": "student",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@concordia.ca",
    "role": "student",
    "full_name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "john@concordia.ca",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@concordia.ca",
    "role": "student",
    "full_name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User Profile
**GET** `/api/auth/me` (Requires Authentication)

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@concordia.ca",
  "role": "student",
  "full_name": "John Doe",
  "created_at": "2025-01-01 12:00:00"
}
```

### Update Profile
**PUT** `/api/auth/me` (Requires Authentication)

**Body:**
```json
{
  "full_name": "John Smith",
  "email": "john.smith@concordia.ca"
}
```

---

## Resource Endpoints

### Get All Resources
**GET** `/api/resources`

**Query Parameters:**
- `type` - Filter by type (room, lab, equipment)
- `location` - Filter by location
- `search` - Search in name and description

**Example:** `/api/resources?type=room&location=Library`

### Get Single Resource
**GET** `/api/resources/:id`

### Create Resource (Admin Only)
**POST** `/api/resources` (Requires Admin Authentication)

**Body:**
```json
{
  "name": "Study Room 5",
  "type": "room",
  "location": "Library",
  "capacity": 6,
  "description": "New study room",
  "image_url": "https://example.com/image.jpg"
}
```

### Update Resource (Admin Only)
**PUT** `/api/resources/:id` (Requires Admin Authentication)

### Delete Resource (Admin Only)
**DELETE** `/api/resources/:id` (Requires Admin Authentication)

### Get Resource Availability Schedule
**GET** `/api/resources/:id/availability`

### Set Resource Availability Schedule (Admin Only)
**POST** `/api/resources/:id/availability` (Requires Admin Authentication)

---

## Booking Endpoints

### Create Booking
**POST** `/api/bookings` (Requires Authentication)

**Body:**
```json
{
  "resource_id": 1,
  "booking_date": "2025-01-15",
  "start_time": "10:00",
  "end_time": "12:00",
  "purpose": "Group study session"
}
```

**Response:**
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": 1,
    "user_id": 1,
    "resource_id": 1,
    "booking_date": "2025-01-15",
    "start_time": "10:00",
    "end_time": "12:00",
    "purpose": "Group study session",
    "status": "approved",
    "resource_name": "Study Room 1",
    "resource_type": "room",
    "location": "Library"
  }
}
```

### Get My Bookings
**GET** `/api/bookings/my-bookings` (Requires Authentication)

**Query Parameters:**
- `status` - Filter by status (pending, approved, rejected, cancelled, completed)
- `upcoming` - Set to `true` to get only upcoming bookings

### Get Single Booking
**GET** `/api/bookings/:id` (Requires Authentication)

### Update Booking
**PUT** `/api/bookings/:id` (Requires Authentication - Owner Only)

**Body:**
```json
{
  "booking_date": "2025-01-16",
  "start_time": "11:00",
  "end_time": "13:00",
  "purpose": "Updated purpose"
}
```

### Cancel Booking
**DELETE** `/api/bookings/:id` (Requires Authentication - Owner or Admin)

### Get Resource Availability for Date
**GET** `/api/bookings/availability/:resourceId?date=2025-01-15`

---

## Admin Endpoints

All admin endpoints require Admin authentication.

### Get All Bookings (Admin)
**GET** `/api/admin/bookings`

**Query Parameters:**
- `status` - Filter by status
- `resource_id` - Filter by resource
- `user_id` - Filter by user
- `date_from` - Start date (YYYY-MM-DD)
- `date_to` - End date (YYYY-MM-DD)

### Approve Booking
**PUT** `/api/admin/bookings/:id/approve`

### Reject Booking
**PUT** `/api/admin/bookings/:id/reject`

**Body:**
```json
{
  "reason": "Resource unavailable"
}
```

### Block/Unblock Resource
**PUT** `/api/admin/resources/:id/block`

**Body:**
```json
{
  "is_blocked": true
}
```

### Get Statistics and Reports
**GET** `/api/admin/reports`

**Query Parameters:**
- `date_from` - Start date (YYYY-MM-DD)
- `date_to` - End date (YYYY-MM-DD)

**Response includes:**
- Total bookings
- Bookings by status
- Most popular resources
- Peak times
- Bookings by day of week
- Most active users
- Resource utilization

### Get All Users
**GET** `/api/admin/users`

**Query Parameters:**
- `role` - Filter by role (student, staff, admin)

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., booking conflict)
- `500` - Internal Server Error

---

## Date and Time Formats

- **Date:** `YYYY-MM-DD` (e.g., "2025-01-15")
- **Time:** `HH:MM` (24-hour format, e.g., "14:30")

---

## Notes

1. All timestamps are in UTC
2. Booking conflicts are automatically detected and prevented
3. Resources can be blocked by admins, preventing new bookings
4. Users can only modify/cancel their own bookings (unless admin)
5. JWT tokens expire after 24 hours

