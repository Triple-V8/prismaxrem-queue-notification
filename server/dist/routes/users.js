"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = __importDefault(require("../controllers/userController"));
const router = (0, express_1.Router)();
router.post('/register', userController_1.default.registerUser);
router.get('/all', userController_1.default.getAllUsers);
router.get('/:id', userController_1.default.getUser);
router.get('/pattern/:pattern', userController_1.default.findByUsernamePattern);
router.get('/email/:email', userController_1.default.findByEmail);
router.patch('/:id/notification-status', userController_1.default.updateNotificationStatus);
router.post('/test-telegram', userController_1.default.testTelegram);
router.get('/telegram/status', userController_1.default.getTelegramStatus);
exports.default = router;
