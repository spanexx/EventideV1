# Notifications Page

## Overview
The Notifications page provides users with a centralized view of all alerts, updates, and communications related to their bookings, account activity, and platform updates in the EventideV1 application.

## Internal Routes
- `/dashboard/overview` - Return to dashboard overview
- `/dashboard/settings` - Notification preferences
- `/dashboard/bookings` - View booking-related notifications
- `/booking-lookup` - Find bookings mentioned in notifications

## Key Features
- Comprehensive notification history
- Categorization by type (bookings, account, system)
- Unread/read status indicators
- Filtering options for different notification types
- Mark as read/unread functionality
- Settings to manage notification preferences
- Integration with real-time updates
- Archive functionality for old notifications

## How-to Guides
1. To view notifications:
   - Navigate to the Notifications page from the dashboard
   - View all notifications in chronological order
   - Unread notifications are highlighted

2. To mark notifications as read:
   - Click the checkbox next to individual notifications
   - Or use "Mark All as Read" to clear all unread notifications
   - Read notifications change appearance to indicate their status

3. To filter notifications:
   - Use the filter options to show only specific types
   - Select "Bookings," "Account," "System," or "All"
   - Use date range filters to narrow down the history

4. To manage notification settings:
   - Go to the Settings page
   - Select notification preferences
   - Choose which types of notifications to receive
   - Select delivery methods (email, push, SMS)

## Troubleshooting
- If notifications don't appear, check your notification settings
- If you're receiving too many notifications, adjust your preferences
- For delivery issues, verify your contact information in settings
- If the notification count doesn't match what's displayed, refresh the page

## Technical Details
- Real-time updates via WebSocket connections
- Notification storage and retrieval from database
- Integration with user preferences system
- Email and push notification delivery systems
- Performance optimization for large notification volumes

## FAQ
Q: How long are notifications stored?
A: Notifications are stored for 90 days. Important account notifications may be retained longer.

Q: Can I opt out of specific notifications?
A: Yes, you can customize which types of notifications you receive in your account settings.