import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import EmailReminderService from '../services/emailReminderService';
import { getUserId, requireAdmin, requireAuth } from '../middleware/clerkAuth';
import { emailLimiter } from '../middleware/rateLimiter';

const router = Router();

// Every route below identifies the caller from a verified Clerk session.
// Previously none of them mounted auth at all, so `req.user` was always
// undefined: the preference endpoints answered 401 unconditionally and
// `/track-visit` accepted an arbitrary `userId` from the request body.
router.use(requireAuth);

/**
 * Track user visit - updates lastVisitedAt timestamp
 * Called whenever user opens the app or navigates
 */
router.post('/track-visit', async (req: Request, res: Response) => {
  try {
    await EmailReminderService.updateLastVisit(getUserId(req));

    res.status(200).json({ success: true, message: 'Visit tracked' });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({ error: 'Failed to track visit' });
  }
});

/**
 * Get reminder email preferences for current user
 */
router.get('/reminder-preferences', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const user = await User.findByPk(userId, {
      attributes: ['id', 'reminderEmailEnabled', 'lastNotificationSentAt', 'lastVisitedAt'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      reminderEmailEnabled: user.reminderEmailEnabled,
      lastNotificationSentAt: user.lastNotificationSentAt,
      lastVisitedAt: user.lastVisitedAt,
    });
  } catch (error) {
    console.error('Error fetching reminder preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * Update reminder email preferences
 */
router.put('/reminder-preferences', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { reminderEmailEnabled } = req.body;

    if (typeof reminderEmailEnabled !== 'boolean') {
      return res.status(400).json({ error: 'reminderEmailEnabled must be a boolean' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.reminderEmailEnabled = reminderEmailEnabled;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Reminder emails ${reminderEmailEnabled ? 'enabled' : 'disabled'}`,
      reminderEmailEnabled: user.reminderEmailEnabled,
    });
  } catch (error) {
    console.error('Error updating reminder preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * Send a test reminder email to current user
 * Useful for testing the feature without waiting for cron job
 */
router.post('/send-test-reminder', emailLimiter, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.email) {
      return res.status(400).json({ error: 'User does not have an email address' });
    }

    const sent = await EmailReminderService.sendReminderEmail(user);

    if (sent) {
      res.status(200).json({
        success: true,
        message: 'Test reminder email sent successfully',
        email: user.email,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test reminder email',
      });
    }
  } catch (error) {
    console.error('Error sending test reminder:', error);
    res.status(500).json({ error: 'Failed to send test reminder' });
  }
});

/**
 * Manually trigger reminder emails for all inactive users
 * Admin endpoint - requires admin authentication
 */
router.post('/trigger-reminders', requireAdmin, async (req: Request, res: Response) => {
  try {
    const parsedDays = Number(req.body?.inactivityDays ?? 3);
    const inactivityDays =
      Number.isFinite(parsedDays) && parsedDays >= 1 && parsedDays <= 365
        ? Math.floor(parsedDays)
        : 3;

    const sentCount = await EmailReminderService.sendBatchReminders(inactivityDays);

    res.status(200).json({
      success: true,
      message: `Reminder emails sent to ${sentCount} users`,
      sentCount,
      inactivityDays,
    });
  } catch (error) {
    console.error('Error triggering reminders:', error);
    res.status(500).json({ error: 'Failed to trigger reminders' });
  }
});

export default router;
