import { Router } from 'express';
import UserController from '../controllers/userController';

const router = Router();

// User registration and management routes
router.post('/register', UserController.registerUser);
router.get('/all', UserController.getAllUsers);
router.get('/:id', UserController.getUser);
router.get('/pattern/:pattern', UserController.findByUsernamePattern);
router.get('/email/:email', UserController.findByEmail);
router.patch('/:id/notification-status', UserController.updateNotificationStatus);

// Telegram-related routes
router.post('/test-telegram', UserController.testTelegram);
router.get('/telegram/status', UserController.getTelegramStatus);

export default router;