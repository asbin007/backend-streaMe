# Email Reminder Feature Documentation

## Overview

The Email Reminder feature automatically sends personalized reminder emails to inactive users (users who haven't visited the app in 3+ days). Each reminder email includes:

- Personalized greeting
- User's favorite movies/shows
- Recently added trending content
- Call-to-action button to return to the app
- Beautiful HTML email template

## Architecture

### Backend Components

#### 1. **User Model Updates** (`src/models/User.ts`)
New fields added:
- `lastVisitedAt` - Tracks when user last accessed the app
- `lastNotificationSentAt` - Tracks when last reminder email was sent
- `reminderEmailEnabled` - Boolean flag to enable/disable reminders per user

#### 2. **Email Reminder Service** (`src/services/emailReminderService.ts`)

**Key Methods:**

- `getUserFavorites(userId, limit)` - Fetches user's favorite movies/shows
- `getUpcomingContent(limit)` - Gets recently added trending content
- `generateEmailTemplate(userName, favorites, upcoming)` - Creates HTML email
- `sendReminderEmail(user)` - Sends reminder to single user
- `sendBatchReminders(inactivityDays)` - Processes all inactive users
- `updateLastVisit(userId)` - Updates user's last visit timestamp

**Features:**
- Personalized with favorite content
- Beautiful responsive HTML template
- Rate limiting to prevent spam (500ms delay between emails)
- Batch processing with configurable inactivity threshold
- Tracks notification timestamps to prevent duplicate sends

#### 3. **Cron Jobs** (`src/services/cronJobs.ts`)

New scheduled job:
```
Time: 9:00 AM daily (0 9 * * *)
Task: Send reminder emails to users inactive for 3+ days
Conditions:
  - Reminders enabled
  - Haven't visited in 3+ days
  - No reminder sent in last 2 days
Batch size: 100 users per run
```

#### 4. **API Routes** (`src/routes/reminderRoutes.ts`)

**Endpoints:**

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/reminders/track-visit` | Update user's last visit | User |
| GET | `/api/reminders/reminder-preferences` | Get user preferences | User |
| PUT | `/api/reminders/reminder-preferences` | Update preferences | User |
| POST | `/api/reminders/send-test-reminder` | Send test email | User |
| POST | `/api/reminders/trigger-reminders` | Manually trigger reminders | Admin |

### Frontend Components

#### 1. **useTrackVisit Hook** (`src/hooks/useTrackVisit.ts`)
- Calls backend API when user logs in
- Updates `lastVisitedAt` timestamp
- Runs silently (doesn't affect UX)

#### 2. **ReminderEmailSettings Component** (`src/components/ReminderEmailSettings.tsx`)
- Toggle reminders on/off
- Display last visited timestamp
- Display last reminder sent timestamp
- Send test email button
- Info box explaining the feature

### Integration

#### App Component (`src/App.tsx`)
- Added `MainContent` wrapper component
- Uses `useTrackVisit` hook to track user activity on every page navigation

#### Server (`src/server.ts`)
- Registered reminder routes at `/api/reminders`
- Cron jobs start automatically on server boot

## How It Works

### User Flow

1. **User logs in** → `useTrackVisit` hook sends POST to `/api/reminders/track-visit`
2. **Backend updates** → `lastVisitedAt` = current timestamp
3. **User navigates** → Activity tracking continues automatically (in background)
4. **After 3 days of inactivity** → Daily cron job checks for inactive users
5. **Email sent** → Service fetches favorites and trending content
6. **Personalized email** → User receives reminder with their content
7. **User returns** → Another visit tracked, cycle resets

### Configuration

**Inactivity Threshold:**
```typescript
// In cronJobs.ts line ~60
const sentCount = await EmailReminderService.sendBatchReminders(3); // Days
```
Change `3` to desired number of days

**Cron Schedule:**
```
0 9 * * * = 9:00 AM daily
Format: minute hour day month dayOfWeek
```

**Batch Size:**
```typescript
// In emailReminderService.ts line ~180
limit: 100, // Users per batch
```

## Database Queries

### Check inactive users:
```sql
SELECT * FROM users 
WHERE reminder_email_enabled = true 
  AND email IS NOT NULL 
  AND (last_visited_at < NOW() - INTERVAL 3 DAY 
       OR last_visited_at IS NULL)
  AND (last_notification_sent_at IS NULL 
       OR last_notification_sent_at < NOW() - INTERVAL 2 DAY)
LIMIT 100;
```

### Check user preferences:
```sql
SELECT 
  reminder_email_enabled, 
  last_notification_sent_at, 
  last_visited_at 
FROM users 
WHERE id = ?;
```

## Email Template Features

- **Responsive design** - Works on mobile, tablet, desktop
- **Brand colors** - Netflix-style red (#e50914) accent
- **Personalized** - Includes user's name and favorites
- **Dynamic content** - Shows actual favorite movies/shows
- **CTA button** - Direct link back to app
- **Footer** - Unsubscribe and preference management links

## Testing

### Send Test Email
```bash
curl -X POST http://localhost:5000/api/reminders/send-test-reminder \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Manually Trigger Reminders (Admin)
```bash
curl -X POST http://localhost:5000/api/reminders/trigger-reminders \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inactivityDays": 3}'
```

### Check User Preferences
```bash
curl -X GET http://localhost:5000/api/reminders/reminder-preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Environment Variables Required

```env
# Gmail credentials (already configured)
EMAIL=your-email@gmail.com
PASSWORD=your-app-password

# Frontend URLs (for email links)
BASE_URL=http://localhost:5173
CLIENT_URL=http://localhost:5173
```

## Monitoring

### Check cron job logs:
```bash
# In terminal where backend is running
# Look for: "Running email reminder cron job..."
```

### Database checks:
```sql
-- Last 10 reminders sent
SELECT id, email, last_notification_sent_at 
FROM users 
WHERE last_notification_sent_at IS NOT NULL 
ORDER BY last_notification_sent_at DESC 
LIMIT 10;

-- Users with reminders disabled
SELECT COUNT(*) FROM users WHERE reminder_email_enabled = false;

-- Average days since last visit
SELECT AVG(DATEDIFF(NOW(), last_visited_at)) 
FROM users 
WHERE last_visited_at IS NOT NULL;
```

## Troubleshooting

### Reminders not being sent

**Check 1:** Cron job running
```bash
# In backend logs, should see: "Running email reminder cron job..."
```

**Check 2:** Database fields populated
```sql
SELECT last_visited_at, reminder_email_enabled 
FROM users WHERE id = ?;
```

**Check 3:** Email credentials
```bash
# Check .env file has valid Gmail credentials
echo $EMAIL
echo $PASSWORD
```

### Email not received

**Check 1:** Email marked as spam
- Add `postmaster@yourdomain` to contacts

**Check 2:** User disabled reminders
```sql
SELECT reminder_email_enabled FROM users WHERE id = ?;
```

**Check 3:** Check last notification sent
```sql
SELECT last_notification_sent_at FROM users WHERE id = ?;
-- Should be recent (today)
```

## Performance Considerations

- **Batch processing** - 100 users per run to avoid overload
- **Rate limiting** - 500ms delay between emails
- **Frequency limit** - Max 1 reminder per user per 2 days
- **Async operations** - Non-blocking email sends
- **Indexing** - Database queries use indexed fields:
  - `reminder_email_enabled`
  - `last_visited_at`
  - `last_notification_sent_at`

## Future Enhancements

1. **A/B Testing** - Test different email templates
2. **Analytics** - Track open rates, click-through rates
3. **Segmentation** - Different reminders for different user segments
4. **Preference Center** - Let users choose email frequency
5. **Content Personalization** - Use ML to recommend better content
6. **Multi-language** - Localize emails based on user language
7. **SMS Reminders** - Add SMS as backup channel

## Security

- Email addresses validated
- User authentication required for preferences API
- Admin-only endpoint for manual triggers
- No sensitive data in emails
- Rate limiting prevents abuse
- Credentials stored in .env (never committed)

## Support

For issues or questions:
1. Check logs: `npm run dev` (backend console)
2. Check database: Query user records
3. Send test email: Use `/send-test-reminder` endpoint
4. Trigger manually: Use `/trigger-reminders` endpoint (admin)
