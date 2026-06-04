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
});

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

module.exports = { securityHeaders, corsProtection };
