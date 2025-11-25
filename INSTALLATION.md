# Installation Guide

## Campus Resource Booking & Management System

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager) - comes with Node.js

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   
   Or for development:
   ```bash
   node server.js
   ```

3. **Access the Application**
   - Open your web browser
   - Navigate to: `http://localhost:3000`
   - The server will automatically create the database on first run

### Default Admin Credentials

- **Username:** admin
- **Email:** admin@concordia.ca
- **Password:** admin123

**⚠️ Important:** Change the admin password after first login in production!

### Database

The system uses SQLite database which is automatically created at:
- `database/campus_resources.db`

The database is initialized with:
- Default admin user
- Sample resources (Study Rooms, Labs, Equipment)

### Environment Variables (Optional)

Create a `.env` file in the root directory to customize:

```
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
```

### Troubleshooting

1. **Port Already in Use**
   - Change the PORT in `.env` file or modify `server.js`
   - Or stop the process using port 3000

2. **Database Errors**
   - Delete `database/campus_resources.db` to reset the database
   - Restart the server to recreate it

3. **Module Not Found**
   - Run `npm install` again
   - Make sure you're in the project root directory

### API Endpoints

The API is available at `http://localhost:3000/api`

See `API_DOCUMENTATION.md` for detailed API documentation.

