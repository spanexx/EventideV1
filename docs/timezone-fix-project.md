# Timezone Handling Fix for Availability Slots

This project addresses the issue where one-off availability slots disappear from the UI after refresh while recurring slots display correctly. The root cause is a timezone handling mismatch between frontend and backend when filtering one-off slots by date.

## Project Overview

- **Problem**: One-off availability slots disappear after refresh
- **Root Cause**: Timezone handling mismatch between frontend and backend
- **Affected Components**: 
  - Backend: availability.service.ts (findByProviderAndDateRange method)
  - Frontend: availability.service.ts (getAvailability method)

## Goals

1. Fix timezone handling in backend date queries
2. Ensure consistent timezone handling in frontend API calls
3. Maintain backward compatibility
4. Ensure both one-off and recurring slots work correctly