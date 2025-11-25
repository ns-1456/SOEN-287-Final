const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/db');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth');

// Get all resources (public, but can filter by type)
router.get('/', optionalAuthenticate, (req, res) => {
  try {
    const { type, location, search } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM resources WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (location) {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY type, name';

    db.all(query, params, (err, resources) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(resources);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single resource by ID
router.get('/:id', optionalAuthenticate, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.get(
      'SELECT * FROM resources WHERE id = ?',
      [id],
      (err, resource) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!resource) {
          return res.status(404).json({ error: 'Resource not found' });
        }

        res.json(resource);
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new resource (admin only)
router.post('/', authenticate, authorize('admin'), (req, res) => {
  try {
    const { name, type, location, capacity, description, image_url } = req.body;

    if (!name || !type || !location) {
      return res.status(400).json({ error: 'Name, type, and location are required' });
    }

    if (!['room', 'lab', 'equipment'].includes(type)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    const db = getDatabase();

    db.run(
      'INSERT INTO resources (name, type, location, capacity, description, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type, location, capacity || null, description || null, image_url || null],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create resource' });
        }

        // Get the created resource
        db.get(
          'SELECT * FROM resources WHERE id = ?',
          [this.lastID],
          (err, resource) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            res.status(201).json({
              message: 'Resource created successfully',
              resource
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update resource (admin only)
router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, location, capacity, description, image_url, is_blocked } = req.body;

    const db = getDatabase();

    // Check if resource exists
    db.get('SELECT * FROM resources WHERE id = ?', [id], (err, resource) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Build update query
      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }

      if (type !== undefined) {
        if (!['room', 'lab', 'equipment'].includes(type)) {
          return res.status(400).json({ error: 'Invalid resource type' });
        }
        updates.push('type = ?');
        values.push(type);
      }

      if (location !== undefined) {
        updates.push('location = ?');
        values.push(location);
      }

      if (capacity !== undefined) {
        updates.push('capacity = ?');
        values.push(capacity);
      }

      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }

      if (image_url !== undefined) {
        updates.push('image_url = ?');
        values.push(image_url);
      }

      if (is_blocked !== undefined) {
        updates.push('is_blocked = ?');
        values.push(is_blocked ? 1 : 0);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      db.run(
        `UPDATE resources SET ${updates.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update resource' });
          }

          // Get updated resource
          db.get(
            'SELECT * FROM resources WHERE id = ?',
            [id],
            (err, updatedResource) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                message: 'Resource updated successfully',
                resource: updatedResource
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

// Delete resource (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Check if resource exists
    db.get('SELECT * FROM resources WHERE id = ?', [id], (err, resource) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Check if resource has active bookings
      db.get(
        'SELECT COUNT(*) as count FROM bookings WHERE resource_id = ? AND status IN ("pending", "approved")',
        [id],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (result.count > 0) {
            return res.status(400).json({ 
              error: 'Cannot delete resource with active bookings. Cancel or complete bookings first.' 
            });
          }

          // Delete resource
          db.run('DELETE FROM resources WHERE id = ?', [id], function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to delete resource' });
            }

            res.json({ message: 'Resource deleted successfully' });
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get availability schedule for a resource
router.get('/:id/availability', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.all(
      'SELECT * FROM availability_schedules WHERE resource_id = ? ORDER BY day_of_week, start_time',
      [id],
      (err, schedules) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json(schedules);
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Set availability schedule for a resource (admin only)
router.post('/:id/availability', authenticate, authorize('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { day_of_week, start_time, end_time, is_available, exception_date, is_blackout } = req.body;

    const db = getDatabase();

    // Check if resource exists
    db.get('SELECT * FROM resources WHERE id = ?', [id], (err, resource) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      db.run(
        `INSERT INTO availability_schedules 
         (resource_id, day_of_week, start_time, end_time, is_available, exception_date, is_blackout)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          day_of_week !== undefined ? day_of_week : null,
          start_time || null,
          end_time || null,
          is_available !== undefined ? (is_available ? 1 : 0) : 1,
          exception_date || null,
          is_blackout !== undefined ? (is_blackout ? 1 : 0) : 0
        ],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create availability schedule' });
          }

          res.status(201).json({
            message: 'Availability schedule created successfully',
            schedule_id: this.lastID
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

