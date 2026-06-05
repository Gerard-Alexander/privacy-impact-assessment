require('dotenv').config();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const express = require('express');
const session = require('express-session');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const prisma = require('./store/prisma');

// Import Middleware and Import Routes
const { securityHeaders, corsProtection } = require('./middleware/security');
const indexRoutes = require('./routes/index');
const loginRoutes = require('./routes/login');
const userProfileRoutes = require('./routes/userProfile');
const dashboardRoutes = require('./routes/dashboard');
const assessmentRoutes = require('./routes/assessment');
const logoutRoutes = require('./routes/logout');
const reportsRoutes = require('./routes/reports');
const exportRoutes = require('./routes/export');


const app = express();
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
  });
  next();
});
const PORT = process.env.PORT || 3100

// ===== SECURITY MIDDLEWARE =====
// Apply security headers first
// app.use(securityHeaders);

// CORS protection
app.use(corsProtection);

// ===== VIEW ENGINE SETUP =====
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// ===== SESSION CONFIGURATION =====
// IMPORTANT: SESSION_SECRET must be set in .env for production
if (!process.env.SESSION_SECRET) {
  console.warn('  WARNING: SESSION_SECRET not set in .env. Using development default!');
  console.warn('    Set SESSION_SECRET in .env for production!');
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production', // MUST be env var in prod
  resave: false,
  saveUninitialized: false, // Don't create session until needed
  store: new PrismaSessionStore(prisma, {
    checkPeriod: 2 * 60 * 1000, // Prune expired sessions every 2 minutes
    dbRecordIdIsSessionId: false
  }),
  cookie: {
    httpOnly: true, // Prevent JS access to session cookie
    secure: false, // Explicitly false for HTTP
    sameSite: 'lax', // More compatible for local network usage
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));


// ===== ROUTES =====
app.get('/dpsname', (req, res) => res.redirect('/assessment')); // Sidebar shortcut
app.use('/', indexRoutes); // Main Index Page
app.use('/login', loginRoutes); // Login Routes
app.use('/user-profile', userProfileRoutes); // User Profile Routes
app.use('/dashboard', dashboardRoutes); // Dashboard Routes
app.use('/assessment', assessmentRoutes); // Assessment Routes
app.use('/reports', reportsRoutes); // Reports Routes
app.use('/export', exportRoutes); // Export Routes
app.use('/logout', logoutRoutes); // Logout Route

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Server error' 
      : err.message
  });
});


// 404 Handler
app.use((req, res) => {
  console.log(`404 detected for URL: ${req.url}`);
  res.status(404).render('403', {
    title: '404 - Page Not Found',
    user: req.session?.user || null,
    message: `The page you are looking for (${req.url}) could not be found. Please check the URL.`
  });
});



// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`
  Server running at: ${process.env.APP_URL || `http://localhost:${PORT}`}
  Mode: ${process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'}
  `);
});