export type UserRole = 'admin' | 'user';

export type Platform = 'Airbnb' | 'Booking' | 'Vrbo' | 'Other';

export type ReservationSource = 'iCal' | 'Manual';

export type ReservationStatus = 'Reserved' | 'Blocked' | 'Tentative';

// Expand PropertyType to include both relationship types and actual property types
export type PropertyType = 'standalone' | 'parent' | 'child' | 'Villa' | 'Apartment' | 'Cabin' | 'Other';

export interface Operator {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  operatorId: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
}

export interface Property {
  id: string;
  operatorId: string;
  name: string;
  address: string;
  internalCode: string;
  notes?: string;
  imageUrl?: string;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  type?: PropertyType;
  parentId?: string;
  description?: string;
  ical_token?: string;
  ical_url?: string;
  createdAt: Date;
}

export interface ICalLink {
  id: string;
  propertyId: string;
  platform: Platform;
  url: string;
  lastSynced?: Date;
  createdAt: Date;
}

export interface Reservation {
  id: string;
  propertyId: string;
  userId?: string;
  startDate: Date;
  endDate: Date;
  platform: Platform;
  source: ReservationSource;
  status?: ReservationStatus;
  guestName?: string;
  guestCount?: number;
  contactInfo?: string;
  icalUrl?: string;
  notes?: string;
  externalId?: string;
  isBlocking?: boolean;
  sourceReservationId?: string;
  isRelationshipBlock?: boolean;
  createdAt: Date;
}
