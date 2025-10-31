import mongoose from 'mongoose';

const biometricSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Which biometrics are registered
  faceRegistered: {
    type: Boolean,
    default: false
  },

  // WebAuthn / Public Key Credential details (ADDED HERE)
  credentialId: {
    type: String,
    default: null
  },
  credentialPublicKey: {
    type: String,
    default: null
  },
  signCount: {
    type: Number,
    default: 0
  },
  // Support multiple WebAuthn credentials per user
  webauthnCredentials: {
    type: [
      {
        credentialId: String,
        credentialPublicKey: String,
        counter: Number,
        deviceType: String,
        registeredAt: Date
      }
    ],
    select: false,
    default: []
  },

  // Store references to registered biometric templates
  faceTemplateId: {
    type: String,
    default: null
  },

  // Support multiple face templates/encodings (when user submits several photos)
  faceTemplateIds: {
    type: [String],
    select: false,
    default: []
  },

  // Persisted template encodings (backend-owned storage)
  faceEncoding: {
    type: [Number],
    select: false,
    default: null
  },

  // Encrypted storage buckets (AES-GCM encrypted objects)
  faceEncodingEncrypted: {
    type: mongoose.Schema.Types.Mixed,
    select: false,
    default: null
  },
  faceEncodingsEncrypted: {
    type: [mongoose.Schema.Types.Mixed],
    select: false,
    default: []
  },

  // Keep array of encodings from multiple captures
  faceEncodings: {
    type: [[Number]],
    select: false,
    default: []
  },

  // Optional: base64 image/fingerprint placeholders for dev mode
  faceImageSample: {
    type: String,
    select: false
  },

  // Registration and verification tracking
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastVerified: {
    type: Date
  },
  verificationAttempts: {
    type: Number,
    default: 0
  },
  successfulVerifications: {
    type: Number,
    default: 0
  },

  // Record last result or reason for audit
  lastVerificationStatus: {
    type: String,
    enum: ['success', 'failure', 'pending', 'unknown'],
    default: 'unknown'
  },
  lastVerificationError: {
    type: String,
    default: null
  },

  // For future use — store which biometric service handled this user
  provider: {
    type: String,
    default: 'local'
  }

}, {
  timestamps: true
});

// Compound index for fast lookups
biometricSchema.index({ userId: 1 });

// Optional middleware: sanity check on verification counters
biometricSchema.pre('save', function (next) {
  this.verificationAttempts = Math.max(0, this.verificationAttempts);
  this.successfulVerifications = Math.max(0, this.successfulVerifications);
  next();
});

export default mongoose.model('Biometric', biometricSchema);
