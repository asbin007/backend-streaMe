import nodemailer from 'nodemailer';
import { User } from '../models/User';
import { UserListItem } from '../models/UserListItem';
import { WatchHistory } from '../models/WatchHistory';
import config from '../config/config';
import { Op } from 'sequelize';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email,
    pass: config.password,
  },
});

interface MovieSuggestion {
  id: string;
  title: string;
  posterPath?: string;
  mediaType: 'movie' | 'tv';
}

export class EmailReminderService {
  /**
   * Get user's favorite movies/shows
   */
  static async getUserFavorites(userId: string, limit: number = 3): Promise<MovieSuggestion[]> {
    try {
      const favorites = await UserListItem.findAll({
        where: {
          userId,
          listType: 'favorite',
        },
        order: [['createdAt', 'DESC']],
        limit,
        attributes: ['mediaId', 'mediaType'],
      });

      return favorites.map(fav => ({
        id: fav.mediaId,
        title: `${fav.mediaType === 'movie' ? '🎬' : '📺'} ${fav.mediaType === 'movie' ? 'Movie' : 'Series'} #${fav.mediaId}`,
        mediaType: fav.mediaType,
      }));
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      return [];
    }
  }

  /**
   * Get recently added movies (upcoming/trending)
   */
  static async getUpcomingContent(limit: number = 2): Promise<MovieSuggestion[]> {
    try {
      const recentHistory = await WatchHistory.findAll({
        order: [['createdAt', 'DESC']],
        limit,
        attributes: ['mediaId', 'mediaType', 'title'],
        group: ['mediaId'],
      });

      return recentHistory.map(item => ({
        id: item.mediaId,
        title: item.title || `${item.mediaType === 'movie' ? '🎬' : '📺'} #${item.mediaId}`,
        posterPath: item.posterPath,
        mediaType: item.mediaType,
      }));
    } catch (error) {
      console.error('Error fetching upcoming content:', error);
      return [];
    }
  }

  /**
   * Generate HTML email template
   */
  static generateEmailTemplate(userName: string, favorites: MovieSuggestion[], upcoming: MovieSuggestion[]): string {
    const baseUrl = config.base_url || 'http://localhost:5173';

    const favoritesHTML = favorites
      .map(
        (fav, idx) => `
        <div style="display: inline-block; margin: 10px 15px; text-align: center;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      width: 120px; height: 160px; border-radius: 8px; 
                      display: flex; align-items: center; justify-content: center;
                      color: white; font-weight: bold; cursor: pointer;">
            ${fav.title.substring(0, 20)}
          </div>
          <p style="font-size: 12px; margin-top: 8px; color: #666;">${fav.mediaType === 'movie' ? '🎬 Movie' : '📺 Series'}</p>
        </div>
      `
      )
      .join('');

    const upcomingHTML = upcoming
      .map(
        (item, idx) => `
        <div style="margin: 12px 0; padding: 12px; background: #f5f5f5; border-left: 4px solid #e50914; border-radius: 4px;">
          <strong style="color: #333;">${item.title}</strong>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">
            ${item.mediaType === 'movie' ? '🎬 New Movie' : '📺 New Series'}
          </p>
        </div>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #e50914 0%, #b20710 100%); 
                      color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .section-title { color: #e50914; font-size: 18px; font-weight: bold; margin-top: 25px; margin-bottom: 15px; }
            .cta-button { display: inline-block; background: #e50914; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">🎬 Aura Screen</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">We miss you!</p>
            </div>

            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <p>
                It's been a while since you visited Aura Screen! 🍿 We've curated some amazing content just for you based on your favorites.
              </p>

              ${
                favorites.length > 0
                  ? `
                <div class="section-title">📌 Your Favorite Picks</div>
                <p>Revisit the movies and series you loved:</p>
                <div style="text-align: center; margin: 15px 0;">
                  ${favoritesHTML}
                </div>
              `
                  : ''
              }

              ${
                upcoming.length > 0
                  ? `
                <div class="section-title">⭐ What's New & Trending</div>
                <p>Check out these recently added titles:</p>
                ${upcomingHTML}
              `
                  : ''
              }

              <div style="text-align: center;">
                <a href="${baseUrl}" class="cta-button">
                  Continue Watching Now →
                </a>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                <strong>Pro Tip:</strong> Don't miss out on new releases! Subscribe to our notifications to get updates about new movies, series, and special recommendations.
              </p>
            </div>

            <div class="footer">
              <p>
                This is a reminder email from Aura Screen. 
                <a href="${baseUrl}/settings" style="color: #e50914; text-decoration: none;">Manage preferences</a>
              </p>
              <p>© ${new Date().getFullYear()} Aura Screen. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send reminder email to a user
   */
  static async sendReminderEmail(user: User): Promise<boolean> {
    try {
      if (!user.reminderEmailEnabled) {
        console.log(`Email reminders disabled for user ${user.id}`);
        return false;
      }

      // Get user's favorite content and upcoming suggestions
      const favorites = await this.getUserFavorites(user.id, 3);
      const upcoming = await this.getUpcomingContent(2);

      // Generate email HTML
      const htmlContent = this.generateEmailTemplate(user.username, favorites, upcoming);

      // Send email
      const mailOptions = {
        from: `"🎬 Aura Screen" <${config.email}>`,
        to: user.email,
        subject: `${user.username}, we have new content waiting for you! 🎬`,
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Reminder email sent to ${user.email}:`, info.messageId);

      // Update last notification sent timestamp
      user.lastNotificationSentAt = new Date();
      await user.save();

      return true;
    } catch (error) {
      console.error(`Error sending reminder email to ${user.email}:`, error);
      return false;
    }
  }

  /**
   * Send batch reminder emails to inactive users
   */
  static async sendBatchReminders(inactivityDays: number = 3): Promise<number> {
    try {
      // Find users who:
      // 1. Haven't visited in X days
      // 2. Have reminder emails enabled
      // 3. Haven't received a reminder in the last 2 days
      const nDaysAgo = new Date();
      nDaysAgo.setDate(nDaysAgo.getDate() - inactivityDays);

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const inactiveUsers = await User.findAll({
        where: {
          reminderEmailEnabled: true,
          email: { [Op.ne]: null },
          [Op.and]: [
            {
              [Op.or]: [
                { lastVisitedAt: { [Op.lt]: nDaysAgo } },
                { lastVisitedAt: null }, // Never visited
              ],
            },
            {
              [Op.or]: [
                { lastNotificationSentAt: null }, // Never sent notification
                { lastNotificationSentAt: { [Op.lt]: twoDaysAgo } }, // Not sent in 2 days
              ],
            }
          ]
        },
        attributes: ['id', 'email', 'username', 'reminderEmailEnabled', 'lastNotificationSentAt'],
        limit: 100, // Batch limit
      });

      console.log(`Found ${inactiveUsers.length} inactive users for reminder emails`);

      let successCount = 0;
      for (const user of inactiveUsers) {
        const sent = await this.sendReminderEmail(user);
        if (sent) successCount++;
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`Successfully sent ${successCount}/${inactiveUsers.length} reminder emails`);
      return successCount;
    } catch (error) {
      console.error('Error in batch reminder job:', error);
      return 0;
    }
  }

  /**
   * Update last visited timestamp
   */
  static async updateLastVisit(userId: string): Promise<void> {
    try {
      const user = await User.findByPk(userId);
      if (user) {
        user.lastVisitedAt = new Date();
        await user.save();
      }
    } catch (error) {
      console.error('Error updating last visit:', error);
    }
  }
}

export default EmailReminderService;
