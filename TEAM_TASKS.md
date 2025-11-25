# Team Tasks - Remaining Work

This document outlines tasks that need to be completed by team members. The foundation backend is complete, and these are additional features and improvements to be implemented.

---

## Task 1: Frontend-Backend Integration (Priority: HIGH)

**Assigned to:** Team Member 1

**Description:** Connect the existing HTML frontend pages to the backend API endpoints.

**Tasks:**
1. Update `auth/loginPage.html` to call `/api/auth/login` endpoint
2. Update `auth/createAccount.html` to call `/api/auth/register` endpoint
3. Update `student/browseResources.html` to fetch resources from `/api/resources`
4. Update `student/reserve.html` to:
   - Fetch available time slots from `/api/bookings/availability/:resourceId`
   - Submit bookings to `/api/bookings`
5. Update `student/myReservations.html` to fetch bookings from `/api/bookings/my-bookings`
6. Update `admin/editResources.html` to:
   - Fetch resources from `/api/resources`
   - Add/edit/delete resources using API endpoints
7. Update `admin/adminReservation.html` to fetch and manage bookings from `/api/admin/bookings`
8. Update `admin/adminReports.html` to display statistics from `/api/admin/reports`

**Files to modify:**
- All HTML files in `auth/`, `student/`, and `admin/` directories
- Create a new `js/` directory for JavaScript files if needed

**API Endpoints to use:**
- See `API_DOCUMENTATION.md` for all available endpoints

**Estimated Time:** 4-6 hours

---

## Task 2: Email Notifications (Bonus Feature)

**Assigned to:** Team Member 2

**Description:** Implement email notifications for booking confirmations, changes, and cancellations.

**Tasks:**
1. Install and configure an email service (e.g., Nodemailer)
2. Create email templates for:
   - Booking confirmation
   - Booking cancellation
   - Booking modification
   - Admin approval/rejection
3. Integrate email sending in booking routes:
   - Send confirmation email when booking is created
   - Send email when booking is cancelled
   - Send email when booking is modified
   - Send email when admin approves/rejects booking
4. Add email notification preferences to user profile (optional)

**Files to create:**
- `utils/emailService.js` - Email service module
- `templates/emailTemplates.js` - Email template functions

**Files to modify:**
- `routes/bookings.js` - Add email notifications
- `routes/admin.js` - Add email notifications for approval/rejection

**Dependencies to add:**
```json
"nodemailer": "^6.9.7"
```

**Configuration needed:**
- Email service credentials (Gmail, SendGrid, etc.)
- Add to `.env` file:
  ```
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASS=your-app-password
  ```

**Estimated Time:** 3-4 hours

---

## Task 3: Input Validation and Error Handling Improvements

**Assigned to:** Team Member 3

**Description:** Enhance input validation and improve error messages throughout the application.

**Tasks:**
1. Create a validation utility module (`utils/validation.js`)
2. Add comprehensive validation for:
   - Email format validation
   - Password strength requirements
   - Date/time format validation
   - Resource capacity validation
   - Booking time range validation
3. Improve error messages to be more user-friendly
4. Add client-side validation in frontend forms
5. Add validation middleware for common inputs

**Files to create:**
- `utils/validation.js` - Validation utility functions
- `middleware/validation.js` - Validation middleware

**Files to modify:**
- All route files to use validation utilities
- Frontend HTML files to add client-side validation

**Example validations:**
- Email: Must be valid email format
- Password: Minimum 6 characters, at least one number
- Date: Must be in YYYY-MM-DD format, not in past
- Time: Must be in HH:MM format, end time after start time
- Capacity: Must be positive integer

**Estimated Time:** 2-3 hours

---

## Task 4: Enhanced Features and Polish

**Assigned to:** Team Member 4

**Description:** Add additional features and polish the application.

**Tasks:**
1. **Booking Calendar View Enhancement:**
   - Improve the calendar display in `reserve.html`
   - Show booking status with different colors
   - Add tooltips showing booking details

2. **Search and Filter Improvements:**
   - Add advanced search in browse resources
   - Add date range filters for bookings
   - Add sorting options (by name, location, type)

3. **User Experience Improvements:**
   - Add loading indicators for API calls
   - Add success/error toast notifications
   - Improve form error display
   - Add confirmation dialogs for delete actions

4. **Admin Announcements Feature (Bonus):**
   - Create database table for announcements
   - Add API endpoints for creating/managing announcements
   - Display announcements to users on dashboard
   - Allow admins to send notifications to all users

**Files to create:**
- `routes/announcements.js` - Announcements API (if implementing bonus)
- `js/utils.js` - Frontend utility functions
- `js/api.js` - Frontend API helper functions

**Files to modify:**
- Frontend HTML files for UI improvements
- `database/db.js` - Add announcements table (if implementing bonus)

**Estimated Time:** 4-5 hours

---

## Testing Tasks (All Team Members)

**Description:** Test the complete system end-to-end.

**Test Cases:**
1. User registration and login
2. Browse and search resources
3. Create, modify, and cancel bookings
4. Admin resource management
5. Admin booking approval/rejection
6. Admin reports and statistics
7. Booking conflict detection
8. Resource blocking/unblocking
9. Error handling and edge cases

**Create test document:**
- `TESTING.md` - Document all test cases and results

---

## Documentation Tasks (All Team Members)

**Description:** Complete project documentation.

**Files to create/update:**
1. **USER_GUIDE.md** - Step-by-step guide for end users
   - How to create an account
   - How to browse resources
   - How to make a booking
   - How to manage bookings
   - How to use admin features

2. **README.md** - Update with:
   - Project description
   - Features list
   - Installation instructions
   - Team member contributions

3. **DEPLOYMENT.md** - Guide for deploying the application
   - Production environment setup
   - Database migration
   - Security considerations

---

## Quick Reference: API Endpoints

For frontend integration, here are the main endpoints:

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile

**Resources:**
- `GET /api/resources` - Get all resources
- `GET /api/resources/:id` - Get single resource
- `POST /api/resources` - Create resource (admin)
- `PUT /api/resources/:id` - Update resource (admin)
- `DELETE /api/resources/:id` - Delete resource (admin)

**Bookings:**
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get single booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/bookings/availability/:resourceId?date=YYYY-MM-DD` - Get availability

**Admin:**
- `GET /api/admin/bookings` - Get all bookings
- `PUT /api/admin/bookings/:id/approve` - Approve booking
- `PUT /api/admin/bookings/:id/reject` - Reject booking
- `PUT /api/admin/resources/:id/block` - Block/unblock resource
- `GET /api/admin/reports` - Get statistics

---

## Notes

- All API calls should include the JWT token in the Authorization header: `Authorization: Bearer <token>`
- Store the token in localStorage or sessionStorage after login
- Handle API errors gracefully in the frontend
- Test all features thoroughly before submission

---

## Questions?

If you have questions about the backend implementation, refer to:
- `API_DOCUMENTATION.md` - Complete API documentation
- `INSTALLATION.md` - Installation and setup guide
- Code comments in route files

Good luck with the implementation! 🚀

