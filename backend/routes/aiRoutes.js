import express from 'express';
import { aiChat, getChats, getChat, deleteChat } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/chat', aiChat);
router.get('/chats', getChats);
router.get('/chats/:id', getChat);
router.delete('/chats/:id', deleteChat);

export default router;
