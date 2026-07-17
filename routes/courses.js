const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db/init');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// ---------- LIST + SEARCH/FILTER (all logged-in users) ----------
router.get('/', isAuthenticated, (req, res) => {
  const { keyword, department } = req.query;

  let query = 'SELECT * FROM courses WHERE 1=1';
  const params = [];

  if (keyword) {
    query += ' AND (title LIKE ? OR code LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (department) {
    query += ' AND department = ?';
    params.push(department);
  }
  query += ' ORDER BY code ASC';

  const courses = db.prepare(query).all(...params);
  const departments = db.prepare('SELECT DISTINCT department FROM courses ORDER BY department').all();

  // if student, mark which courses they're already enrolled in
  let enrolledCourseIds = [];
  if (req.session.user.role === 'student') {
    enrolledCourseIds = db
      .prepare('SELECT course_id FROM enrollments WHERE user_id = ?')
      .all(req.session.user.id)
      .map((r) => r.course_id);
  }

  res.render('student/courses', {
    title: 'Courses',
    courses,
    departments,
    enrolledCourseIds,
    filters: { keyword: keyword || '', department: department || '' },
  });
});

// ---------- ADMIN: manage courses list ----------
router.get('/manage', isAuthenticated, isAdmin, (req, res) => {
  const { keyword, department } = req.query;
  let query = 'SELECT * FROM courses WHERE 1=1';
  const params = [];

  if (keyword) {
    query += ' AND (title LIKE ? OR code LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (department) {
    query += ' AND department = ?';
    params.push(department);
  }
  query += ' ORDER BY code ASC';

  const courses = db.prepare(query).all(...params);
  const departments = db.prepare('SELECT DISTINCT department FROM courses ORDER BY department').all();

  res.render('admin/courses', {
    title: 'Manage Courses',
    courses,
    departments,
    filters: { keyword: keyword || '', department: department || '' },
  });
});

// ---------- ADMIN: new course form ----------
router.get('/new', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/course_form', { title: 'Add Course', course: {}, action: '/courses' });
});

// ---------- ADMIN: create course ----------
router.post(
  '/',
  isAuthenticated,
  isAdmin,
  [
    body('code').trim().notEmpty().withMessage('Course code is required.'),
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('department').trim().notEmpty().withMessage('Department is required.'),
    body('credits').isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10.'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive number.'),
    body('semester').trim().notEmpty().withMessage('Semester is required.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map((e) => e.msg).join(' '));
      return res.redirect('/courses/new');
    }

    const { code, title, department, credits, capacity, semester } = req.body;
    try {
      db.prepare(
        `INSERT INTO courses (code, title, department, credits, capacity, semester)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(code.toUpperCase(), title, department, credits, capacity, semester);
      req.flash('success', 'Course created successfully.');
    } catch (err) {
      req.flash('error', 'Course code already exists.');
    }
    res.redirect('/courses/manage');
  }
);

// ---------- ADMIN: edit course form ----------
router.get('/:id/edit', isAuthenticated, isAdmin, (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) {
    req.flash('error', 'Course not found.');
    return res.redirect('/courses/manage');
  }
  res.render('admin/course_form', { title: 'Edit Course', course, action: `/courses/${course.id}?_method=PUT` });
});

// ---------- ADMIN: update course ----------
router.put(
  '/:id',
  isAuthenticated,
  isAdmin,
  [
    body('code').trim().notEmpty().withMessage('Course code is required.'),
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('department').trim().notEmpty().withMessage('Department is required.'),
    body('credits').isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10.'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive number.'),
    body('semester').trim().notEmpty().withMessage('Semester is required.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map((e) => e.msg).join(' '));
      return res.redirect(`/courses/${req.params.id}/edit`);
    }

    const { code, title, department, credits, capacity, semester } = req.body;
    db.prepare(
      `UPDATE courses SET code = ?, title = ?, department = ?, credits = ?, capacity = ?, semester = ?
       WHERE id = ?`
    ).run(code.toUpperCase(), title, department, credits, capacity, semester, req.params.id);

    req.flash('success', 'Course updated successfully.');
    res.redirect('/courses/manage');
  }
);

// ---------- ADMIN: delete course ----------
router.delete('/:id', isAuthenticated, isAdmin, (req, res) => {
  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  req.flash('success', 'Course deleted.');
  res.redirect('/courses/manage');
});

module.exports = router;
