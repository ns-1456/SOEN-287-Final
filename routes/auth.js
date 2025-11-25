const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/db');
const { generateToken, authenticate } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, full_name } = req.body;

    // Validation
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['student', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = getDatabase();

    // Check if username or email already exists
    db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email],
      async (err, existingUser) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingUser) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        db.run(
          'INSERT INTO users (username, email, password, role, full_name) VALUES (?, ?, ?, ?, ?)',
          [username, email, hashedPassword, role, full_name || null],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create user' });
            }

            // Return user info (without password) and token
            res.status(201).json({
              message: 'User created successfully',
              user: {
                id: this.lastID,
                username,
                email,
                role,
                full_name
              },
              token: generateToken({ id: this.lastID, username, role, email })
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDatabase();

    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user);

        // Return user info and token
        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            full_name: user.full_name
          },
          token
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
router.get('/me', authenticate, (req, res) => {
  const db = getDatabase();

  db.get(
    'SELECT id, username, email, role, full_name, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    }
  );
});

// Update user profile
router.put('/me', authenticate, (req, res) => {
  const { full_name, email } = req.body;
  const db = getDatabase();

  // Check if email is being changed and if it's already taken
  if (email) {
    db.get(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, req.user.id],
      (err, existingUser) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingUser) {
          return res.status(400).json({ error: 'Email already in use' });
        }

        // Update user
        const updates = [];
        const values = [];

        if (full_name !== undefined) {
          updates.push('full_name = ?');
          values.push(full_name);
        }

        if (email !== undefined) {
          updates.push('email = ?');
          values.push(email);
        }

        if (updates.length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.user.id);

        db.run(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          values,
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to update profile' });
            }

            // Get updated user
            db.get(
              'SELECT id, username, email, role, full_name, created_at FROM users WHERE id = ?',
              [req.user.id],
              (err, user) => {
                if (err) {
                  return res.status(500).json({ error: 'Database error' });
                }

                res.json({
                  message: 'Profile updated successfully',
                  user
                });
              }
            );
          }
        );
      }
    );
  } else {
    // Update without email change
    const updates = [];
    const values = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);

    db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update profile' });
        }

        // Get updated user
        db.get(
          'SELECT id, username, email, role, full_name, created_at FROM users WHERE id = ?',
          [req.user.id],
          (err, user) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            res.json({
              message: 'Profile updated successfully',
              user
            });
          }
        );
      }
    );
  }
});

module.exports = router;

