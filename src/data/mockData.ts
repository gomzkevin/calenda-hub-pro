
import { ICalLink, Operator, Platform, Property, Reservation, User } from '@/types';

// Sample operator
export const sampleOperator: Operator = {
  id: 'op-1',
  name: 'Beach Properties, Inc.',
  slug: 'beach-properties',
  logoUrl: '/placeholder.svg',
  createdAt: new Date('2023-01-01')
};

// Sample users
export const sampleUsers: User[] = [
  {
    id: 'user-1',
    operatorId: 'op-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    active: true,
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'user-2',
    operatorId: 'op-1',
    name: 'Regular User',
    email: 'user@example.com',
    role: 'user',
    active: true,
    createdAt: new Date('2023-01-02')
  }
];

// Sample properties
export const sampleProperties: Property[] = [
  {
    id: 'prop-1',
    operatorId: 'op-1',
    name: 'Beachfront Villa',
    address: '123 Ocean Drive',
    internalCode: 'BFV-001',
    notes: 'Premium property with ocean views',
    createdAt: new Date('2023-01-10')
  },
  {
    id: 'prop-2',
    operatorId: 'op-1',
    name: 'Downtown Apartment',
    address: '456 Main Street',
    internalCode: 'DTA-002',
    notes: 'Central location, walking distance to shops',
    createdAt: new Date('2023-01-15')
  },
  {
    id: 'prop-3',
    operatorId: 'op-1',
    name: 'Mountain Cabin',
    address: '789 Forest Road',
    internalCode: 'MTC-003',
    notes: 'Rustic cabin with hiking trails nearby',
    createdAt: new Date('2023-01-20')
  }
];

// Sample iCal links
export const sampleICalLinks: ICalLink[] = [
  {
    id: 'ical-1',
    propertyId: 'prop-1',
    platform: 'Airbnb',
    url: 'https://example.com/ical/airbnb/prop1',
    createdAt: new Date('2023-01-11')
  },
  {
    id: 'ical-2',
    propertyId: 'prop-1',
    platform: 'Booking',
    url: 'https://example.com/ical/booking/prop1',
    createdAt: new Date('2023-01-12')
  },
  {
    id: 'ical-3',
    propertyId: 'prop-2',
    platform: 'VRBO',
    url: 'https://example.com/ical/vrbo/prop2',
    createdAt: new Date('2023-01-16')
  },
  {
    id: 'ical-4',
    propertyId: 'prop-3',
    platform: 'Airbnb',
    url: 'https://example.com/ical/airbnb/prop3',
    createdAt: new Date('2023-01-21')
  }
];

// Helper function to create a Date for reservations
const createDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day);
};

// Sample reservations - Now with dates in April and May 2025 to be visible on the calendar
export const sampleReservations: Reservation[] = [
  {
    id: 'res-1',
    propertyId: 'prop-1',
    userId: 'user-1',
    startDate: createDate(2025, 4, 5),
    endDate: createDate(2025, 4, 10),
    platform: 'Airbnb',
    source: 'iCal',
    icalUrl: 'https://example.com/ical/airbnb/prop1',
    createdAt: new Date('2025-01-15')
  },
  {
    id: 'res-2',
    propertyId: 'prop-1',
    userId: 'user-1',
    startDate: createDate(2025, 4, 15),
    endDate: createDate(2025, 4, 20),
    platform: 'Booking',
    source: 'iCal',
    icalUrl: 'https://example.com/ical/booking/prop1',
    createdAt: new Date('2025-01-20')
  },
  {
    id: 'res-3',
    propertyId: 'prop-2',
    userId: 'user-2',
    startDate: createDate(2025, 4, 7),
    endDate: createDate(2025, 4, 14),
    platform: 'VRBO',
    source: 'iCal',
    icalUrl: 'https://example.com/ical/vrbo/prop2',
    createdAt: new Date('2025-01-25')
  },
  {
    id: 'res-4',
    propertyId: 'prop-3',
    userId: 'user-1',
    startDate: createDate(2025, 4, 22),
    endDate: createDate(2025, 4, 28),
    platform: 'Airbnb',
    source: 'iCal',
    icalUrl: 'https://example.com/ical/airbnb/prop3',
    createdAt: new Date('2025-02-01')
  },
  {
    id: 'res-5',
    propertyId: 'prop-1',
    userId: 'user-2',
    startDate: createDate(2025, 5, 5),
    endDate: createDate(2025, 5, 10),
    platform: 'Manual',
    source: 'Manual',
    notes: 'Direct booking by phone',
    createdAt: new Date('2025-02-10')
  },
  // Add more reservations for visual testing
  {
    id: 'res-6',
    propertyId: 'prop-2',
    userId: 'user-1',
    startDate: createDate(2025, 4, 18),
    endDate: createDate(2025, 4, 25),
    platform: 'Booking',
    source: 'iCal',
    notes: 'Family of 4',
    createdAt: new Date('2025-02-15')
  },
  {
    id: 'res-7',
    propertyId: 'prop-3',
    userId: 'user-2',
    startDate: createDate(2025, 4, 3),
    endDate: createDate(2025, 4, 8),
    platform: 'VRBO',
    source: 'iCal',
    createdAt: new Date('2025-02-20')
  }
];

// Get reservations for a specific month/year
export const getReservationsForMonth = (
  month: number, 
  year: number
): Reservation[] => {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);
  
  return sampleReservations.filter(reservation => {
    const startDate = reservation.startDate instanceof Date ? 
      reservation.startDate : 
      new Date(reservation.startDate);
    
    const endDate = reservation.endDate instanceof Date ? 
      reservation.endDate : 
      new Date(reservation.endDate);
    
    return (
      (startDate <= endOfMonth && endDate >= startOfMonth) ||
      (startDate >= startOfMonth && startDate <= endOfMonth)
    );
  });
};

// Get reservations for a specific property
export const getReservationsForProperty = (
  propertyId: string
): Reservation[] => {
  return sampleReservations.filter(reservation => reservation.propertyId === propertyId);
};

// Get property by ID
export const getPropertyById = (
  propertyId: string
): Property | undefined => {
  return sampleProperties.find(property => property.id === propertyId);
};

// Get iCal links for a property
export const getICalLinksForProperty = (
  propertyId: string
): ICalLink[] => {
  return sampleICalLinks.filter(link => link.propertyId === propertyId);
};

// Get platform color class
export const getPlatformColorClass = (platform: Platform): string => {
  switch (platform.toLowerCase()) {
    case 'airbnb':
      return 'booking-airbnb';
    case 'booking':
      return 'booking-booking';
    case 'vrbo':
      return 'booking-vrbo';
    case 'manual':
      return 'booking-manual';
    default:
      return 'booking-other';
  }
};
