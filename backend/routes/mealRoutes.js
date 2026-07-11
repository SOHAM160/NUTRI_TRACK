import express from 'express';
import { createMeal, getMeals, getMeal, updateMeal, deleteMeal, getTodayMeals, getMealSuggestions } from '../controllers/mealController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect); // All meal routes are protected

router.get('/today', getTodayMeals);
router.route('/')
  .get(getMeals)
  .post(upload.single('image'), createMeal);

router.get('/suggestions', getMealSuggestions);

router.route('/:id')
  .get(getMeal)
  .put(upload.single('image'), updateMeal)
  .delete(deleteMeal);

export default router;
