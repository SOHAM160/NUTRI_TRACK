import express from 'express';
import { searchBarcode } from '../controllers/barcodeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/search', searchBarcode);

export default router;
