# Email Reminder Feature - Quick Setup Guide

## What's New?

✅ **Automatic inactive user detection** - Tracks when users last visited the app  
✅ **Personalized reminder emails** - Includes user's favorite movies/shows  
✅ **Scheduled daily job** - Runs at 9 AM every day  
✅ **User preferences** - Users can enable/disable reminders  
✅ **Test email feature** - Users can send themselves a test email  
✅ **Admin controls** - Manually trigger reminders for testing  

## Files Created/Modified

### Backend
- ✅ `src/models/User.ts` - Added reminder tracking fields
- ✅ `src/services/emailReminderService.ts` - Email reminder logic (NEW)
- ✅ `src/services/cronJobs.ts` - Added 9 AM daily reminder job
- ✅ `src/routes/reminderRoutes.ts` - API endpoints (NEW)
- ✅ `src/server.ts` - Registered routes

### Frontend
- ✅ `src/hooks/useTrackVisit.ts` - Activity tracking hook (NEW)
- ✅ `src/components/ReminderEmailSettings.tsx` - Settings component (NEW)
- ✅ `src/App.tsx` - Integrated tracking hook

## Installation Steps

### 1. Backend Setup

**No additional dependencies needed!** The feature uses existing packages:
- `node-cron` - Scheduled tasks
- `nodemailer` - Email sending
- `sequelize-typescript` - Database models

### 2. Database Migration

Run migrations to add new User fields:
```bash
# In backend directory
npm run build
npm run dev

# Or if using migration tool:
npx sequelize-cli db:migrate
```

The new fields are automatically added to User table:
- `lastVisitedAt` (DATE) - When user last accessed app
- `lastNotificationSentAt` (DATE) - When last reminder sent
- `reminderEmailEnabled` (BOOLEAN) - Default: true

### 3. Environment Variables (Already Set)

No new environment variables needed! Uses existing:
```env
EMAIL=your-email@gmail.com
PASSWORD=your-app-password
BASE_URL=http://localhost:5173 (used in email links)
```

### 4. Frontend Integration

The tracking hook is automatically integrated into `App.tsx`:
- Runs on every page visit
- Silently updates backend
- No UI impact

### 5. Test the Feature

**Step 1: Start backend**
```bash
cd backend-streaMe
npm run dev
```

You should see in console:
```
Running email reminder cron job...
```

**Step 2: Test tracking**
```bash
curl -X POST http://localhost:5000/api/reminders/track-visit \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id-here"}'
```

Response:
```json
{
  "success": true,
  "message": "Visit tracked"
}
```

**Step 3: Send test email**

Login to frontend, go to Profile Settings, click "Send Test Email"

Or via API:
```bash
curl -X POST http://localhost:5000/api/reminders/send-test-reminder \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Step 4: Check email preferences**
```bash
curl -X GET http://localhost:5000/api/reminders/reminder-preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "reminderEmailEnabled": true,
  "lastNotificationSentAt": "2024-01-15T09:30:00Z",
  "lastVisitedAt": "2024-01-15T14:20:00Z"
}
```

## How to Use

### For Users

1. **Settings** → Go to Profile page
2. **Preferences** → Look for "Reminder Email Preferences" section
3. **Toggle** → Enable/disable reminder emails
4. **Test** → Click "Send Test Email" to preview

### For Admins

**Manually send reminders:**
```bash
curl -X POST http://localhost:5000/api/reminders/trigger-reminders \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inactivityDays": 3}'
```

Response:
```json
{
  "success": true,
  "message": "Reminder emails sent to 42 users",
  "sentCount": 42,
  "inactivityDays": 3
}
```

## Automatic Schedule

**Daily at 9:00 AM (UTC):**
- System finds users inactive for 3+ days
- Fetches their favorite movies/shows
- Gets trending new content
- Sends personalized email
- Updates `lastNotificationSentAt` timestamp
- Prevents duplicate emails (max 1 per 2 days)

## Settings Integration

Add this to your Profile page to let users manage preferences:

```tsx
import ReminderEmailSettings from '../components/ReminderEmailSettings';

export function ProfilePage() {
  return (
    <div>
      {/* ... existing profile content ... */}
      <ReminderEmailSettings />
    </div>
  );
}
```

## Configuration

### Change inactivity threshold

In `src/services/cronJobs.ts` line ~60:
```typescript
const sentCount = await EmailReminderService.sendBatchReminders(7); // Change 3 to desired days
```

### Change cron schedule

In `src/services/cronJobs.ts`:
```typescript
// Current: 9:00 AM daily
cron.schedule('0 9 * * *', async () => {

// Change to 8:00 AM: '0 8 * * *'
// Change to every 6 hours: '0 */6 * * *'
// Change to 3:00 PM: '0 15 * * *'
```

### Change batch size

In `src/services/emailReminderService.ts` line ~180:
```typescript
limit: 100, // Increase to send more in one run
```

## Email Template

The email includes:
- **Greeting** with user's name
- **3 favorite movies/shows** from their list
- **2 trending items** recently added
- **CTA button** to return to app
- **Unsubscribe** option in footer

Customize template in `src/services/emailReminderService.ts` `generateEmailTemplate()` method.

## Database Queries

### Check who received reminders today
```sql
SELECT email, last_notification_sent_at 
FROM users 
WHERE DATE(last_notification_sent_at) = CURDATE()
ORDER BY last_notification_sent_at DESC;
```

### Check inactive users (3+ days)
```sql
SELECT email, last_visited_at, reminder_email_enabled
FROM users 
WHERE last_visited_at < DATE_SUB(NOW(), INTERVAL 3 DAY)
  AND reminder_email_enabled = true
ORDER BY last_visited_at ASC;
```

### Check reminders disabled
```sql
SELECT COUNT(*) as disabled_count 
FROM users 
WHERE reminder_email_enabled = false;
```

## Monitoring

### Backend logs to watch for:
```
✅ "Running email reminder cron job..." - Job started
✅ "Found X inactive users for reminder emails" - Users identified
✅ "Reminder email sent to X@email.com" - Email sent
✅ "Successfully sent X/Y reminder emails" - Job completed
❌ "Error running email reminder cron job" - Problem detected
```

### Test with direct SQL:
```sql
-- Update a test user to be "inactive"
UPDATE users SET last_visited_at = DATE_SUB(NOW(), INTERVAL 5 DAY) 
WHERE email = 'test@example.com';

-- Check if they'll receive reminder
SELECT email, last_visited_at, reminder_email_enabled, last_notification_sent_at
FROM users 
WHERE email = 'test@example.com';
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Reminders not sending | Check cron logs, verify email credentials in .env |
| No test email received | Check spam folder, verify email enabled in settings |
| Duplicate emails | Feature prevents with 2-day cooldown, check DB |
| Wrong favorites shown | Ensure UserListItem data is populated |
| Email formatting broken | Check email client supports HTML, test in browser first |

## Next Steps

1. **Add to Profile page** - Import ReminderEmailSettings component
2. **Test thoroughly** - Use send test email feature
3. **Monitor cron job** - Check backend logs at 9 AM daily
4. **Gather feedback** - Users should be notified about feature
5. **Adjust timing** - Change inactivity threshold or email time as needed
6. **Track analytics** - Log email opens/clicks (future feature)

## Support & Documentation

- Full documentation: `EMAIL_REMINDER_FEATURE.md`
- API reference: See inline comments in `src/routes/reminderRoutes.ts`
- Service logic: See inline comments in `src/services/emailReminderService.ts`

---

**Status**: ✅ Ready for deployment!

All components are integrated and the feature will automatically start working once the server is running.
