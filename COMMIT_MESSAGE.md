feat: Enhance smart calendar with advanced analytics and filtering

This commit introduces several new features and improvements to the smart calendar functionality:

- **Conflict Detection:** The calendar now automatically detects and highlights conflicting appointments, providing visual cues to the user.
- **Optimal Booking Windows:** The system analyzes historical data to suggest optimal times for new bookings, helping to maximize calendar occupancy.
- **Search and Filtering:** Users can now search their calendar using natural language queries and apply various filters to narrow down the displayed appointments. This includes filtering by status (booked/available), date range, and duration.
- **UI/UX Enhancements:** The calendar interface has been updated to display the new analytics and provide a more intuitive user experience.

In addition to the new features, this commit also includes the following changes:

- **Refactored Logging:** The frontend logging service has been refactored to send logs directly to the backend, enabling centralized log management and analysis.
- **Backend Dependencies:** Added `axios` to the backend for making HTTP requests.
- **Configuration:** Updated `.gitignore` to exclude additional generated files and logs.