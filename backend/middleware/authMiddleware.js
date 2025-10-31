import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Simple auth middleware placeholder.
// Replace with your real authentication logic (JWT/session/passport, etc.).

export const requireAuth = (req, res, next) => {
  // Example: check for Authorization header and allow through for now
  const auth = req.headers.authorization || '';
  if (!auth) {
    // For now, allow requests but attach a note — change as needed.
    // To enforce authentication uncomment the lines below.
    // return res.status(401).json({ message: 'Unauthorized' });
    console.log('No authorization header - proceeding without auth');
  }
  next();
};

// New JWT authentication middleware for biometric routes
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};

// Optional: Keep both for backward compatibility
export default auth;