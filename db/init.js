const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'portal.db'));
db.pragma('foreign_keys = ON');

// ---------- SCHEMA ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','student')),
  student_id TEXT UNIQUE,
  department TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  capacity INTEGER NOT NULL DEFAULT 30,
  semester TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','completed')),
  grade TEXT,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(user_id, course_id)
);
`);

// ---------- SEED (only if empty) ----------
const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;

if (userCount === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, student_id, department)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const adminPass = bcrypt.hashSync('Admin@123', 10);
  const studentPass = bcrypt.hashSync('Student@123', 10);

  insertUser.run('System Admin', 'admin@portal.edu', adminPass, 'admin', null, null);
  insertUser.run('Alice Tan', 'alice@portal.edu', studentPass, 'student', 'S1001', 'Computer Science');
  insertUser.run('Ben Lee', 'ben@portal.edu', studentPass, 'student', 'S1002', 'Business');
  insertUser.run('Chloe Wong', 'chloe@portal.edu', studentPass, 'student', 'S1003', 'Computer Science');

  const insertCourse = db.prepare(`
    INSERT INTO courses (code, title, department, credits, capacity, semester)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertCourse.run('CS101', 'Introduction to Programming', 'Computer Science', 3, 30, 'May 2026');
  insertCourse.run('CS201', 'Database Systems', 'Computer Science', 4, 25, 'May 2026');
  insertCourse.run('BUS101', 'Principles of Management', 'Business', 3, 40, 'May 2026');
  insertCourse.run('CS301', 'Web Programming', 'Computer Science', 4, 20, 'May 2026');

  const insertEnrollment = db.prepare(`
    INSERT INTO enrollments (user_id, course_id, status, grade)
    VALUES (?, ?, ?, ?)
  `);

  insertEnrollment.run(2, 1, 'approved', 'A');
  insertEnrollment.run(2, 4, 'pending', null);
  insertEnrollment.run(3, 3, 'approved', 'B+');
  insertEnrollment.run(4, 1, 'pending', null);
  insertEnrollment.run(4, 2, 'rejected', null);

  console.log('Database seeded with sample admin, students, courses, enrollments.');
}

module.exports = db;
