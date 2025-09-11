# Availability Component Refactoring Plan

## Overview
The AvailabilityComponent is a large, complex component that handles the availability calendar functionality. This refactoring will break it down into smaller, more focused components and services to improve maintainability and readability.

## Refactoring Approach
Using backup-based refactoring since this is a major change (over 50 lines).

## Components to Extract

### 1. Calendar Management Service
- Extract all calendar-related functionality into a separate service
- Handle FullCalendar API interactions
- Manage calendar state and updates

### 2. Event Handling Service
- Already partially exists but can be enhanced
- Handle all event-related operations (click, resize, drop)
- Manage event updates and interactions

### 3. Dialog Management Component
- Extract dialog-related functionality into a separate component
- Handle opening and managing all availability dialogs

### 4. Keyboard Shortcut Service
- Already exists but can be enhanced
- Handle all keyboard shortcut functionality

### 5. History Management Service
- Already exists but can be enhanced
- Handle undo/redo functionality

## File Structure After Refactoring

```
availability/
├── availability.component.ts          # Main component orchestrating functionality
├── availability.component.html        # Template
├── availability.component.scss        # Styles
├── calendar/
│   ├── calendar.service.ts            # Calendar management
│   ├── calendar-events.service.ts     # Event handling
│   └── calendar-utils.ts              # Calendar utilities
├── dialogs/
│   ├── availability-dialog.component.ts
│   ├── copy-week-dialog.component.ts
│   └── date-picker-dialog.component.ts
├── services/
│   ├── keyboard-shortcut.service.ts
│   └── history-management.service.ts
└── models/
    └── availability.models.ts
```

## Implementation Steps

### Phase 1: Create New Structure
1. Create the directory structure
2. Move existing services to appropriate locations
3. Create new calendar service

### Phase 2: Extract Calendar Functionality
1. Move calendar initialization to CalendarService
2. Move event handling to CalendarEventsService
3. Move calendar update logic to CalendarService

### Phase 3: Extract Dialog Functionality
1. Create separate dialog components
2. Move dialog handling logic to components

### Phase 4: Optimize Main Component
1. Simplify AvailabilityComponent to orchestrate services
2. Remove duplicated logic
3. Ensure proper dependency injection

## Benefits
- Improved maintainability
- Better separation of concerns
- Easier testing
- More readable code
- Reusable services