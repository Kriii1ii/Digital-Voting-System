import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Extract Bearer token from Authorization header (case-insensitive)
 */
function getBearerToken(req) {
  const h = req.headers.authorization || req.headers.Authorization;
  if (!h || typeof h !== 'string') return null;
  const [scheme, token] = h.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token.trim();
}

/**
 * Protect: verifies JWT, attaches req.user (without password) & req.auth (decoded)
 */
export const protect = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
      }
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;     // sanitized user
    req.auth = decoded;  // raw token payload if needed (id, role, iat, exp)
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

/**
 * Role-based authorization: allow only specified roles
 * Usage: authorize('admin', 'electoral_committee')
 */
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
  }
  next();
};

/**
 * Require verified users (e.g., for voting)
 */
export const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending verification by the Electoral Committee',
    });
  }
  next();
};

/** Convenience guards */
export const adminOnly = authorize('admin');
export const committeeOnly = authorize('electoral_committee');
export const committeeOrAdmin = authorize('electoral_committee', 'admin');
