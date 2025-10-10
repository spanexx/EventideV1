import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KnowledgeBaseService } from '../knowledge-base.service';
import { KnowledgeDocumentCreateDto } from '../dtos/knowledge-document.dto';

@Injectable()
export class DocumentIngestionService implements OnModuleInit {
  private readonly logger = new Logger(DocumentIngestionService.name);

  constructor(
    private readonly knowledgeBaseService: KnowledgeBaseService,
  ) {}

  async onModuleInit() {
    // Initialize document ingestion on module startup
    await this.ingestDocumentation();
  }

  async ingestDocumentation() {
    this.logger.log('Starting documentation ingestion process');

    // Ingest API endpoints documentation
    await this.ingestApiEndpointsDocumentation();

    // Ingest booking system documentation
    await this.ingestBookingSystemDocumentation();

    // Ingest availability system documentation
    await this.ingestAvailabilitySystemDocumentation();

    // Ingest user roles and permissions documentation
    await this.ingestUserRolesDocumentation();

    // Ingest frontend interface documentation
    await this.ingestFrontendInterfaceDocumentation();

    // Ingest common user questions
    await this.ingestCommonUserQuestions();

    this.logger.log('Documentation ingestion completed');
  }

  private async ingestApiEndpointsDocumentation() {
    this.logger.log('Ingesting API endpoints documentation');

    const apiDocs: KnowledgeDocumentCreateDto[] = [
      {
        title: 'Authentication API Endpoints',
        content: `
The EventideV1 application provides several authentication endpoints:

POST /auth/login - Authenticate user with email and password
POST /auth/register - Register a new user account
POST /auth/refresh - Refresh authentication tokens
GET /auth/profile - Get current user profile
POST /auth/logout - Log out current user
GET /auth/verify - Verify authentication token
        `,
        category: 'api',
        tags: ['auth', 'authentication', 'login', 'register'],
      },
      {
        title: 'Booking API Endpoints',
        content: `
The booking system provides the following endpoints:

POST /booking/create - Create a new booking
GET /booking/:id - Get booking details by ID
PUT /booking/:id - Update booking details
DELETE /booking/:id - Cancel a booking
GET /booking/user/:userId - Get bookings for a user
GET /booking/provider/:providerId - Get bookings for a service provider
GET /booking/available-times - Get available booking times
POST /booking/confirm/:id - Confirm a booking
        `,
        category: 'api',
        tags: ['booking', 'bookings', 'schedule', 'appointments'],
      },
      {
        title: 'Availability API Endpoints',
        content: `
The availability system provides the following endpoints:

GET /availability/:providerId - Get availability for a provider
POST /availability - Create new availability slots
PUT /availability/:id - Update availability slots
DELETE /availability/:id - Remove availability slots
GET /availability/search - Search for available slots across providers
POST /availability/bulk - Create multiple availability slots at once
GET /availability/weekly/:providerId - Get weekly availability
        `,
        category: 'api',
        tags: ['availability', 'schedule', 'slots', 'providers'],
      },
      {
        title: 'User Management API Endpoints',
        content: `
The user management system provides the following endpoints:

GET /users - Get all users (admin only)
GET /users/:id - Get user by ID
PUT /users/:id - Update user details
DELETE /users/:id - Delete a user (admin only)
GET /users/profile - Get current user profile
PUT /users/profile - Update current user profile
GET /users/search - Search for users
POST /users/invite - Invite a new user
        `,
        category: 'api',
        tags: ['users', 'user', 'profile', 'management'],
      }
    ];

    await this.knowledgeBaseService.bulkCreate(apiDocs);
    this.logger.log('API endpoints documentation ingested');
  }

