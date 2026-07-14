import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateToken, clearToken } from '../utils/generateToken.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Please provide name, email, and password');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'User already exists with this email');
  }

  const user = await User.create({ name, email, password });
  generateToken(res, user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      nutritionGoals: user.nutritionGoals,
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  generateToken(res, user._id);

  res.json({
    success: true,
    message: 'Login successful',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      nutritionGoals: user.nutritionGoals,
    },
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  clearToken(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ success: true, user });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { name, age, gender, height, weight, activityLevel, goal, nutritionGoals, healthPreferences } = req.body;

  if (name !== undefined) user.name = name;
  if (age !== undefined) user.age = age;
  if (gender !== undefined) user.gender = gender;
  if (height !== undefined) user.height = height;
  if (weight !== undefined) user.weight = weight;
  if (activityLevel !== undefined) user.activityLevel = activityLevel;
  if (goal !== undefined) user.goal = goal;
  if (nutritionGoals !== undefined) {
    if (nutritionGoals.calories !== undefined) user.nutritionGoals.calories = nutritionGoals.calories;
    if (nutritionGoals.protein !== undefined) user.nutritionGoals.protein = nutritionGoals.protein;
    if (nutritionGoals.carbs !== undefined) user.nutritionGoals.carbs = nutritionGoals.carbs;
    if (nutritionGoals.fat !== undefined) user.nutritionGoals.fat = nutritionGoals.fat;
  }
  if (healthPreferences !== undefined) {
    if (healthPreferences.medicalConditions !== undefined) user.healthPreferences.medicalConditions = healthPreferences.medicalConditions;
    if (healthPreferences.allergies !== undefined) user.healthPreferences.allergies = healthPreferences.allergies;
    if (healthPreferences.dietaryRestrictions !== undefined) user.healthPreferences.dietaryRestrictions = healthPreferences.dietaryRestrictions;
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser,
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Please provide current and new password');
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
});

/**
 * @desc    Upload profile image
 * @route   PUT /api/auth/profile-image
 * @access  Private
 */
export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload an image');
  }

  const result = await uploadToCloudinary(req.file.buffer, 'nutritrack/profiles');
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profileImage: result.secure_url },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Profile image updated',
    user,
  });
});
