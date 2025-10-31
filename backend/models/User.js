import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['voter', 'candidate', 'admin', 'electoral_committee'],
    default: 'voter'
  },
  fullName: { type: String, required: true, trim: true },
  dateOfBirth: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  idType: { type: String, enum: ['citizenship', 'national', 'passport'], required: true },
  idNumber: { type: String, required: true },
  voterid: { type: String, required: true, unique: true, alias: 'voterId' },
  province: { type: String, required: true },
  district: { type: String, required: true },
  ward: { type: Number, required: true },
  
  // New biometric fields
  biometricRegistered: {
    type: Boolean,
    default: false
  },
  biometricType: {
    type: String,
    enum: ['face', 'webauthn', null],
    default: null
  },
  biometricRegistrationDate: {
    type: Date,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // Detailed biometric auth metadata (per user's requested layout)
  biometricAuth: {
    faceEnrolled: { type: Boolean, default: false },
    // fingerprint removed — face-only
    lastBiometricUpdate: { type: Date },
    enrollmentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  },

  // Face enrollment validation flags and score
  faceEnrollment: {
    qualityScore: { type: Number, default: null },
    validationFlags: {
      noObstructions: { type: Boolean, default: false },
      neutralExpression: { type: Boolean, default: false },
      properLighting: { type: Boolean, default: false },
      forwardFacing: { type: Boolean, default: false },
      noGlasses: { type: Boolean, default: false }
    },
    enrolledAt: { type: Date, default: null }
  },

  // Fingerprint storage removed — face-only flow

  // Audit trail for biometric operations
  biometricAudit: [{
    action: { type: String, enum: ['enrollment','verification','update','deletion'] },
    timestamp: { type: Date, default: Date.now },
    method: { type: String, enum: ['face','webauthn'] },
    success: { type: Boolean },
    confidenceScore: { type: Number, default: null },
    deviceInfo: { type: String, default: null },
    ipAddress: { type: String, default: null }
  }],

  // Consent management for biometric data
  consent: {
    biometricConsent: { type: Boolean, default: false },
    consentDate: { type: Date, default: null },
    consentVersion: { type: String, default: null },
    dataRetention: {
      agreed: { type: Boolean, default: false },
      durationMonths: { type: Number, default: 0 },
      autoDelete: { type: Boolean, default: true }
    }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;