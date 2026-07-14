import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  logSymptoms, 
  getGutHealthHistory, 
  getGutHealthInsights
} from '../controllers/gutHealthController.js';

const router = express.Router();

router.use(protect);

router.post('/', logSymptoms);
router.get('/', getGutHealthHistory);
router.get('/insights', getGutHealthInsights);

export default router;
