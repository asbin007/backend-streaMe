"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/register', userController_1.UserController.register);
router.post('/login', userController_1.UserController.login);
router.post('/verify-otp', userController_1.UserController.verifyOtp);
router.post('/resend-otp', userController_1.UserController.resendOtp);
router.post('/forgot-password', userController_1.UserController.forgotPassword);
router.post('/reset-password', userController_1.UserController.resetPassword);
// History & Recents
router.post('/history', authMiddleware_1.authenticateToken, userController_1.UserController.addToHistory);
router.get('/history', authMiddleware_1.authenticateToken, userController_1.UserController.getHistory);
router.get('/recents', authMiddleware_1.authenticateToken, userController_1.UserController.getRecents);
exports.default = router;
