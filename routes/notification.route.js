import express from "express";
import { createNotification, getUserNotifications, markNotificationAsRead, markAllNotificationAsRead } from "../controllers/notifications/notification.controller.js";

const router = express.Router();

router.post('/create-notifications', createNotification);
router.get('/notifications/:userId', getUserNotifications);
router.post('/markAsRead', markNotificationAsRead);
router.post('/markAllAsRead', markAllNotificationAsRead);


export default router;