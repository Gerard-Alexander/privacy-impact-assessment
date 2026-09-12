const helmet = require('helmet');

// Security headers middleware
// Explicitly disable features that force HTTPS for local HTTP development
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      upgradeInsecureRequests: null, // Disable forcing HTTPS
    }
  },
  hsts: false, // Disable HSTS (force HTTPS)
  noSniff: true,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' },
});

const preventInspection = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
};

const denyDirectoryListings = (req, res, next) => {
  if (req.path !== '/' && req.path.endsWith('/')) {
    return res.status(403).send('Forbidden');
  }
  next();
};

const corsProtection = (req, res, next) => {
  const origin = req.headers.origin;
  // Allow the specific IP and localhost
  if (origin && (origin.includes('192.160.21.70') || origin.includes('localhost'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

module.exports = { securityHeaders, corsProtection, preventInspection, denyDirectoryListings };
