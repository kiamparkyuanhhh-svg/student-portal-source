const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db/init');

// ---------- GET login ----------
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'Login' });
});

// ---------- POST login ----------
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Enter a valid email.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map((e) => e.msg).join(' '));
      return res.redirect('/auth/login');
    }

    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      student_id: user.student_id,
      department: user.department,
    };

    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect('/dashboard');
  }
);

// ---------- GET register ----------
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('auth/register', { title: 'Register' });
});

// ---------- POST register ----------
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
    body('email').isEmail().withMessage('Enter a valid email.').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('department').trim().notEmpty().withMessage('Department is required.'),
    body('student_id').trim().notEmpty().withMessage('Student ID is required.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map((e) => e.msg).join(' '));
      return res.redirect('/auth/register');
    }

    const { name, email, password, department, student_id } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR student_id = ?').get(email, student_id);
    if (existing) {
      req.flash('error', 'Email or Student ID already registered.');
      return res.redirect('/auth/register');
    }

    const hashed = bcrypt.hashSync(password, 10);

    db.prepare(
      `INSERT INTO users (name, email, password, role, student_id, department)
       VALUES (?, ?, ?, 'student', ?, ?)`
    ).run(name, email, hashed, student_id, department);

    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/auth/login');
  }
);

// ---------- Logout ----------
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
