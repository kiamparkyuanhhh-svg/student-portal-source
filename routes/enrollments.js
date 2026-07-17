const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db/init');
const { isAuthenticated, isAdmin, isStudent } = require('../middleware/auth');

// ---------- STUDENT: enroll in a course ----------
router.post('/', isAuthenticated, isStudent, (req, res) => {
  const { course_id } = req.body;
  const userId = req.session.user.id;

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(course_id);
  if (!course) {
    req.flash('error', 'Course not found.');
    return res.redirect('/courses');
  }

  const currentCount = db
    .prepare("SELECT COUNT(*) AS c FROM enrollments WHERE course_id = ? AND status IN ('approved','pending')")
    .get(course_id).c;

  if (currentCount >= course.capacity) {
    req.flash('error', 'This course is full.');
    return res.redirect('/courses');
  }

  try {
    db.prepare(`INSERT INTO enrollments (user_id, course_id, status) VALUES (?, ?, 'pending')`).run(
      userId,
      course_id
    );
    req.flash('success', `Enrollment request submitted for ${course.title}.`);
  } catch (err) {
    req.flash('error', 'You are already enrolled in this course.');
  }
  res.redirect('/courses');
});

// ---------- STUDENT: withdraw from a course ----------
router.delete('/:id', isAuthenticated, isStudent, (req, res) => {
  const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(req.params.id);
  if (!enrollment || enrollment.user_id !== req.session.user.id) {
    req.flash('error', 'Enrollment not found.');
    return res.redirect('/dashboard');
  }
  db.prepare('DELETE FROM enrollments WHERE id = ?').run(req.params.id);
  req.flash('success', 'Withdrawn from course.');
  res.redirect('/dashboard');
});

// ---------- ADMIN: view all enrollments with search/filter ----------
router.get('/manage', isAuthenticated, isAdmin, (req, res) => {
  const { status, keyword } = req.query;

  let query = `
    SELECT e.id, u.name AS student_name, u.student_id, c.code, c.title, e.status, e.grade, e.enrolled_at
    FROM enrollments e
    JOIN users u ON e.user_id = u.id
    JOIN courses c ON e.course_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND e.status = ?';
    params.push(status);
  }
  if (keyword) {
    query += ' AND (u.name LIKE ? OR c.title LIKE ? OR c.code LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  query += ' ORDER BY e.enrolled_at DESC';

  const enrollments = db.prepare(query).all(...params);

  res.render('admin/enrollments', {
    title: 'Manage Enrollments',
    enrollments,
    filters: { status: status || '', keyword: keyword || '' },
  });
});

// ---------- ADMIN: update enrollment status/grade ----------
router.put(
  '/:id',
  isAuthenticated,
  isAdmin,
  [
    body('status')
      .isIn(['pending', 'approved', 'rejected', 'completed'])
      .withMessage('Invalid status value.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map((e) => e.msg).join(' '));
      return res.redirect('/enrollments/manage');
    }

    const { status, grade } = req.body;
    db.prepare('UPDATE enrollments SET status = ?, grade = ? WHERE id = ?').run(
      status,
      grade || null,
      req.params.id
    );
    req.flash('success', 'Enrollment updated.');
    res.redirect('/enrollments/manage');
  }
);

module.exports = router;
