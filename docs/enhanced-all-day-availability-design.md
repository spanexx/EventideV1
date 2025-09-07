# Enhanced All-Day Availability Slot Management - Design Document

## Overview
This document outlines the design for enhancing the all-day availability slot functionality to allow providers to specify the number of sub-slots when creating all-day availability and automatically calculate time distribution.

## Current Implementation Analysis

### Frontend
1. **Availability Dialog Component**:
   - Handles creation of availability slots
   - Receives `allDay: true` when all-day slots are created
   - Currently treats all-day as a single 1440-minute slot
   - UI shows "Create All-Day Availability" title when `data.allDay` is true
   - Hides time/duration fields when `data.allDay` is true

2. **Calendar Component**:
   - Passes `allDay: true` when all-day selection is made
   - Uses FullCalendar's select callback with `allDay` property

### Backend
1. **Availability Schema**:
   - No special handling for all-day slots
   - Stores as regular slots with startTime and endTime
   - Duration field stores minutes but no subdivision information

2. **Conflict Detection**:
   - Checks for overlapping time ranges
   - No special handling for all-day slots

## Problem Statement
When a provider creates all-day availability slots, the system currently:
1. Treats it as a single 1440-minute slot
2. Doesn't allow providers to specify how many sub-slots they want
3. Provides no intelligent distribution of time across sub-slots
4. Makes it difficult to manage all-day availability effectively

## Proposed Solution

### Frontend Enhancements

#### 1. Enhanced Availability Dialog UI
- **New "All-Day Slot Configuration" Section** (visible only when `data.allDay` is true):
  - Input field for "Number of Slots" (numeric input, min: 1, max: 24, default: 1)
  - Toggle for "Auto-Distribute Time Evenly" (checked by default)
  - Preview of slot distribution (shows how time will be divided)
  - Warning when number of slots exceeds recommended limits

#### 2. Logic Enhancements
- When "Auto-Distribute Time Evenly" is enabled:
  - Calculate equal time intervals based on 24-hour day (1440 minutes)
  - Distribute slots evenly throughout the day (8 AM to 8 PM by default)
  - Account for breaks between slots (configurable, default: 15 minutes)
- When disabled:
  - Allow manual configuration of each slot's start time and duration
  - Provide time picker for each slot

#### 3. Data Structure Changes
- Add new properties to availability data:
  ```typescript
  interface AllDayAvailabilityConfig {
    isAllDay: boolean;
    numberOfSlots: number;
    autoDistribute: boolean;
    slots?: AllDaySlot[];
  }
  
  interface AllDaySlot {
    startTime: Date;
    endTime: Date;
    duration: number;
  }
  ```

### Backend Enhancements

#### 1. API Changes
- **New Endpoint**: `POST /availability/all-day` for creating all-day slots
- **Modified DTO**: Extend `CreateAvailabilityDto` with all-day configuration:
  ```typescript
  interface CreateAllDayAvailabilityDto extends CreateAvailabilityDto {
    numberOfSlots: number;
    autoDistribute: boolean;
    slots?: AllDaySlot[];
  }
  ```

#### 2. Service Logic
- **Auto-Distribution Algorithm**:
  - Calculate working hours (default: 8 AM to 8 PM = 720 minutes)
  - Divide by number of slots + (number of slots - 1) breaks
  - Distribute slots evenly with breaks between them
  - Example: 4 slots → 4 * slot_time + 3 * break_time = 720 minutes

#### 3. Database Schema
- Add new field to availability schema:
  ```typescript
  @Prop({ type: Object, required: false })
  @IsOptional()
  allDayConfig?: {
    numberOfSlots: number;
    autoDistribute: boolean;
    slots: Array<{
      startTime: Date;
      endTime: Date;
      duration: number;
    }>;
  };
  ```

## Implementation Plan

### Phase 1: Frontend UI/UX Design
1. Create wireframes for enhanced all-day slot dialog
2. Implement new UI components in availability dialog
3. Add validation for slot count inputs
4. Implement preview functionality

### Phase 2: Frontend Logic Implementation
1. Implement auto-distribution algorithm
2. Add manual slot configuration option
3. Integrate with existing availability creation flow
4. Add validation and error handling

### Phase 3: Backend API Development
1. Create new all-day availability endpoint
2. Implement auto-distribution logic in service layer
3. Add conflict detection for distributed slots
4. Update database schema

### Phase 4: Integration & Testing
1. Connect frontend to new backend endpoints
2. Test all-day slot creation with various configurations
3. Validate conflict detection
4. Performance testing with large numbers of slots

## Technical Considerations

### 1. API Design
- Maintain backward compatibility with existing endpoints
- New endpoints for all-day specific functionality
- Clear distinction between regular and all-day slots in responses

### 2. Database Design
- Efficient querying of all-day slots
- Indexing for performance
- Storage optimization for slot arrays

### 3. Conflict Detection
- Enhanced logic to detect conflicts within distributed slots
- Cross-check with regular slots
- Performance considerations for complex overlap detection

### 4. UX Considerations
- Clear visualization of slot distribution
- Helpful error messages for invalid configurations
- Responsive design for different screen sizes
- Accessibility compliance

## Success Criteria

1. **Functional Requirements**:
   - Providers can specify number of sub-slots for all-day availability
   - System automatically calculates and distributes time evenly
   - Manual configuration option available
   - Preview of slot distribution shown before saving

2. **Performance Requirements**:
   - All-day slot creation completes within 2 seconds
   - Conflict detection performs adequately with 50+ slots
   - Database queries optimized for all-day slot retrieval

3. **Quality Requirements**:
   - All existing functionality remains unaffected
   - Comprehensive error handling for edge cases
   - Clear user feedback for invalid inputs
   - Proper validation of all inputs

4. **Compatibility Requirements**:
   - Backward compatibility with existing API
   - No breaking changes to current availability functionality
   - Smooth migration path for existing all-day slots

## Edge Cases & Error Handling

1. **Invalid Slot Count**:
   - Too many slots (e.g., > 24)
   - Zero or negative slots
   - Non-numeric input

2. **Time Distribution Issues**:
   - Insufficient time for specified number of slots
   - Overlapping manual slot configurations
   - Working hours too short for requested slots

3. **System Limits**:
   - Database storage limits
   - API payload size limits
   - Performance degradation with large slot counts

## Future Enhancements

1. **Advanced Distribution Options**:
   - Morning/afternoon preference
   - Custom working hours
   - Different duration slots within same all-day period

2. **Template System**:
   - Save common all-day configurations as templates
   - Apply templates to future dates
   - Share templates between providers

3. **Analytics & Reporting**:
   - Track all-day slot utilization
   - Identify optimal slot configurations
   - Provider behavior insights