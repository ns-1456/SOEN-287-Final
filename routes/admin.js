const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// Get all bookings (for admin to view and manage)
router.get('/bookings', (req, res) => {
  try {
    const { status, resource_id, user_id, date_from, date_to } = req.query;
    const db = getDatabase();

    let query = `
      SELECT b.*, 
             r.name as resource_name, r.type as resource_type, r.location,
             u.username, u.email, u.full_name
      FROM bookings b 
      JOIN resources r ON b.resource_id = r.id 
      JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    if (resource_id) {
      query += ' AND b.resource_id = ?';
      params.push(resource_id);
    }

    if (user_id) {
      query += ' AND b.user_id = ?';
      params.push(user_id);
    }

    if (date_from) {
      query += ' AND b.booking_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND b.booking_date <= ?';
      params.push(date_to);
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

// Approve booking
router.put('/bookings/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.get('SELECT * FROM bookings WHERE id = ?', [id], (err, booking) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.status === 'approved') {
        return res.status(400).json({ error: 'Booking is already approved' });
      }

      if (booking.status === 'cancelled' || booking.status === 'completed') {
        return res.status(400).json({ error: 'Cannot approve cancelled or completed bookings' });
      }

      db.run(
        'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['approved', id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to approve booking' });
          }

          // Get updated booking
          db.get(
            `SELECT b.*, r.name as resource_name, r.type as resource_type, r.location,
                    u.username, u.email, u.full_name
             FROM bookings b 
             JOIN resources r ON b.resource_id = r.id 
             JOIN users u ON b.user_id = u.id
             WHERE b.id = ?`,
            [id],
            (err, updatedBooking) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                message: 'Booking approved successfully',
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

// Reject booking
router.put('/bookings/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const db = getDatabase();

    db.get('SELECT * FROM bookings WHERE id = ?', [id], (err, booking) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.status === 'rejected') {
        return res.status(400).json({ error: 'Booking is already rejected' });
      }

      if (booking.status === 'cancelled' || booking.status === 'completed') {
        return res.status(400).json({ error: 'Cannot reject cancelled or completed bookings' });
      }

      db.run(
        'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['rejected', id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to reject booking' });
          }

          res.json({ 
            message: 'Booking rejected successfully',
            reason: reason || null
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Block/Unblock resource
router.put('/resources/:id/block', (req, res) => {
  try {
    const { id } = req.params;
    const { is_blocked } = req.body;

    if (typeof is_blocked !== 'boolean') {
      return res.status(400).json({ error: 'is_blocked must be a boolean' });
    }

    const db = getDatabase();

    db.get('SELECT * FROM resources WHERE id = ?', [id], (err, resource) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      db.run(
        'UPDATE resources SET is_blocked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [is_blocked ? 1 : 0, id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update resource' });
          }

          // Get updated resource
          db.get('SELECT * FROM resources WHERE id = ?', [id], (err, updatedResource) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            res.json({
              message: `Resource ${is_blocked ? 'blocked' : 'unblocked'} successfully`,
              resource: updatedResource
            });
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get statistics and reports
router.get('/reports', (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const db = getDatabase();

    const reports = {};

    // Helper function to execute query and return promise
    const queryPromise = (query, params = []) => {
      return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    // Helper function to execute single row query
    const queryOnePromise = (query, params = []) => {
      return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    };

    const dateFilter = date_from && date_to 
      ? `WHERE b.booking_date BETWEEN '${date_from}' AND '${date_to}'`
      : '';

    Promise.all([
      // Total bookings
      queryOnePromise(
        `SELECT COUNT(*) as total FROM bookings ${dateFilter.replace('b.', '')}`
      ),
      
      // Bookings by status
      queryPromise(
        `SELECT status, COUNT(*) as count 
         FROM bookings ${dateFilter.replace('b.', '')}
         GROUP BY status`
      ),

      // Most popular resources
      queryPromise(
        `SELECT r.id, r.name, r.type, r.location, COUNT(b.id) as booking_count
         FROM resources r
         LEFT JOIN bookings b ON r.id = b.resource_id ${dateFilter}
         GROUP BY r.id
         ORDER BY booking_count DESC
         LIMIT 10`
      ),

      // Peak times (by hour)
      queryPromise(
        `SELECT 
           CAST(SUBSTR(start_time, 1, 2) AS INTEGER) as hour,
           COUNT(*) as booking_count
         FROM bookings ${dateFilter.replace('b.', '')}
         WHERE status IN ('approved', 'completed')
         GROUP BY hour
         ORDER BY hour`
      ),

      // Bookings by day of week
      queryPromise(
        `SELECT 
           CASE CAST(strftime('%w', booking_date) AS INTEGER)
             WHEN 0 THEN 'Sunday'
             WHEN 1 THEN 'Monday'
             WHEN 2 THEN 'Tuesday'
             WHEN 3 THEN 'Wednesday'
             WHEN 4 THEN 'Thursday'
             WHEN 5 THEN 'Friday'
             WHEN 6 THEN 'Saturday'
           END as day_of_week,
           COUNT(*) as booking_count
         FROM bookings ${dateFilter.replace('b.', '')}
         WHERE status IN ('approved', 'completed')
         GROUP BY day_of_week
         ORDER BY 
           CASE CAST(strftime('%w', booking_date) AS INTEGER)
             WHEN 0 THEN 7
             WHEN 1 THEN 1
             WHEN 2 THEN 2
             WHEN 3 THEN 3
             WHEN 4 THEN 4
             WHEN 5 THEN 5
             WHEN 6 THEN 6
           END`
      ),

      // Most active users
      queryPromise(
        `SELECT u.id, u.username, u.email, u.full_name, COUNT(b.id) as booking_count
         FROM users u
         LEFT JOIN bookings b ON u.id = b.user_id ${dateFilter.replace('b.', '')}
         WHERE u.role IN ('student', 'staff')
         GROUP BY u.id
         ORDER BY booking_count DESC
         LIMIT 10`
      ),

      // Resource utilization
      queryPromise(
        `SELECT 
           r.id, r.name, r.type,
           COUNT(b.id) as total_bookings,
           SUM(CASE WHEN b.status = 'approved' THEN 1 ELSE 0 END) as approved_bookings,
           SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
         FROM resources r
         LEFT JOIN bookings b ON r.id = b.resource_id ${dateFilter.replace('b.', '')}
         GROUP BY r.id
         ORDER BY total_bookings DESC`
      )
    ])
    .then(([total, byStatus, popularResources, peakTimes, byDayOfWeek, activeUsers, utilization]) => {
      reports.total_bookings = total.total;
      reports.bookings_by_status = byStatus;
      reports.most_popular_resources = popularResources;
      reports.peak_times = peakTimes;
      reports.bookings_by_day = byDayOfWeek;
      reports.most_active_users = activeUsers;
      reports.resource_utilization = utilization;
      reports.date_range = date_from && date_to ? { from: date_from, to: date_to } : 'All time';

      res.json(reports);
    })
    .catch((error) => {
      console.error('Error generating reports:', error);
      res.status(500).json({ error: 'Failed to generate reports' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/users', (req, res) => {
  try {
    const { role } = req.query;
    const db = getDatabase();

    let query = 'SELECT id, username, email, role, full_name, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(users);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

