import express from 'express';
import { aiChat, getChats, getChat, deleteChat, generateGroceryList } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/chat', aiChat);
router.get('/chats', getChats);
router.get('/chats/:id', getChat);
router.delete('/chats/:id', deleteChat);
router.post('/generate-grocery', generateGroceryList);

export default router;
