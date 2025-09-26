import { Router } from 'express';
import { QueueController } from '../controllers/queueController';

const router = Router();
const queueController = new QueueController();

// Browser extension endpoints
router.post('/update', queueController.updateQueueStatus.bind(queueController));
router.get('/current', queueController.getCurrentQueueStatus.bind(queueController));
router.get('/history', queueController.getQueueHistory.bind(queueController));

// Admin/testing endpoints
router.post('/reset-notifications', queueController.resetNotifications.bind(queueController));

export default router;