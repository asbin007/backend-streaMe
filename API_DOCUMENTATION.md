# Email Reminder API Documentation

## Base URL
```
http://localhost:5000/api/reminders
```

## Authentication
Most endpoints require Bearer token authentication:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Endpoints

### 1. Track User Visit

**Endpoint:** `POST /track-visit`

**Purpose:** Update user's last visit timestamp. Called automatically when user navigates the app.

**Authentication:** Required

**Request Body:**
```json
{
  "userId": "user-uuid-here"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Visit tracked"
}
```

**Response (Error):**
```json
{
  "error": "User ID required" // 400
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/reminders/track-visit \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"userId": "550e8400-e29b-41d4-a716-446655440000"}'
```

**Notes:**
- Called automatically by `useTrackVisit` hook
- Updates `lastVisitedAt` field in database
- Non-critical - errors are silently ignored
- Delay between calls is minimal (no rate limiting)

---

### 2. Get Reminder Preferences

**Endpoint:** `GET /reminder-preferences`

**Purpose:** Fetch user's reminder email settings and activity history.

**Authentication:** Required (current user)

**Request Body:** None

**Response (Success - 200):**
```json
{
  "reminderEmailEnabled": true,
  "lastNotificationSentAt": "2024-01-15T09:30:00.000Z",
  "lastVisitedAt": "2024-01-15T14:20:15.000Z"
}
```

**Response (Error):**
```json
{
  "error": "Not authenticated" // 401
}
```

or

```json
{
  "error": "User not found" // 404
}
```

**Example:**
```bash
curl -X GET http://localhost:5000/api/reminders/reminder-preferences \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response Fields:**
- `reminderEmailEnabled` (boolean) - Whether user receives reminder emails
- `lastNotificationSentAt` (ISO 8601) - When last reminder was sent
- `lastVisitedAt` (ISO 8601) - When user last accessed the app

---

### 3. Update Reminder Preferences

**Endpoint:** `PUT /reminder-preferences`

**Purpose:** Enable or disable reminder emails for the current user.

**Authentication:** Required (current user)

**Request Body:**
```json
{
  "reminderEmailEnabled": false
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Reminder emails disabled",
  "reminderEmailEnabled": false
}
```

**Response (Error):**
```json
{
  "error": "reminderEmailEnabled must be a boolean" // 400
}
```

or

```json
{
  "error": "Not authenticated" // 401
}
```

**Example - Enable:**
```bash
curl -X PUT http://localhost:5000/api/reminders/reminder-preferences \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"reminderEmailEnabled": true}'
```

**Example - Disable:**
```bash
curl -X PUT http://localhost:5000/api/reminders/reminder-preferences \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"reminderEmailEnabled": false}'
```

**Notes:**
- Users can change this setting anytime
- Default value is `true` for new users
- Change takes effect immediately

---

### 4. Send Test Reminder Email

**Endpoint:** `POST /send-test-reminder`

**Purpose:** Send a test reminder email to the current user. Useful for previewing the email format.

**Authentication:** Required (current user)

**Request Body:** None

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Test reminder email sent successfully",
  "email": "user@example.com"
}
```

**Response (Error - No Email):**
```json
{
  "error": "User does not have an email address" // 400
}
```

**Response (Error - Send Failed):**
```json
{
  "success": false,
  "error": "Failed to send test reminder email" // 500
}
```

**Response (Error - Auth):**
```json
{
  "error": "Not authenticated" // 401
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/reminders/send-test-reminder \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

**Notes:**
- Sends immediately (doesn't wait for cron job)
- Uses user's actual email from database
- Includes user's real favorites and trending content
- Useful for:
  - Testing email delivery
  - Previewing template
  - Verifying email address works
- No rate limiting on this endpoint (use sparingly)

---

### 5. Trigger Reminders (Admin Only)

**Endpoint:** `POST /trigger-reminders`

**Purpose:** Manually send reminder emails to all inactive users. Admin endpoint for testing and emergencies.

**Authentication:** Required (admin/super_admin role)

**Request Body (Optional):**
```json
{
  "inactivityDays": 3
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Reminder emails sent to 42 users",
  "sentCount": 42,
  "inactivityDays": 3
}
```

**Response (Error - Not Admin):**
```json
{
  "error": "Admin access required" // 403
}
```

**Response (Error - Server Issue):**
```json
{
  "error": "Failed to trigger reminders" // 500
}
```

**Example - Default (3 days):**
```bash
curl -X POST http://localhost:5000/api/reminders/trigger-reminders \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Example - Custom (5 days):**
```bash
curl -X POST http://localhost:5000/api/reminders/trigger-reminders \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inactivityDays": 5}'
```

**Parameters:**
- `inactivityDays` (optional, default: 3) - How many days inactive to target

**Notes:**
- Admin/super_admin role required
- Processes up to 100 users per call
- Applies same duplicate prevention (no reminder in last 2 days)
- Useful for:
  - Testing email delivery
  - Forcing reminders for specific groups
  - Emergency user re-engagement
  - Manual adjustment of cron schedule

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Email sent, settings updated |
| 400 | Bad Request | Missing required field |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions (admin) |
| 404 | Not Found | User not found |
| 500 | Server Error | Database connection failed |

### Error Response Format

All errors return JSON:
```json
{
  "error": "Description of what went wrong"
}
```

---

## Authentication

### Getting JWT Token

Tokens are provided by the auth endpoints (not part of reminders API):
```bash
POST /api/auth/login
POST /api/auth/register
```

Response includes token:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

