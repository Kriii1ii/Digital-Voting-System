import jwt from 'jsonwebtoken';

/**
 * Generate JWT Token for a user
 * @param {String} id - MongoDB ObjectId of the user
 * @param {String} role - User role ('voter', 'candidate', 'admin')
 * @returns {String} Signed JWT token
 */
const generateToken = (id, role) => {
  try {
    const token = jwt.sign(
      { id, role }, // payload
      process.env.JWT_SECRET, // secret key from .env
      { expiresIn: '7d' } // token validity: 7 days
    );
    return token;
  } catch (error) {
    console.error('Error generating token:', error.message);
    throw new Error('Token generation failed');
  }
};

export default generateToken;
