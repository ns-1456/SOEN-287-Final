# Quick Start Guide

## Getting Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Server
```bash
npm start
```

### Step 3: Access the Application
Open your browser and go to: `http://localhost:3000`

---

## Testing the Backend

### 1. Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@concordia.ca",
    "password": "password123",
    "role": "student",
    "full_name": "Test User"
  }'
```

### 2. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@concordia.ca",
    "password": "password123"
  }'
```

Save the token from the response!

### 3. Test Get Resources
```bash
curl http://localhost:3000/api/resources
```

### 4. Test Create Booking (replace TOKEN with your token)
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "resource_id": 1,
    "booking_date": "2025-01-20",
    "start_time": "10:00",
    "end_time": "12:00",
    "purpose": "Study session"
  }'
```

### 5. Test Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@concordia.ca",
    "password": "admin123"
  }'
```

---

## Using the API Helper

Include the API helper in your HTML files:

```html
<script src="../js/api-helper.js"></script>
<script>
  // Example: Login
  async function login() {
    try {
      const result = await authAPI.login('test@concordia.ca', 'password123');
      console.log('Logged in:', result);
      window.location.href = '../student/myProfile.html';
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
  
  // Example: Load Resources
  async function loadResources() {
    try {
      const resources = await resourceAPI.getAll({ type: 'room' });
      console.log('Resources:', resources);
      // Display in your HTML
    } catch (error) {
      console.error('Error:', error);
    }
  }
</script>
```

---

## Default Credentials

**Admin:**
- Email: `admin@concordia.ca`
- Password: `admin123`

**Test User (create via registration):**
- Email: `test@concordia.ca`
- Password: `password123`

---

## Common Issues

**Port already in use:**
- Change PORT in server.js or use: `PORT=3001 npm start`

**Database errors:**
- Delete `database/campus_resources.db` and restart

**Module not found:**
- Run `npm install` again

---

## Next Steps

1. ✅ Backend is complete and working
2. 📝 See `TEAM_TASKS.md` for remaining work
3. 🔗 Connect frontend to backend using `js/api-helper.js`
4. ✉️ Add email notifications (bonus feature)
5. ✅ Test everything thoroughly

---

## API Base URL
```
http://localhost:3000/api
```

See `API_DOCUMENTATION.md` for complete API reference.

