import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateReport, getReports } from '../controllers/reportController.js';

const router = express.Router();
router.use(protect);
router.post('/generate', generateReport);
router.get('/', getReports);

export default router;