  private async ingestBookingSystemDocumentation() {
    this.logger.log('Ingesting booking system documentation');

    const bookingDocs: KnowledgeDocumentCreateDto[] = [
      {
        title: 'Booking System Overview',
        content: `
The EventideV1 booking system allows users to schedule appointments with service providers. Key features include:

- Real-time availability checking
- Booking creation and management
- Booking confirmation workflows
- Cancellation policies
- Payment integration
- Email/SMS notifications
- Booking history tracking
        `,
        category: 'booking',
        tags: ['overview', 'functionality', 'features'],
      },
      {
        title: 'Booking Lifecycle',
        content: `
The booking lifecycle in EventideV1 follows these steps:

1. Availability Check: User checks available time slots
2. Booking Creation: User creates a booking request
3. Payment Processing: If required, payment is processed
4. Confirmation: Booking is confirmed (automatically or manually)
5. Pre-booking: Reminders and prep instructions sent
6. Service Delivery: Service is provided at scheduled time
7. Post-service: Follow-up and feedback collection
8. Completion: Booking marked as completed

Bookings can be canceled at various stages according to cancellation policies.
        `,
        category: 'booking',
        tags: ['lifecycle', 'process', 'stages'],
      },
      {
        title: 'Booking Statuses',
        content: `
Bookings in EventideV1 can have the following statuses:

- PENDING: Booking created but not yet confirmed
- CONFIRMED: Booking confirmed and scheduled
- CANCELLED: Booking canceled by user or provider
- COMPLETED: Service was delivered as scheduled
- NO_SHOW: User did not show up for the appointment
- RESCHEDULED: Booking moved to a different time
        `,
        category: 'booking',
        tags: ['statuses', 'lifecycle', 'states'],
      }
    ];

    await this.knowledgeBaseService.bulkCreate(bookingDocs);
    this.logger.log('Booking system documentation ingested');
  }

  private async ingestAvailabilitySystemDocumentation() {
    this.logger.log('Ingesting availability system documentation');

    const availabilityDocs: KnowledgeDocumentCreateDto[] = [
      {
        title: 'Availability System Overview',
        content: `
The availability system in EventideV1 manages when service providers are available to receive bookings. Key features include:

- Recurring availability patterns (daily, weekly, monthly)
- One-time availability slots
- Time zone handling
- Buffer time management
- Unavailability blocks
- Availability overrides
- Bulk availability creation
        `,
        category: 'availability',
        tags: ['overview', 'functionality', 'features'],
      },
      {
        title: 'Availability Types',
        content: `
EventideV1 supports several types of availability:

1. Recurring Availability: Regular patterns that repeat
   - Daily: Same times every day
   - Weekly: Different times for each day of the week
   - Monthly: Specific days of each month

2. Fixed Availability: One-time availability slots
   - Single time slots
   - Multi-day time ranges

3. Exception Rules: Override regular patterns
   - Holiday blocks
   - Temporary unavailability
   - Special event scheduling
        `,
        category: 'availability',
        tags: ['types', 'patterns', 'rules'],
      },
      {
        title: 'Time Zone Handling',
        content: `
The availability system properly handles time zones:

- Providers set their availability in their local time zone
- When creating availability, the system stores both local and UTC times
- When users view availability, times are converted to their local time zone
- This ensures accurate scheduling regardless of geographic location
- Time zone data is validated to prevent scheduling conflicts
        `,
        category: 'availability',
        tags: ['timezones', 'timezone', 'conversion', 'localization'],
      }
    ];

    await this.knowledgeBaseService.bulkCreate(availabilityDocs);
    this.logger.log('Availability system documentation ingested');
  }

  private async ingestUserRolesDocumentation() {
    this.logger.log('Ingesting user roles and permissions documentation');

    const userRolesDocs: KnowledgeDocumentCreateDto[] = [
      {
        title: 'User Roles in EventideV1',
        content: `
EventideV1 implements a role-based access control system with the following roles:

1. ADMIN: Full system access
   - Can manage all users
   - Access to all system settings
   - Financial reporting
   - System configuration

2. PROVIDER: Service provider role
   - Manage personal availability
   - View and manage bookings
   - Access to provider dashboard
   - Client communication tools

3. CLIENT: Service recipient role
   - Book appointments
   - View booking history
   - Manage personal profile
   - Payment methods

4. STAFF: Organization staff role
   - Limited admin capabilities
   - User support functions
   - Reporting access
   - Scheduling assistance
        `,
        category: 'user_roles',
        tags: ['roles', 'permissions', 'access', 'authorization'],
      },
      {
        title: 'Permission System',
        content: `
The EventideV1 permission system controls access to various system functions:

- READ: View data without modifying
- WRITE: Create new data entries
- UPDATE: Modify existing data
- DELETE: Remove data entries
- MANAGE: Full control over specific resources

Permissions are role-based but can be customized for specific users.
Access to sensitive information is restricted based on user roles.
API endpoints enforce permissions at the controller level.
        `,
        category: 'user_roles',
        tags: ['permissions', 'access', 'security', 'authorization'],
      }
    ];

    await this.knowledgeBaseService.bulkCreate(userRolesDocs);
    this.logger.log('User roles documentation ingested');
  }

