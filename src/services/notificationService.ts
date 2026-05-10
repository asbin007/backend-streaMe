import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import { PushToken } from '../models/PushToken';
import { User } from '../models/User';
import config from '../config/config';

// Note: You must provide a service account JSON for firebase-admin to work properly.
// Typically done through an environment variable like GOOGLE_APPLICATION_CREDENTIALS 
// or initializing directly with admin.credential.cert(serviceAccountJson)

let isInitialized = false;

try {
  // If FIREBASE_SERVICE_ACCOUNT is provided in env as a JSON string, initialize with it.
  // Otherwise, default to application default credentials.
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountEnv) {
    const serviceAccount = JSON.parse(serviceAccountEnv);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isInitialized = true;
  } else if (!admin.apps.length) {
    admin.initializeApp(); // relies on GOOGLE_APPLICATION_CREDENTIALS
    isInitialized = true;
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

// Nodemailer (Gmail) configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email,
    pass: config.password,
  },
});

export class NotificationService {
  /**
   * Broadcasts a notification to all registered users via FCM and Gmail.
   */
  static async broadcastNotification(title: string, body: string, data?: any) {
    // 1. Send via Gmail to all Users
    try {
      // Fetch users who have an email
      const users = await User.findAll({ attributes: ['email'] });
      const emails = users.map(u => u.email).filter(e => !!e);

      if (emails.length > 0) {
        const mailOptions = {
          from: `"StreaMe Updates" <${config.email}>`,
          bcc: emails, // Using BCC so users don't see each other's emails
          subject: title,
          html: `
            <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">
              <h2 style="color: #e50914;">${title}</h2>
              <p style="font-size: 16px;">${body}</p>
              <br/>
              <p>
                <a href="${config.base_url}" style="background-color: #e50914; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Watch Now on StreaMe
                </a>
              </p>
            </div>
          `,
        };
        
        // Send email without blocking the push notifications
        transporter.sendMail(mailOptions).then(() => {
          console.log(`Successfully sent email notifications to ${emails.length} users via Gmail.`);
        }).catch(err => {
          console.error('Error sending Gmail notification:', err);
        });
      }
    } catch (error) {
      console.error('Error fetching users for Gmail notification:', error);
    }

    // 2. Send via Firebase Cloud Messaging
    if (!isInitialized) {
      console.warn('Firebase Admin is not initialized. Notification not sent.');
      return;
    }

    try {
      // Get all stored push tokens
      const pushTokens = await PushToken.findAll();
      const tokens = pushTokens.map(pt => pt.token).filter(token => !!token);

      if (tokens.length === 0) {
        console.log('No push tokens found to send notifications.');
        return;
      }

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body,
        },
        data: data || {},
        tokens: tokens,
      };

      // Send to all tokens
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`Successfully sent ${response.successCount} messages; Failed ${response.failureCount} messages.`);
      
      // Cleanup invalid tokens if any failures
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        
        if (failedTokens.length > 0) {
          await PushToken.destroy({
            where: {
              token: failedTokens
            }
          });
          console.log(`Removed ${failedTokens.length} invalid push tokens.`);
        }
      }
    } catch (error) {
      console.error('Error broadcasting notification:', error);
    }
  }

  // Pre-defined notification templates
  static async notifyNewMovieAdded(movieTitle: string, movieId: string) {
    return this.broadcastNotification(
      '🔥 New Movie Added',
      `"${movieTitle}" is now available to watch!`,
      { type: 'movie', id: movieId.toString() }
    );
  }

  static async notifyLiveMatchStarted(matchTitle: string, matchId: string) {
    return this.broadcastNotification(
      '📺 Live Match Started',
      `${matchTitle} has just started streaming live!`,
      { type: 'live', id: matchId.toString() }
    );
  }

  static async notifyNewEpisodeReleased(seriesTitle: string, episodeNumber: number | string, seriesId: string) {
    return this.broadcastNotification(
      `🎬 Episode ${episodeNumber} Released`,
      `The latest episode of "${seriesTitle}" is out now!`,
      { type: 'episode', id: seriesId.toString() }
    );
  }
}
