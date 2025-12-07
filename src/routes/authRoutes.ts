import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/verify-otp', UserController.verifyOtp);
router.post('/resend-otp', UserController.resendOtp);
router.post('/forgot-password', UserController.forgotPassword);
router.post('/reset-password', UserController.resetPassword);

// History & Recents
router.post('/history', authenticateToken, UserController.addToHistory);
router.get('/history', authenticateToken, UserController.getHistory);
router.get('/recents', authenticateToken, UserController.getRecents);

export default router;
