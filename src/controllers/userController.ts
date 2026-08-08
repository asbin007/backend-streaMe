import { Request, Response } from 'express';
import { User } from '../models/User';
import { WatchHistory } from '../models/WatchHistory';
import { UserListItem } from '../models/UserListItem';
import { PushToken } from '../models/PushToken';
import { getUserId } from '../middleware/clerkAuth';

/**
 * Account data for the signed-in user.
 *
 * Identity (registration, login, OTP, password reset, social sign-in) is
 * handled entirely by Clerk. This controller only owns app-side data — watch
 * history, lists, and push registrations — keyed by the local user row that
 * `requireAuth` resolves from the Clerk session.
 */
export class UserController {
  /** Profile for the signed-in user, read from the local record. */
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findByPk(getUserId(req), {
        attributes: [
          'id',
          'username',
          'email',
          'role',
          'avatarUrl',
          'isVerified',
          'reminderEmailEnabled',
          'createdAt',
        ],
      });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json({ data: user });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // ----------------------------------------------------------------- Admin

  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await User.findAll({
        attributes: ['id', 'username', 'email', 'role', 'isVerified', 'createdAt'],
      });
      res.status(200).json({ data: users });
    } catch (error) {
      console.error('Error listing users:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (user.role === 'admin' || user.role === 'super_admin') {
        res.status(403).json({ message: 'Cannot delete admin users' });
        return;
      }

      await user.destroy();
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // ------------------------------------------------------- History & Recents

  static async addToHistory(req: Request, res: Response): Promise<void> {
    try {
      const { mediaId, mediaType, title, posterPath, progress, duration, season, episode } =
        req.body;
      const userId = getUserId(req);

      if (!mediaId || !mediaType) {
        res.status(400).json({ message: 'Media ID and Type are required' });
        return;
      }

      // Only meaningful for series, and only when they parse as positive ints.
      const parsePart = (value: unknown): number | null => {
        const n = Number(value);
        return Number.isInteger(n) && n > 0 ? n : null;
      };
      const seasonNo = mediaType === 'tv' ? parsePart(season) : null;
      const episodeNo = mediaType === 'tv' ? parsePart(episode) : null;

      let history = await WatchHistory.findOne({
        where: { userId, mediaId, mediaType },
      });

      if (history) {
        history.progress = progress ?? history.progress;
        history.duration = duration ?? history.duration;
        // Track the latest episode so the viewer resumes where they stopped,
        // not at whichever episode they happened to open first.
        if (seasonNo !== null) history.season = seasonNo;
        if (episodeNo !== null) history.episode = episodeNo;
        history.lastWatchedAt = new Date();
        await history.save();
      } else {
        history = await WatchHistory.create({
          userId,
          mediaId,
          mediaType,
          title,
          posterPath,
          season: seasonNo,
          episode: episodeNo,
          progress: progress || 0,
          duration: duration || 0,
          lastWatchedAt: new Date(),
        });
      }

      res.status(200).json({ message: 'History updated', data: history });
    } catch (error) {
      console.error('Error updating history:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const history = await WatchHistory.findAll({
        where: { userId: getUserId(req) },
        order: [['lastWatchedAt', 'DESC']],
        limit: 50,
      });
      res.status(200).json({ data: history });
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getRecents(req: Request, res: Response): Promise<void> {
    try {
      const recents = await WatchHistory.findAll({
        where: { userId: getUserId(req) },
        order: [['lastWatchedAt', 'DESC']],
        limit: 10,
      });
      res.status(200).json({ data: recents });
    } catch (error) {
      console.error('Error fetching recents:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // -------------------------------------------------------------- User lists

  private static async getList(
    req: Request,
    res: Response,
    listType: 'watchlist' | 'favorite'
  ): Promise<void> {
    try {
      const items = await UserListItem.findAll({
        where: { userId: getUserId(req), listType },
        order: [['createdAt', 'DESC']],
        limit: 100,
      });

      res.status(200).json({ data: items });
    } catch (error) {
      console.error(`Error fetching ${listType}:`, error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  private static async addToList(
    req: Request,
    res: Response,
    listType: 'watchlist' | 'favorite'
  ): Promise<void> {
    try {
      const { mediaId, mediaType, title, posterPath } = req.body;
      const userId = getUserId(req);

      if (!mediaId || !mediaType || !title) {
        res.status(400).json({ message: 'Media ID, media type, and title are required' });
        return;
      }

      const [item, created] = await UserListItem.findOrCreate({
        where: { userId, listType, mediaId, mediaType },
        defaults: {
          userId,
          listType,
          mediaId,
          mediaType,
          title,
          posterPath: posterPath || '',
        },
      });

      if (!created) {
        item.title = title;
        item.posterPath = posterPath || item.posterPath;
        await item.save();
      }

      res.status(created ? 201 : 200).json({ message: 'List updated', data: item });
    } catch (error) {
      console.error(`Error adding to ${listType}:`, error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  private static async removeFromList(
    req: Request,
    res: Response,
    listType: 'watchlist' | 'favorite'
  ): Promise<void> {
    try {
      const { mediaType, mediaId } = req.params;

      const deleted = await UserListItem.destroy({
        where: { userId: getUserId(req), listType, mediaType, mediaId },
      });

      if (!deleted) {
        res.status(404).json({ message: 'Item not found' });
        return;
      }

      res.status(200).json({ message: 'Item removed' });
    } catch (error) {
      console.error(`Error removing from ${listType}:`, error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getWatchlist(req: Request, res: Response): Promise<void> {
    return UserController.getList(req, res, 'watchlist');
  }

  static async addToWatchlist(req: Request, res: Response): Promise<void> {
    return UserController.addToList(req, res, 'watchlist');
  }

  static async removeFromWatchlist(req: Request, res: Response): Promise<void> {
    return UserController.removeFromList(req, res, 'watchlist');
  }

  static async getFavorites(req: Request, res: Response): Promise<void> {
    return UserController.getList(req, res, 'favorite');
  }

  static async addToFavorites(req: Request, res: Response): Promise<void> {
    return UserController.addToList(req, res, 'favorite');
  }

  static async removeFromFavorites(req: Request, res: Response): Promise<void> {
    return UserController.removeFromList(req, res, 'favorite');
  }

  // ------------------------------------------------------------ Push tokens

  static async addPushToken(req: Request, res: Response): Promise<void> {
    try {
      const { token, deviceInfo } = req.body;

      if (!token || typeof token !== 'string') {
        res.status(400).json({ message: 'Token is required' });
        return;
      }

      await PushToken.findOrCreate({
        where: { userId: getUserId(req), token },
        defaults: { deviceInfo },
      });

      res.status(200).json({ message: 'Push token saved successfully' });
    } catch (error) {
      console.error('Add push token error:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }

  static async removePushToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token || typeof token !== 'string') {
        res.status(400).json({ message: 'Token is required' });
        return;
      }

      await PushToken.destroy({ where: { userId: getUserId(req), token } });

      res.status(200).json({ message: 'Push token removed successfully' });
    } catch (error) {
      console.error('Remove push token error:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
}
