import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { requireAdmin, requireAuth } from '../middleware/clerkAuth';
import { validateBody } from '../middleware/validate';
import {
  historyBodySchema,
  listBodySchema,
  pushTokenBodySchema,
  removePushTokenBodySchema,
} from '../schemas/user';

const router = Router();

// Sign-up, sign-in, email verification, password reset, and social login are
// all handled by Clerk in the client. This service no longer issues credentials
// of its own — it only serves data for an already-authenticated Clerk session.
router.use(requireAuth);

router.get('/me', UserController.getMe);

// History & Recents
router.post('/history', validateBody(historyBodySchema), UserController.addToHistory);
router.get('/history', UserController.getHistory);
router.get('/recents', UserController.getRecents);

// User retention lists
router.get('/watchlist', UserController.getWatchlist);
router.post('/watchlist', validateBody(listBodySchema), UserController.addToWatchlist);
router.delete('/watchlist/:mediaType/:mediaId', UserController.removeFromWatchlist);
router.get('/favorites', UserController.getFavorites);
router.post('/favorites', validateBody(listBodySchema), UserController.addToFavorites);
router.delete('/favorites/:mediaType/:mediaId', UserController.removeFromFavorites);

// Push tokens
router.post('/push-token', validateBody(pushTokenBodySchema), UserController.addPushToken);
router.delete('/push-token', validateBody(removePushTokenBodySchema), UserController.removePushToken);

// Admin
router.get('/users', requireAdmin, UserController.getAllUsers);
router.delete('/users/:id', requireAdmin, UserController.deleteUser);

export default router;
