require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

// Import Middleware and Import Routes
const { securityHeaders, corsProtection } = require('./middleware/security');
const indexRoutes = require('./routes/index');
const loginRoutes = require('./routes/login');
const userProfileRoutes = require('./routes/userProfile');
const dashboardRoutes = require('./routes/dashboard');
const assessmentRoutes = require('./routes/assessment');
const logoutRoutes = require('./routes/logout');


const app = express();
const PORT = process.env.PORT || 3100

// ===== SECURITY MIDDLEWARE =====
// Apply security headers first
app.use(securityHeaders);

// CORS protection
app.use(corsProtection);

// ===== VIEW ENGINE SETUP =====
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
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
  cookie: {
    httpOnly: true, // Prevent JS access to session cookie
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));


// ===== ROUTES =====
app.use('/', indexRoutes); // Main Index Page
app.use('/login', loginRoutes); // Login Routes
app.use('/user-profile', userProfileRoutes); // User Profile Routes
app.use('/dashboard', dashboardRoutes); // Dashboard Routes
app.use('/assessment', assessmentRoutes); // Assessment Routes
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
  res.status(404).json({ error: 'Not found' });
});



// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`
  http://localhost:${PORT}${' '.repeat(PORT.toString().length > 4 ? 0 : PORT.toString().length - 3)}                   
  ${process.env.NODE_ENV === 'production' ? ':) PRODUCTION MODE' : ':( DEVELOPMENT MODE'}                        
  `);
});