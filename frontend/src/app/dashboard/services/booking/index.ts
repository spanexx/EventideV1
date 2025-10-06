/**
 * Booking Services Module
 * 
 * Modular booking service architecture:
 * - BookingApiService: HTTP API calls
 * - BookingStateService: State management
 * - BookingOperationsService: Business logic
 * - BookingFacadeService: Simplified API for components
 * - BookingSocketService: WebSocket real-time updates
 */

export * from './booking-api.service';
export * from './booking-state.service';
export * from './booking-operations.service';
export * from './booking-facade.service';
export * from './booking-socket.service';
