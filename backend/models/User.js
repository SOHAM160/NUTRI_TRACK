import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  profileImage: {
    type: String,
    default: '',
  },
  age: {
    type: Number,
    min: [1, 'Age must be positive'],
    max: [150, 'Age seems invalid'],
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: '',
  },
  height: {
    type: Number, // in cm
    min: [0, 'Height must be positive'],
  },
  weight: {
    type: Number, // in kg
    min: [0, 'Weight must be positive'],
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active', ''],
    default: '',
  },
  goal: {
    type: String,
    enum: ['lose_weight', 'maintain', 'gain_muscle', 'improve_health', ''],
    default: '',
  },
  nutritionGoals: {
    calories: { type: Number, default: 2000 },
    protein: { type: Number, default: 150 },
    carbs: { type: Number, default: 250 },
    fat: { type: Number, default: 70 },
  },
  lastGoalNotifiedDate: {
    type: Date,
    default: null
  },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastSuccessDate: { type: Date, default: null },
    isInitialized: { type: Boolean, default: false },
  },
  healthPreferences: {
    medicalConditions: [{ type: String }],
    allergies: [{ type: String }],
    dietaryRestrictions: [{ type: String }]
  }
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
