import express from 'express';
import { getAnalytics, getDashboardSummary } from '../controllers/analyticsController.js';
import { getStreakData } from '../controllers/streakController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAnalytics);
router.get('/dashboard', getDashboardSummary);
router.get('/streaks', getStreakData);

export default router;
