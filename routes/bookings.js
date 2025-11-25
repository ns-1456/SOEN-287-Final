const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

// Helper function to check for booking conflicts
function checkBookingConflict(db, resourceId, bookingDate, startTime, endTime, excludeBookingId = null) {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT * FROM bookings 
      WHERE resource_id = ? 
        AND booking_date = ? 
        AND status IN ('pending', 'approved')
        AND (
          (start_time < ? AND end_time > ?) OR
          (start_time < ? AND end_time > ?) OR
          (start_time >= ? AND end_time <= ?)
        )
    `;
    
    const params = [resourceId, bookingDate, startTime, startTime, endTime, endTime, startTime, endTime];
    
    if (excludeBookingId) {
      query += ' AND id != ?';
      params.push(excludeBookingId);
    }

    db.all(query, params, (err, conflicts) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(conflicts.length > 0);
    });
  });
}

// Helper function to check if resource is blocked
function isResourceBlocked(db, resourceId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT is_blocked FROM resources WHERE id = ?', [resourceId], (err, resource) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(resource && resource.is_blocked === 1);
    });
  });
}

// Create new booking
router.post('/', authenticate, async (req, res) => {
  try {
    const { resource_id, booking_date, start_time, end_time, purpose } = req.body;

    // Validation
    if (!resource_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(start_time) || !/^\d{2}:\d{2}$/.test(end_time)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
    }

    // Validate that end_time is after start_time
    if (start_time >= end_time) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Validate that booking date is not in the past
    const bookingDate = new Date(booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return res.status(400).json({ error: 'Cannot book resources in the past' });
    }

    const db = getDatabase();

    // Check if resource exists
    db.get('SELECT * FROM resources WHERE id = ?', [resource_id], async (err, resource) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Check if resource is blocked
      try {
        const blocked = await isResourceBlocked(db, resource_id);
        if (blocked) {
          return res.status(400).json({ error: 'Resource is currently blocked' });
        }
      } catch (error) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Check for conflicts
      try {
        const hasConflict = await checkBookingConflict(db, resource_id, booking_date, start_time, end_time);
        if (hasConflict) {
          return res.status(409).json({ error: 'Time slot is already booked' });
        }
      } catch (error) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Create booking (status: 'pending' for approval, or 'approved' if auto-approve)
      // For now, we'll set it to 'approved' by default. Admin can change this behavior.
      const status = 'approved';

      db.run(
        'INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, resource_id, booking_date, start_time, end_time, purpose || null, status],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create booking' });
          }

          // Get the created booking with resource details
          db.get(
            `SELECT b.*, r.name as resource_name, r.type as resource_type, r.location 
             FROM bookings b 
             JOIN resources r ON b.resource_id = r.id 
             WHERE b.id = ?`,
            [this.lastID],
            (err, booking) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.status(201).json({
                message: 'Booking created successfully',
                booking
              });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's bookings
router.get('/my-bookings', authenticate, (req, res) => {
  try {
    const { status, upcoming } = req.query;
    const db = getDatabase();

    let query = `
      SELECT b.*, r.name as resource_name, r.type as resource_type, r.location 
      FROM bookings b 
      JOIN resources r ON b.resource_id = r.id 
      WHERE b.user_id = ?
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query += ' AND (b.booking_date > ? OR (b.booking_date = ? AND b.end_time > ?))';
      const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
      params.push(today, today, currentTime);
    }

    query += ' ORDER BY b.booking_date DESC, b.start_time DESC';

    db.all(query, params, (err, bookings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(bookings);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single booking by ID
router.get('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.get(
      `SELECT b.*, r.name as resource_name, r.type as resource_type, r.location,
              u.username, u.email, u.full_name
       FROM bookings b 
       JOIN resources r ON b.resource_id = r.id 
       JOIN users u ON b.user_id = u.id
       WHERE b.id = ?`,
      [id],
      (err, booking) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!booking) {
          return res.status(404).json({ error: 'Booking not found' });
        }

        // Check if user owns the booking or is admin
        if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Access denied' });
        }

        res.json(booking);
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update booking (user can only update their own bookings)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_date, start_time, end_time, purpose } = req.body;
    const db = getDatabase();

    // Get existing booking
    db.get('SELECT * FROM bookings WHERE id = ?', [id], async (err, booking) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check if user owns the booking
      if (booking.user_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only modify your own bookings' });
      }

      // Check if booking can be modified (not completed or cancelled)
      if (booking.status === 'completed' || booking.status === 'cancelled') {
        return res.status(400).json({ error: 'Cannot modify completed or cancelled bookings' });
      }

      // Build update query
      const updates = [];
      const values = [];

      const newBookingDate = booking_date || booking.booking_date;
      const newStartTime = start_time || booking.start_time;
      const newEndTime = end_time || booking.end_time;

      if (booking_date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
          return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }
        updates.push('booking_date = ?');
        values.push(booking_date);
      }

      if (start_time) {
        if (!/^\d{2}:\d{2}$/.test(start_time)) {
          return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
        }
        updates.push('start_time = ?');
        values.push(start_time);
      }

      if (end_time) {
        if (!/^\d{2}:\d{2}$/.test(end_time)) {
          return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
        }
        updates.push('end_time = ?');
        values.push(end_time);
      }

      if (purpose !== undefined) {
        updates.push('purpose = ?');
        values.push(purpose);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Validate times if both are being updated
      if (start_time && end_time) {
        if (start_time >= end_time) {
          return res.status(400).json({ error: 'End time must be after start time' });
        }
      } else if (start_time && !end_time) {
        if (start_time >= booking.end_time) {
          return res.status(400).json({ error: 'End time must be after start time' });
        }
      } else if (end_time && !start_time) {
        if (booking.start_time >= end_time) {
          return res.status(400).json({ error: 'End time must be after start time' });
        }
      }

      // Check for conflicts if date/time is being changed
      if (booking_date || start_time || end_time) {
        try {
          const hasConflict = await checkBookingConflict(
            db, 
            booking.resource_id, 
            newBookingDate, 
            newStartTime, 
            newEndTime, 
            id
          );
          if (hasConflict) {
            return res.status(409).json({ error: 'Time slot is already booked' });
          }
        } catch (error) {
          return res.status(500).json({ error: 'Database error' });
        }
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      db.run(
        `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update booking' });
          }

          // Get updated booking
          db.get(
            `SELECT b.*, r.name as resource_name, r.type as resource_type, r.location 
             FROM bookings b 
             JOIN resources r ON b.resource_id = r.id 
             WHERE b.id = ?`,
            [id],
            (err, updatedBooking) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                message: 'Booking updated successfully',
                booking: updatedBooking
              });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel booking
router.delete('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Get existing booking
    db.get('SELECT * FROM bookings WHERE id = ?', [id], (err, booking) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check if user owns the booking or is admin
      if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if booking can be cancelled
      if (booking.status === 'cancelled') {
        return res.status(400).json({ error: 'Booking is already cancelled' });
      }

      if (booking.status === 'completed') {
        return res.status(400).json({ error: 'Cannot cancel completed bookings' });
      }

      // Update booking status to cancelled
      db.run(
        'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['cancelled', id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to cancel booking' });
          }

          res.json({ message: 'Booking cancelled successfully' });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get availability for a resource on a specific date
router.get('/availability/:resourceId', (req, res) => {
  try {
    const { resourceId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD)' });
    }

    const db = getDatabase();

    // Get all bookings for the resource on the specified date
    db.all(
      `SELECT start_time, end_time, status 
       FROM bookings 
       WHERE resource_id = ? AND booking_date = ? AND status IN ('pending', 'approved')
       ORDER BY start_time`,
      [resourceId, date],
      (err, bookings) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          date,
          bookings,
          available_slots: bookings // This can be enhanced to calculate free slots
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

