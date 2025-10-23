# Dashboard Overview Page

## Overview
The Dashboard Overview page serves as the central hub for users in the EventideV1 application. It provides a summary of key information, quick access to important features, and personalized recommendations based on user activity and preferences.

## Internal Routes
- `/dashboard/bookings` - View and manage bookings
- `/dashboard/availability` - Manage booking availability
- `/dashboard/settings` - Account settings and preferences
- `/dashboard/analytics/dashboard` - Analytics and reporting
- `/providers` - Search for service providers
- `/booking` - Create new bookings

## Key Features
- Personalized welcome message and user profile quick view
- Summary statistics and key metrics
- Upcoming appointments or bookings
- Recent activity feed
- Quick action buttons for common tasks
- Notifications and alerts panel
- Recent bookings summary
- Quick links to important sections

## How-to Guides
1. To navigate to different sections from the dashboard:
   - Use the sidebar navigation menu on the left
   - Click on icons or menu items to access different features
   - Dashboard widgets may have "View All" or "Learn More" links

2. To access your profile information:
   - Click on your profile picture/avatar in the top navigation bar
   - Access account settings, preferences, and logout options

3. To view upcoming bookings:
   - Check the "Upcoming Bookings" section on the dashboard
   - Click on any booking to see detailed information
   - Use "View All" to see your complete booking history

## Troubleshooting
- If dashboard statistics aren't loading, refresh the page
- If you don't see expected bookings, verify the date range and filters
- If widgets are not displaying correctly, try clearing your browser cache
- If issues persist, contact support

## Technical Details
- GET /dashboard/overview - Retrieves dashboard data and statistics
- Real-time updates via WebSocket connections
- Data aggregation from multiple service endpoints
- Responsive layout that adapts to screen size
- Caching strategies for improved performance

## FAQ
Q: Why don't I see any upcoming bookings on my dashboard?
A: If you haven't made any bookings yet, the upcoming bookings section will be empty. You can create a new booking by navigating to the booking section.

Q: How often is the dashboard data updated?
A: Dashboard statistics update in real-time when possible, with some data refreshing every few minutes. You can manually refresh by pulling down or pressing the refresh button if available.