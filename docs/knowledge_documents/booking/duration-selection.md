# Booking Page: Booking Wizard - Duration Selection

## Overview
The duration selection step allows clients to choose the length of their booking session.

## Key Features
- Time duration selection
- Service-specific duration options
- Real-time availability checking
- Duration-based pricing display

## How-to Guides
### Selecting a Duration
1. View available duration options for the selected service
2. Choose the desired duration from the dropdown/radio options
3. Review the price associated with the selected duration
4. Click "Continue" to proceed to availability selection

## Troubleshooting
- **No durations available**: The service may not have durations configured; contact the provider
- **Duration not saving**: Ensure you clicked the duration option before continuing
- **Pricing confusion**: Prices are shown for the selected duration only

## Technical Details
- API endpoint: `/booking/durations`
- Validates duration against service configuration
- Updates pricing based on selected duration
- Integrates with availability checking for the next step

## FAQ
Q: Can I select a custom duration?
A: Currently, only predefined durations set by the provider are available.

Q: Why are some durations not available?
A: Providers can limit which durations are available based on their service offerings.