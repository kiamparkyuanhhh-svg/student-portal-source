function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  req.flash('error', 'Please log in to continue.');
  return res.redirect('/auth/login');
}

function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') return next();
  req.flash('error', 'Access denied: admin only.');
  return res.redirect('/dashboard');
}

function isStudent(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'student') return next();
  req.flash('error', 'Access denied: student only.');
  return res.redirect('/dashboard');
}

// Makes current user + flash messages available in all views
function attachLocals(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
}

module.exports = { isAuthenticated, isAdmin, isStudent, attachLocals };
