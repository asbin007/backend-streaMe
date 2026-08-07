import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { requireAdmin, requireAuth } from '../middleware/clerkAuth';

const router = Router();

// Sign-up, sign-in, email verification, password reset, and social login are
// all handled by Clerk in the client. This service no longer issues credentials
// of its own — it only serves data for an already-authenticated Clerk session.
router.use(requireAuth);

router.get('/me', UserController.getMe);

// History & Recents
router.post('/history', UserController.addToHistory);
router.get('/history', UserController.getHistory);
router.get('/recents', UserController.getRecents);

// User retention lists
router.get('/watchlist', UserController.getWatchlist);
router.post('/watchlist', UserController.addToWatchlist);
router.delete('/watchlist/:mediaType/:mediaId', UserController.removeFromWatchlist);
router.get('/favorites', UserController.getFavorites);
router.post('/favorites', UserController.addToFavorites);
router.delete('/favorites/:mediaType/:mediaId', UserController.removeFromFavorites);

// Push tokens
router.post('/push-token', UserController.addPushToken);
router.delete('/push-token', UserController.removePushToken);

// Admin
router.get('/users', requireAdmin, UserController.getAllUsers);
router.delete('/users/:id', requireAdmin, UserController.deleteUser);

export default router;
