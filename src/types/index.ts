
export type UserRole = 'admin' | 'user';

export type Platform = 'Airbnb' | 'Booking' | 'VRBO' | 'Manual' | 'Other';

export type ReservationSource = 'iCal' | 'Manual';

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
  type?: string;
  description?: string;
  createdAt: Date;
}

export interface ICalLink {
  id: string;
  propertyId: string;
  platform: Platform;
  url: string;
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
  icalUrl?: string;
  notes?: string;
  createdAt: Date;
}
