const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded;    // { id, role }
    req.adminId = decoded.id; // backward compat
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Admin only — allow both old tokens (no role) and new tokens (role=admin)
const adminOnly = (req, res, next) => {
  if (req.user?.role && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin access required' });
  next();
};

// Renter only
const renterOnly = (req, res, next) => {
  if (req.user?.role !== 'renter')
    return res.status(403).json({ message: 'Renter access required' });
  next();
};

module.exports = authenticate;
module.exports.adminOnly = adminOnly;
module.exports.renterOnly = renterOnly;
