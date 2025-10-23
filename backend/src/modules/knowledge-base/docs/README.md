# Knowledge Base Documentation

This directory contains knowledge documents for the EventideV1 AI assistant. Each document provides contextual information about specific pages in the application to help users when they interact with the AI assistant.

## Directory Structure

```
backend/src/modules/knowledge-base/docs/
├── auth/
│   ├── login.md
│   ├── signup.md
│   ├── forgot-password.md
│   ├── reset-password.md
│   ├── verify-email.md
│   └── google-callback.md
├── dashboard/
│   ├── overview.md
│   ├── availability.md
│   ├── bookings.md
│   ├── analytics-dashboard.md
│   ├── analytics-reports.md
│   └── settings.md
├── booking/
│   ├── booking-wizard.md
│   ├── duration-selection.md
│   ├── availability-slots.md
│   ├── guest-information.md
│   └── booking-confirmation.md
├── providers/
│   ├── provider-search.md
│   └── provider-profile.md
├── core/
│   ├── home.md
│   ├── notifications.md
│   ├── booking-lookup.md
│   └── booking-cancellation.md
└── templates/
    └── knowledge-template.md
```

## Document Template

All documents should follow the structure outlined in `templates/knowledge-template.md`.

## Document Structure

Each document follows this standard structure:

1. **Overview** - Brief description of what the page is for and its main purpose in the application
2. **Key Features** - List of main features/functionality available on this page, important UI elements and components, user interactions possible on this page
3. **How-to Guides** - Step-by-step instructions for common tasks users might want to perform on this page
4. **Troubleshooting** - Common issues users might encounter on this page and how to resolve them
5. **Technical Details** - Backend API endpoints, data flows, and technical components related to this page
6. **FAQ** - Frequently asked questions related to this page