import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getFavorites,
  getFolders,
  addFavorite,
  updateFavorite,
  deleteFavorite
} from '../controllers/favoriteController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
  .get(getFavorites)
  .post(addFavorite);

router.get('/folders', getFolders);

router.route('/:id')
  .put(updateFavorite)
  .delete(deleteFavorite);

export default router;
