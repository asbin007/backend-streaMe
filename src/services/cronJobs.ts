import cron from 'node-cron';
import { Op } from 'sequelize';
import { User } from '../models/User';
import { NotificationService } from './notificationService';
import EmailReminderService from './emailReminderService';

export const startCronJobs = () => {

  // Daily task at 10:00 AM to notify users who haven't visited in exactly 7 days
  cron.schedule('0 10 * * *', async () => {
    console.log('Running daily retention cron job...');

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      // Find users whose last update was between 7 and 8 days ago
      // Utilizing updatedAt as a slight proxy for last active session
      const inactiveUsers = await User.findAll({
        where: {
          updatedAt: {
            [Op.lt]: sevenDaysAgo,
            [Op.gt]: eightDaysAgo,
          }
        },
        attributes: ['id', 'email', 'username']
      });

      if (inactiveUsers.length === 0) {
        console.log('No inactive users found for the retention campaign today.');
        return;
      }

      const userIds = inactiveUsers.map(u => u.id);
      const emails = inactiveUsers.map(u => u.email).filter(e => !!e);

      const title = 'We Miss You! 🎬';
      const body = 'It looks like you haven\'t visited StreaMe in a while. Come back and check out our new movies and episodes!';

      await NotificationService.sendTargetedNotification(userIds, emails, title, body, { type: 'retention' });

      console.log(`Sent retention notifications to ${inactiveUsers.length} users.`);

    } catch (error) {
      console.error('Error running retention cron job:', error);
    }
  });

  // Reminder emails cron job - Runs every day at 9:00 AM
  // Sends personalized reminder emails to users who haven't visited in 3+ days
  cron.schedule('0 9 * * *', async () => {
    console.log('Running email reminder cron job...');

    try {
      const sentCount = await EmailReminderService.sendBatchReminders(3); // 3 days inactivity threshold
      console.log(`Email reminder cron job completed. Sent ${sentCount} emails.`);
    } catch (error) {
      console.error('Error running email reminder cron job:', error);
    }
  });

  console.log('Cron jobs initialized successfully.');
};