  private async ingestFrontendInterfaceDocumentation() {
    this.logger.log('Ingesting frontend interface documentation');

    const frontendDocs: KnowledgeDocumentCreateDto[] = [
      {
        title: 'Frontend Architecture',
        content: `
The EventideV1 frontend is built with Angular and follows these architectural principles:

- Component-based architecture
- Reactive state management
- Service-oriented design
- Responsive UI components
- Accessibility compliance
- Modular feature organization
- Lazy loading for performance
        `,
        category: 'frontend',
        tags: ['architecture', 'angular', 'components'],
      },
      {
        title: 'User Workflows',
        content: `
Key user workflows in the EventideV1 frontend:

1. Booking Flow:
   - Search for providers
   - View availability calendar
   - Select time slot
   - Provide booking details
   - Process payment (if required)
   - Receive confirmation

2. Provider Management Flow:
   - Login to provider dashboard
   - Set availability
   - Manage bookings
   - Communicate with clients
   - Access reporting

3. Account Management Flow:
   - User registration
   - Profile management
   - Payment method setup
   - Notification preferences
   - Booking history review
        `,
        category: 'frontend',
        tags: ['workflows', 'ui', 'user-experience'],
      }
    ];

    await this.knowledgeBaseService.bulkCreate(frontendDocs);
    this.logger.log('Frontend interface documentation ingested');
  }

  private async ingestCommonUserQuestions() {
    this.logger.log('Ingesting common user questions documentation');

    const faqDocs: KnowledgeDocumentCreateDto[] = [
      {
        title: 'How to use the EventideV1 system',
        content: `
The EventideV1 system is a comprehensive platform for both clients and service providers.

As a **client**, you can:
- Search for service providers.
- View provider profiles and availability.
- Book appointments.
- Manage your bookings.
- Make payments.

As a **service provider**, you can:
- Create and manage your profile.
- Set your availability.
- Manage your bookings.
- Communicate with clients.
        `,
        category: 'faq',
        tags: ['overview', 'how-to', 'guide'],
      },
      {
        title: 'How do I book an appointment?',
        content: `
To book an appointment in EventideV1:

1. Navigate to the booking page or provider search
2. Select your preferred service provider
3. Choose a date and time from their available slots
4. Fill in your contact and service details
5. Review your booking information
6. Complete payment if required
7. You'll receive a confirmation email with booking details
        `,
        category: 'faq',
        tags: ['booking', 'appointment', 'how-to', 'guide'],
      },
      {
        title: 'How do I cancel a booking?',
        content: `
To cancel a booking:

1. Go to your booking history or dashboard
2. Find the booking you want to cancel
3. Click the 'Cancel Booking' button
4. Confirm the cancellation
5. You may receive a refund based on our cancellation policy
6. You'll receive a cancellation confirmation email

Note: Cancellations may be subject to fees depending on timing.
        `,
        category: 'faq',
        tags: ['cancel', 'cancellation', 'refund', 'policy'],
      },
      {
        title: 'How do I change my availability as a provider?',
        content: `
As a service provider, to change your availability:

1. Log in to your provider dashboard
2. Navigate to the 'Availability' section
3. Select the date range you want to modify
4. Add, edit, or remove time slots
5. Save your changes
6. Your updated availability will be reflected immediately

You can set recurring availability patterns or one-time slots.
        `,
        category: 'faq',
        tags: ['availability', 'provider', 'schedule', 'settings'],
      },
      {
        title: 'What payment methods are accepted?',
        content: `
EventideV1 accepts the following payment methods:

- Credit cards (Visa, MasterCard, American Express)
- Debit cards
- PayPal
- Apple Pay
- Google Pay

Payment processing is secure and PCI compliant.
Some providers may require payment at booking, others at service delivery.
Refund policies vary by provider and service type.
        `,
        category: 'faq',
        tags: ['payment', 'payments', 'credit-card', 'billing'],
      }
    ];

    await this.knowledgeBaseService.bulkCreate(faqDocs);
    this.logger.log('Common user questions documentation ingested');
  }
}