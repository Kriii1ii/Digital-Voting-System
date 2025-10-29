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
  voterid: { type: String, required: true, unique: true },
  province: { type: String, required: true },
  district: { type: String, required: true },
  ward: { type: Number, required: true },
  verified: { type: Boolean, default: false },
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
