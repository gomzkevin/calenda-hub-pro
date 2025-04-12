
import { Reservation, Platform, ReservationSource, ReservationStatus } from "@/types";

/**
 * Helper to normalize dates to noon to avoid timezone issues
 */
export const normalizeDate = (date: Date): Date => {
  const newDate = new Date(date);
  // Set time to noon UTC to avoid any timezone issues
  newDate.setUTCHours(12, 0, 0, 0);
  return newDate;
};

/**
 * Transform data from Supabase's snake_case to camelCase for our app
 */
export const mapReservationFromDatabase = (dbRes: any): Reservation => {
  return {
    id: dbRes.id,
    propertyId: dbRes.property_id,
    userId: dbRes.user_id || undefined,
    startDate: normalizeDate(new Date(dbRes.start_date)),
    endDate: normalizeDate(new Date(dbRes.end_date)),
    platform: dbRes.platform as Platform,
    source: dbRes.source as ReservationSource,
    status: dbRes.status as ReservationStatus || undefined,
    guestName: dbRes.guest_name || undefined,
    guestCount: dbRes.guest_count || undefined,
    contactInfo: dbRes.contact_info || undefined,
    icalUrl: dbRes.ical_url || undefined,
    notes: dbRes.notes || undefined,
    externalId: dbRes.external_id || undefined,
    isBlocking: dbRes.is_blocking || false,
    sourceReservationId: dbRes.source_reservation_id || undefined,
    isRelationshipBlock: false, // Default value, we'll set this when needed
    createdAt: new Date(dbRes.created_at)
  };
};
