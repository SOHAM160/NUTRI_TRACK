import express from 'express';
import { register, login, logout, getProfile, updateProfile, changePassword, uploadProfileImage } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/profile-image', protect, upload.single('profileImage'), uploadProfileImage);

export default router;