### Using Token

Add to all requests:
```bash
curl -X GET http://localhost:5000/api/reminders/reminder-preferences \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Token Expiration

Check your auth service for token expiration time. Typically:
- Access token: 24 hours
- Refresh token: 7 days

---

## Rate Limiting & Throttling

### User Endpoints

- `track-visit` - No limit (called frequently)
- `reminder-preferences` - No limit
- `send-test-reminder` - No limit (but use sparingly)

### Admin Endpoints

- `trigger-reminders` - Recommend: max once per day

### Automatic System

- Email sending: 500ms delay between emails (prevent server overload)
- Reminder frequency: Max 1 per user per 2 days
- Cron job: Runs daily at 9 AM (configurable)

---

## Data Models

### Reminder Preferences Response

```typescript
interface ReminderPreferences {
  reminderEmailEnabled: boolean;      // User has enabled reminders
  lastNotificationSentAt: string | null;  // ISO 8601 timestamp
  lastVisitedAt: string | null;       // ISO 8601 timestamp
}
```

### Trigger Response

```typescript
interface TriggerResponse {
  success: boolean;
  message: string;
  sentCount: number;
  inactivityDays: number;
}
```

---

## Integration Examples

### React Hook

```tsx
import { useEffect, useState } from 'react';
import api from '../services/api';

function ReminderSettings() {
  const [prefs, setPrefs] = useState(null);
  
  useEffect(() => {
    api.get('/reminders/reminder-preferences')
      .then(res => setPrefs(res.data))
      .catch(err => console.error(err));
  }, []);
  
  const toggleReminders = async (enabled) => {
    const res = await api.put('/reminders/reminder-preferences', {
      reminderEmailEnabled: enabled
    });
    setPrefs(res.data);
  };
  
  return (
    <div>
      <input 
        type="checkbox" 
        checked={prefs?.reminderEmailEnabled}
        onChange={e => toggleReminders(e.target.checked)}
      />
      <button onClick={() => 
        api.post('/reminders/send-test-reminder')
          .then(() => alert('Email sent!'))
      }>
        Send Test Email
      </button>
    </div>
  );
}
```

### Backend Service

```typescript
import axios from 'axios';

async function getReminderPrefs(token: string) {
  const response = await axios.get(
    'http://localhost:5000/api/reminders/reminder-preferences',
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}

async function triggerReminders(adminToken: string, days: number = 3) {
  const response = await axios.post(
    'http://localhost:5000/api/reminders/trigger-reminders',
    { inactivityDays: days },
    {
      headers: { Authorization: `Bearer ${adminToken}` }
    }
  );
  return response.data;
}
```

---

## Troubleshooting

### "Not authenticated" Error
```
Solution: Ensure Authorization header is set with valid JWT token
curl -H "Authorization: Bearer YOUR_TOKEN"
```

### "Admin access required" Error
```
Solution: Use admin/super_admin account token for /trigger-reminders
Check user role in database: SELECT role FROM users WHERE id = ?
```

### Email not received
```
Possible causes:
1. Check if reminders are enabled: GET /reminder-preferences
2. Send test email: POST /send-test-reminder
3. Check spam folder
4. Verify email address in user record
5. Check backend logs for errors
```

### "Failed to send test reminder email"
```
Solutions:
1. Ensure user has email in database
2. Verify Gmail credentials in .env
3. Check backend logs: npm run dev
4. Ensure application password is used (not Google account password)
```

---

## Best Practices

### For Frontend Developers

1. **Call track-visit on page load**
   ```tsx
   useEffect(() => {
     api.post('/reminders/track-visit', { userId: user.id });
   }, []);
   ```

2. **Cache preferences** - Don't call GET every render
   ```tsx
   const [prefs, setPrefs] = useState(null);
   useEffect(() => {
     api.get('/reminders/reminder-preferences')
       .then(res => setPrefs(res.data));
   }, []);
   ```

3. **Handle errors gracefully**
   ```tsx
   api.put('/reminders/reminder-preferences', { ... })
     .catch(err => {
       console.error('Failed to update preferences');
       // Don't break UI, just show error message
     });
   ```

### For Admin Tasks

1. **Test emails before major campaign**
   ```bash
   POST /trigger-reminders with inactivityDays: 1
   # Sends to users inactive 1+ day for testing
   ```

2. **Monitor email delivery**
   ```sql
   SELECT COUNT(*) FROM users 
   WHERE last_notification_sent_at >= DATE_SUB(NOW(), INTERVAL 1 DAY);
   ```

3. **Check opt-out rates**
   ```sql
   SELECT 
     SUM(CASE WHEN reminder_email_enabled THEN 1 ELSE 0 END) as enabled,
     SUM(CASE WHEN NOT reminder_email_enabled THEN 1 ELSE 0 END) as disabled
   FROM users;
   ```

---

## Changelog

### Version 1.0 (Current)
- ✅ Basic reminder email functionality
- ✅ User activity tracking
- ✅ Preference management
- ✅ Test email endpoint
- ✅ Admin manual trigger
- ✅ Daily cron job scheduling

### Future Versions
- 📋 Email open/click tracking
- 📋 Multiple reminder templates
- 📋 A/B testing support
- 📋 SMS reminders
- 📋 Schedule customization per user

---

## Support

For issues or questions:
1. Check inline code comments in `src/routes/reminderRoutes.ts`
2. Review `EMAIL_REMINDER_FEATURE.md` for architecture
3. Check backend logs: `npm run dev`
4. Query database directly for debugging
