import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

const router = express.Router();

router.use(protect);

/**
 * @desc    Upload an image to Cloudinary
 * @route   POST /api/upload
 * @access  Private
 */
router.post('/', upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload an image');
  }

  const result = await uploadToCloudinary(req.file.buffer, 'nutritrack/uploads');

  res.json({
    success: true,
    url: result.secure_url,
    publicId: result.public_id,
  });
}));

export default router;
