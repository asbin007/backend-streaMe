import * as admin from 'firebase-admin';
import { PushToken } from '../models/PushToken';

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

export class NotificationService {
  /**
   * Broadcasts a notification to all registered users via FCM.
   */
  static async broadcastNotification(title: string, body: string, data?: any) {
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
