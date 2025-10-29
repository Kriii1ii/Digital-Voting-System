import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      // keep your existing role name for committee
      enum: ['voter', 'candidate', 'admin', 'electoral_committee'],
      default: 'voter',
      index: true,
    },

    fullName: { type: String, required: true, trim: true },

    dateOfBirth: { type: String, required: true },
    phone: { type: String, required: true, trim: true },

    // email normalized & unique
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // hide password from queries by default
    password: { type: String, required: true, select: false },

    idType: { type: String, enum: ['citizenship', 'national', 'passport'], required: true },
    idNumber: { type: String, required: true, trim: true },

    // canonical: voterId; alias keeps backward-compat with `voterid`
    voterId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      alias: 'voterid',
      trim: true,
    },

    province: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    ward: { type: Number, required: true },

    // canonical: isVerified; alias keeps backward-compat with `verified`
    isVerified: {
      type: Boolean,
      default: false,
      alias: 'verified',
      index: true,
    },
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

// Helpful compound indexes (optional)
userSchema.index({ role: 1, isVerified: 1 });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ voterId: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
export default User;
