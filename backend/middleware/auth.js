// middleware/auth.js
// This runs BEFORE protected routes (like /api/sites)
// It checks that the request has a valid JWT token
// If no token → reject. If valid token → allow and attach user info.

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Token comes in the Authorization header as: "Bearer <token>"
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  // Split "Bearer <token>" → grab just the token part
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Malformed token.' });
  }

  try {
    // Verify the token using our JWT_SECRET
    // If it's valid, decoded = { id: user.id, email: user.email }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request so controllers can use it
    req.user = decoded;

    // Move on to the actual route handler
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};

module.exports = auth;