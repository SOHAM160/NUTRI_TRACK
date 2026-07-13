import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generatePlan, regenerateSingleMeal, savePlan, getPlans } from '../controllers/mealPlanController.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generatePlan);
router.post('/regenerate-single', regenerateSingleMeal);
router.post('/', savePlan);
router.get('/', getPlans);

export default router;
