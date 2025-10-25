import { User } from './auth.models';

// Normalize backend user payloads to a canonical User with a stable string id
export function normalizeUser(input: any): User {
  const src = input || {};
  let id: string | undefined = src.id;
  const oid = src._id;
  if (!id && oid) {
    if (typeof oid === 'string') id = oid;
    else if (oid && typeof oid === 'object' && (oid.buffer || oid.data)) {
      const raw = (oid.buffer?.data ?? oid.buffer ?? oid.data) as Uint8Array | number[];
      const bytes: number[] = Array.isArray(raw) ? (raw as number[]) : Array.from(raw as Uint8Array);
      id = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
    } else if (typeof oid.toString === 'function') {
      id = oid.toString();
    }
  }

  const user: User = {
    id,
    email: src.email ?? '',
    firstName: src.firstName ?? '',
    lastName: src.lastName ?? '',
    picture: src.picture ?? '',
    businessName: src.businessName,
    bio: src.bio,
    contactPhone: src.contactPhone,
    services: src.services ?? [],
    categories: src.categories ?? [],
    customCategories: src.customCategories ?? [],
    availableDurations: src.availableDurations ?? [],
    locationDetails: src.locationDetails,
    preferences: src.preferences,
    role: src.role,
    isEmailVerified: src.isEmailVerified,
    isActive: src.isActive,
  } as User;

  return user;
}
