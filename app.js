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

// 1. 专门用来查看数据库账号（自适应数据库类型）
app.get('/show-my-users-123', (req, res) => {
    try {
        const db = require('./db/init');

        // 如果是 better-sqlite3 模块（同步查询）
        if (typeof db.prepare === 'function') {
            const rows = db.prepare("SELECT * FROM users").all();
            return res.json(rows);
        }
        
        // 如果是普通 sqlite3 模块（异步查询）
        if (typeof db.all === 'function') {
            return db.all("SELECT * FROM users", [], (err, rows) => {
                if (err) return res.status(500).send("查询出错: " + err.message);
                res.json(rows);
            });
        }

        res.json({ message: "未识别的 db 对象格式", dbKeys: Object.keys(db) });
    } catch (e) {
        res.status(500).send("异常: " + e.message);
    }
});

// 2. 404 处理（必须放在所有路由的最后面）
app.use((req, res) => {
    res.status(404).render('404', { title: 'Not Found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Student Management Portal running on http://localhost:${PORT}`);
});