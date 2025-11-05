// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';
const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');

const ROLES = ['voter', 'admin', 'committee', 'candidate'];
const reqIfVoter = function () { return this.role === 'voter' || this.role=== 'candidate'; };

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      default: 'voter',
      enum: ROLES,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },

    fullName: { type: String, required: true, trim: true },

    dateOfBirth: { type: String, required: reqIfVoter },                          // e.g. "1970-10-26"
    idType:      { type: String, required: reqIfVoter },                          // e.g. "national"
    idNumber:    { type: String, required: reqIfVoter },                          // e.g. "4768405"
    voterId:     { type: String, trim: true, unique: true, sparse: true, required: reqIfVoter },
    province:    { type: String, trim: true, required: reqIfVoter },
    district:    { type: String, trim: true, required: reqIfVoter },
    ward:        { type: Number,              required: reqIfVoter },
    phone:       { type: String, trim: true, required: reqIfVoter },
    // canonical: isVerified; alias keeps backward-compat with `verified`
    isVerified: {
      type: Boolean,
      default: false,
      alias: 'verified',
      index: true,
      required: reqIfVoter
    },

    // --- Biometric fields merged from biometric module ---
    // New biometric fields
    biometricRegistered: {
      type: Boolean,
      default: false,
      required: reqIfVoter
    },
    biometricType: {
      type: String,
      enum: ['face', 'webauthn', null],
      default: null,
      required: reqIfVoter
    },
    biometricRegistrationDate: {
      type: Date,
      default: null,
      required: reqIfVoter
    },

    // Detailed biometric auth metadata (per user's requested layout)
    biometricAuth: {
      faceEnrolled: { type: Boolean, default: false },
      // fingerprint removed — face-only
      lastBiometricUpdate: { type: Date },
      enrollmentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
        
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

  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Lowercase email consistently
userSchema.pre('save', function (next) {
  if (this.isModified('email') && typeof this.email === 'string') {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

// Hash password before saving (only when modified)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};
const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports= User;
module.exports.ROLES= ROLES;
