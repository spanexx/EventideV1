import { GuestInfo, GuestPreferences } from './guest.models';

describe('GuestModels', () => {
  it('should define GuestInfo interface', () => {
    const guestInfo: GuestInfo = {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    expect(guestInfo).toBeDefined();
    expect(guestInfo.id).toBe('1');
    expect(guestInfo.name).toBe('John Doe');
    expect(guestInfo.email).toBe('john.doe@example.com');
  });

  it('should define GuestPreferences interface', () => {
    const guestPreferences: GuestPreferences = {
      notifications: {
        email: true,
        sms: false
      },
      timezone: 'UTC'
    };
    
    expect(guestPreferences).toBeDefined();
    expect(guestPreferences.notifications.email).toBe(true);
    expect(guestPreferences.notifications.sms).toBe(false);
    expect(guestPreferences.timezone).toBe('UTC');
  });
});