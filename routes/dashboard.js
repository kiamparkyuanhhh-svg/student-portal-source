const express = require('express');
const router = express.Router();
const db = require('../db/init');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, (req, res) => {
  const user = req.session.user;

  if (user.role === 'admin') {
    const totalStudents = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'student'").get().c;
    const totalCourses = db.prepare('SELECT COUNT(*) AS c FROM courses').get().c;
    const pendingEnrollments = db.prepare("SELECT COUNT(*) AS c FROM enrollments WHERE status = 'pending'").get().c;
    const totalEnrollments = db.prepare('SELECT COUNT(*) AS c FROM enrollments').get().c;

    const recentEnrollments = db
      .prepare(
        `SELECT e.id, u.name AS student_name, c.title AS course_title, e.status, e.enrolled_at
         FROM enrollments e
         JOIN users u ON e.user_id = u.id
         JOIN courses c ON e.course_id = c.id
         ORDER BY e.enrolled_at DESC
         LIMIT 5`
      )
      .all();

    return res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: { totalStudents, totalCourses, pendingEnrollments, totalEnrollments },
      recentEnrollments,
    });
  }

  // student dashboard
  const myEnrollments = db
    .prepare(
      `SELECT e.id, c.code, c.title, c.credits, e.status, e.grade
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = ?
       ORDER BY e.enrolled_at DESC`
    )
    .all(user.id);

  const approvedCount = myEnrollments.filter((e) => e.status === 'approved').length;
  const pendingCount = myEnrollments.filter((e) => e.status === 'pending').length;
  const completedCount = myEnrollments.filter((e) => e.status === 'completed').length;

  res.render('student/dashboard', {
    title: 'Student Dashboard',
    myEnrollments,
    stats: { approvedCount, pendingCount, completedCount, total: myEnrollments.length },
  });
});

module.exports = router;
