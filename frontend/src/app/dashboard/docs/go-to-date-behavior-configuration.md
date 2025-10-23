# Go to Date Behavior Configuration

## Overview

The "Go to Date" functionality has been implemented with configurable behavior options to provide flexibility for different user preferences. This document outlines the current implementation and the planned settings integration.

## Current Implementation (Default Behavior)

**Current Behavior: `temporary-day`**
- ✅ Opens date picker dialog when go to date icon is clicked
- ✅ User enters date and clicks "Go to Date"  
- ✅ Calendar temporarily switches to Day view
- ✅ Navigates to the selected date
- ✅ **Does NOT** change the `defaultView` in localStorage
- ✅ User's preferred view setting remains intact

## Planned Behavior Options for Settings

### 1. **`temporary-day`** (Current Default)
- **Description**: Navigate to date in Day view temporarily
- **Behavior**: 
  - Switch to Day view
  - Navigate to selected date
  - Does NOT save view preference
- **Use Case**: Users who want to quickly check a specific date without changing their preferred view

### 2. **`temporary-preferred`** 
- **Description**: Navigate to date using user's preferred view temporarily
- **Behavior**:
  - Switch to user's current preferred view (from localStorage)
  - Navigate to selected date
  - Does NOT save view preference
- **Use Case**: Users who want consistency with their preferred view setting

### 3. **`change-to-day`**
- **Description**: Navigate to date in Day view and save as preference
- **Behavior**:
  - Switch to Day view
  - Navigate to selected date
  - Updates `defaultView` in localStorage to 'timeGridDay'
- **Use Case**: Users who prefer Day view for navigation and want it saved

### 4. **`change-to-preferred`**
- **Description**: Navigate to date and remember the view change
- **Behavior**:
  - Switch to user's preferred view
  - Navigate to selected date
  - May update view preference based on rememberLastView setting
- **Use Case**: Advanced users who want full preference integration

## Technical Implementation

### Data Structure
```typescript
export interface CalendarPreferences {
  defaultView: CalendarView;
  autoSwitchView: boolean;
  rememberLastView: boolean;
  smartRecommendations: boolean;
  goToDateBehavior: 'temporary-day' | 'temporary-preferred' | 'change-to-day' | 'change-to-preferred';
}
```

### Service Integration
```typescript
export interface GoToDateRequest {
  date: Date;
  temporaryView: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth';
  behavior: 'temporary-day' | 'temporary-preferred' | 'change-to-day' | 'change-to-preferred';
}
```

## Settings UI Integration Points

### Future Settings Panel Options
```typescript
// Calendar Settings Section
{
  label: "Go to Date Behavior",
  type: "select",
  options: [
    { value: 'temporary-day', label: 'Temporary Day View (Default)' },
    { value: 'temporary-preferred', label: 'Temporary Preferred View' },
    { value: 'change-to-day', label: 'Switch to Day View (Save Preference)' },
    { value: 'change-to-preferred', label: 'Use Preferred View (Full Integration)' }
  ],
  description: "Choose how the calendar behaves when using 'Go to Date'"
}
```

## Benefits for Settings Implementation

1. **User Choice**: Different users have different navigation preferences
2. **Workflow Optimization**: Power users can choose more integrated behavior
3. **Backwards Compatibility**: Default behavior maintains current user experience
4. **Gradual Migration**: Users can opt into more advanced behaviors

## Migration Strategy

### Phase 1: Current Implementation ✅
- Default `temporary-day` behavior
- No settings UI yet
- Foundation for future expansion

### Phase 2: Settings Integration (Future)
- Add settings UI controls
- Load user preference from storage
- Update handleGoToDate() to use user preference

### Phase 3: Advanced Features (Future)
- Context-aware behavior (different settings for different views)
- Keyboard shortcut customization
- Integration with smart calendar recommendations

## Code Examples

### Current Usage
```typescript
// Default behavior - always temporary day view
this.dialogCoordinatorService.openDatePicker();
```

### Future Settings-Aware Usage
```typescript
// Will automatically use user's preferred go to date behavior
const userBehavior = this.calendarPreferencesService.getGoToDateBehavior();
this.dialogCoordinatorService.openDatePicker(userBehavior);
```

This architecture provides a solid foundation for user customization while maintaining the current working behavior as the sensible default.