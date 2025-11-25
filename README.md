# Campus Resource Booking & Management System

**SOEN 287 - Web Programming Project**  
**Concordia University - Fall 2025**

A web-based system for managing the booking of university resources, catering to both end users (students/faculty) and administrators (resource managers).

---

## Features

### End Users (Students/Faculty)
- ✅ Create and manage account (profile info, contact email)
- ✅ Browse available resources (rooms, labs, equipment)
- ✅ View real-time availability calendars/schedules
- ✅ Make bookings/reservations for resources
- ✅ Modify or cancel bookings
- ✅ View past and upcoming bookings

### Administrators
- ✅ Create, edit, and remove resources
- ✅ Set availability schedules (working hours, exceptions, blackout dates)
- ✅ Approve or reject booking requests
- ✅ Block or unblock resources temporarily
- ✅ View statistics/reports about resource usage

### Technical Features
- ✅ Web-based, responsive design
- ✅ Authentication and authorization with different roles (User/Admin)
- ✅ Data persistence with SQLite database
- ✅ Booking conflict detection (no double-booking)
- ✅ Modular design for future extensions

---

## Project Structure

```
SOEN-287-NS 2/
├── admin/              # Admin HTML pages
├── auth/               # Authentication HTML pages
├── student/            # Student HTML pages
├── css/                # Stylesheets
├── database/           # Database files and initialization
│   └── db.js          # Database schema and setup
├── middleware/         # Express middleware
│   └── auth.js        # Authentication middleware
├── routes/             # API route handlers
│   ├── auth.js        # Authentication routes
│   ├── resources.js   # Resource management routes
│   ├── bookings.js    # Booking management routes
│   └── admin.js       # Admin-specific routes
├── server.js           # Main server entry point
├── package.json        # Node.js dependencies
└── README.md          # This file
```

---

## Installation

See [INSTALLATION.md](INSTALLATION.md) for detailed installation instructions.

**Quick Start:**
```bash
npm install
npm start
```

The server will run on `http://localhost:3000`

**Default Admin Credentials:**
- Username: `admin`
- Email: `admin@concordia.ca`
- Password: `admin123`

---

## API Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API endpoint documentation.

**Base URL:** `http://localhost:3000/api`

**Main Endpoints:**
- `/api/auth` - Authentication (register, login, profile)
- `/api/resources` - Resource management
- `/api/bookings` - Booking management
- `/api/admin` - Admin operations

---

## Technology Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite3
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **Frontend:** HTML, CSS, JavaScript

---

## Team Tasks

See [TEAM_TASKS.md](TEAM_TASKS.md) for remaining tasks to be completed by team members.

**Remaining Work:**
1. Frontend-Backend Integration
2. Email Notifications (Bonus)
3. Input Validation Improvements
4. Enhanced Features and Polish

---

## Deliverables Status

### Deliverable 1 - Frontend ✅
- Frontend HTML pages completed
- Navigation between pages implemented
- Basic styling applied

### Deliverable 2 - Backend ✅
- Complete backend API implemented
- Database schema and persistence
- Authentication and authorization
- Booking conflict detection
- Admin features

---

## Development

### Running the Server
```bash
npm start
```

### Database
The SQLite database is automatically created on first run at `database/campus_resources.db`

### Environment Variables
Create a `.env` file for custom configuration:
```
PORT=3000
JWT_SECRET=your-secret-key
```

---

## Testing

Test the API endpoints using:
- Postman
- curl
- Browser (for GET requests)
- Frontend integration (once completed)

---

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Admin routes require authentication and authorization
- SQL injection prevention through parameterized queries
- Input validation on all endpoints

---

## Future Enhancements

- Email notifications for bookings
- Admin announcements system
- Payment integration for premium resources
- Integration with campus card systems
- Mobile app support

---

## License

This project is for educational purposes as part of SOEN 287 course at Concordia University.

---

## Contributors

- Team Member 1: [Name] - [Contribution]
- Team Member 2: [Name] - [Contribution]
- Team Member 3: [Name] - [Contribution]
- Team Member 4: [Name] - [Contribution]

---

## Support

For issues or questions, refer to:
- [INSTALLATION.md](INSTALLATION.md) - Setup guide
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
- [TEAM_TASKS.md](TEAM_TASKS.md) - Development tasks
