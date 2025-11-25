const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'campus_resources.db');

// Create and initialize database
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database.');
    });

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create tables
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('student', 'staff', 'admin')),
          full_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
          reject(err);
        }
      });

      // Resources table
      db.run(`
        CREATE TABLE IF NOT EXISTS resources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('room', 'lab', 'equipment')),
          location TEXT NOT NULL,
          capacity INTEGER,
          description TEXT,
          image_url TEXT,
          is_blocked INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating resources table:', err.message);
          reject(err);
        }
      });

      // Availability schedules table (for setting working hours, exceptions, blackout dates)
      db.run(`
        CREATE TABLE IF NOT EXISTS availability_schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          resource_id INTEGER NOT NULL,
          day_of_week INTEGER CHECK(day_of_week BETWEEN 0 AND 6),
          start_time TEXT,
          end_time TEXT,
          is_available INTEGER DEFAULT 1,
          exception_date DATE,
          is_blackout INTEGER DEFAULT 0,
          FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating availability_schedules table:', err.message);
          reject(err);
        }
      });

      // Bookings table
      db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          resource_id INTEGER NOT NULL,
          booking_date DATE NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          purpose TEXT,
          status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating bookings table:', err.message);
          reject(err);
        }
      });

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_resource ON bookings(resource_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`);

      // Insert default admin user (password: admin123)
      // Password hash for 'admin123' using bcrypt
      const bcrypt = require('bcryptjs');
      const adminPasswordHash = bcrypt.hashSync('admin123', 10);
      
      db.run(`
        INSERT OR IGNORE INTO users (username, email, password, role, full_name)
        VALUES ('admin', 'admin@concordia.ca', ?, 'admin', 'System Administrator')
      `, [adminPasswordHash], (err) => {
        if (err) {
          console.error('Error creating default admin:', err.message);
        } else {
          console.log('Default admin user created (username: admin, password: admin123)');
        }
      });

      // Insert sample resources
      db.run(`
        INSERT OR IGNORE INTO resources (name, type, location, capacity, description)
        VALUES 
          ('Study Room 1', 'room', 'Library', 4, 'Quiet study room with whiteboard'),
          ('Study Room 2', 'room', 'H Building', 6, 'Group study room'),
          ('Study Room 3', 'room', 'R Building', 4, 'Study room with projector'),
          ('Study Room 4', 'room', 'Library', 8, 'Large group study room'),
          ('LAB 1', 'lab', 'H Building', 20, 'Computer lab with 20 workstations'),
          ('LAB 2', 'lab', 'B Building', 30, 'Engineering lab'),
          ('Lab 3', 'lab', 'K Building', 15, 'Chemistry lab'),
          ('LAB 4', 'lab', 'R Building', 25, 'Physics lab'),
          ('Projector Kit', 'equipment', 'Library', 1, 'Portable projector and screen'),
          ('Chemistry Kit', 'equipment', 'H Building', 1, 'Chemistry experiment equipment'),
          ('Electronic Kit', 'equipment', 'R Building', 1, 'Electronics components and tools'),
          ('Physics Kit', 'equipment', 'K Building', 1, 'Physics experiment equipment')
      `, (err) => {
        if (err) {
          console.error('Error inserting sample resources:', err.message);
        } else {
          console.log('Sample resources inserted');
        }
      });

      console.log('Database initialized successfully.');
      resolve(db);
    });
  });
}

// Get database instance
function getDatabase() {
  return new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    }
  });
}

module.exports = {
  initializeDatabase,
  getDatabase,
  DB_PATH
};

