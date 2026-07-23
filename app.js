const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');

require('./db/init'); // ensures DB + tables + seed exist

const { attachLocals } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const courseRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollments');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: 'student-portal-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 4 }, // 4 hours
  })
);
app.use(flash());
app.use(attachLocals);

app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/auth/login');
});

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/courses', courseRoutes);
app.use('/enrollments', enrollmentRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Not Found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Student Management Portal running on http://localhost:${PORT}`);
});
const sqlite3 = require('sqlite3').verbose();

app.get('/show-my-users-123', (req, res) => {
    const dbPath = path.join(__dirname, 'db', 'portal.db');
    const db = new sqlite3.Database(dbPath);

    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            return res.status(500).send("查询失败，错误信息: " + err.message);
        }
        res.json(rows);
    });
});
