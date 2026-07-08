import express from 'express';
import { getAnalytics, getDashboardSummary } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAnalytics);
router.get('/dashboard', getDashboardSummary);

export default router;
