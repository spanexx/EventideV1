# WebSocket Implementation Guide

## Overview
This document explains how to use WebSockets in the Eventide application for real-time communication between the frontend and backend.

## Backend Implementation

The backend uses NestJS WebSocketGateway with Socket.IO as the underlying library. The implementation includes:

1. **WebsocketsModule**: Core module that provides WebSocket functionality
2. **WebsocketsGateway**: Main gateway that handles connections and messages
3. **WebsocketsService**: Service that allows other modules to emit events

### Key Features

- Real-time updates for availability changes
- Room-based organization for efficient message routing
- Connection lifecycle management (connect, disconnect)
- Event broadcasting to clients

### Usage in Modules

To use WebSockets in a module:

1. Import the `WebsocketsModule` in your feature module
2. Inject the `WebsocketsService` into your service
3. Call `emitToRoom()` or `emitToAll()` to send events

Example:
```typescript
// In your service
constructor(
  private readonly websocketsService: WebsocketsService
) {}

// Emit an event to a specific room
this.websocketsService.emitToRoom(
  `provider-${providerId}`,
  'availabilityUpdated',
  data
);
```

## Frontend Implementation

The frontend uses the `socket.io-client` library to connect to the WebSocket server.

### Key Components

1. **WebsocketService**: Angular service that manages the WebSocket connection
2. **AvailabilityComponent**: Example component that uses the WebSocket service

### Usage

To use WebSockets in a component:

1. Inject the `WebsocketService`
2. Call `joinProviderRoom()` to receive updates for a specific provider
3. Listen for events in the service

Example:
```typescript
// In your component
constructor(private websocketService: WebsocketService) {}

joinRoom(): void {
  this.websocketService.joinProviderRoom(this.providerId);
}
```

## Events

### Backend to Frontend

- `availabilityUpdated`: Sent when an availability slot is created, updated, or deleted
- `joinedRoom`: Confirmation that a client has joined a room
- `leftRoom`: Confirmation that a client has left a room

### Frontend to Backend

- `joinRoom`: Request to join a specific room
- `leaveRoom`: Request to leave a specific room

## Rooms

Clients are organized into logical rooms based on provider IDs:
- `provider-{id}`: Room for a specific provider's updates

## Security

- WebSocket connections should be authenticated using JWT tokens
- Clients can only join rooms they are authorized to access
- CORS is configured to allow connections from the frontend origin

## Testing

To test the WebSocket implementation:

1. Start the backend server: `npm run start:dev`
2. Start the frontend: `ng serve`
3. Open the browser console to see WebSocket logs
4. Use the availability component to join/leave rooms
5. Make changes to availability data through the REST API
6. Observe real-time updates in the browser console