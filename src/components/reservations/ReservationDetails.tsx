
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Reservation, Property } from '@/types';
import { differenceInCalendarDays } from 'date-fns';
import { CalendarDays, Users, Phone, Mail, Tag, FileText } from 'lucide-react';

interface ReservationDetailsProps {
  reservation: Reservation;
  property?: Property;
}

const ReservationDetails: React.FC<ReservationDetailsProps> = ({ reservation, property }) => {
  const nights = differenceInCalendarDays(reservation.endDate, reservation.startDate);

  // Get platform color class
  const getPlatformColorClass = (platform: string): string => {
    switch (platform) {
      case 'Airbnb':
        return 'bg-rose-100 text-rose-800';
      case 'Vrbo':
        return 'bg-green-100 text-green-800';
      case 'Booking':
        return 'bg-blue-100 text-blue-800';
      case 'Other':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get displayed platform name
  const getDisplayPlatform = (platform: string): string => {
    return platform === 'Other' ? 'Manual' : platform;
  };

  // Get status color class
  const getStatusColorClass = (status?: string): string => {
    switch (status) {
      case 'Reserved':
        return 'bg-emerald-100 text-emerald-800';
      case 'Blocked':
        return 'bg-red-100 text-red-800';
      case 'Tentative':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Detalles de la Reserva</h3>
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColorClass(reservation.platform)}`}>
            {getDisplayPlatform(reservation.platform)}
          </span>
          {reservation.status && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClass(reservation.status)}`}>
              {reservation.status}
            </span>
          )}
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {reservation.source}
          </span>
        </div>
      </div>

      {/* Property section */}
      {property && (
        <div className="pb-3 border-b">
          <h4 className="font-medium mb-2">Alojamiento</h4>
          <p className="text-sm">{property.name}</p>
          <p className="text-sm text-muted-foreground">{property.address}</p>
        </div>
      )}

      {/* Dates section */}
      <div className="pb-3 border-b">
        <h4 className="font-medium mb-2 flex items-center">
          <CalendarDays className="h-4 w-4 mr-2" />
          Fechas
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Check-in</p>
            <p className="text-sm font-medium">{format(reservation.startDate, 'EEEE, dd MMMM yyyy', { locale: es })}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Check-out</p>
            <p className="text-sm font-medium">{format(reservation.endDate, 'EEEE, dd MMMM yyyy', { locale: es })}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm font-medium mt-1">
              {nights} {nights === 1 ? 'noche' : 'noches'} de estancia
            </p>
          </div>
        </div>
      </div>

      {/* Guest section */}
      {(reservation.guestName || reservation.guestCount) && (
        <div className="pb-3 border-b">
          <h4 className="font-medium mb-2 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Huésped
          </h4>
          {reservation.guestName && (
            <p className="text-sm font-medium">{reservation.guestName}</p>
          )}
          {reservation.guestCount && (
            <p className="text-sm text-muted-foreground">
              {reservation.guestCount} {reservation.guestCount === 1 ? 'huésped' : 'huéspedes'}
            </p>
          )}
        </div>
      )}

      {/* Contact information */}
      {reservation.contactInfo && (
        <div className="pb-3 border-b">
          <h4 className="font-medium mb-2 flex items-center">
            {reservation.contactInfo.includes('@') ? (
              <Mail className="h-4 w-4 mr-2" />
            ) : (
              <Phone className="h-4 w-4 mr-2" />
            )}
            Contacto
          </h4>
          <p className="text-sm">{reservation.contactInfo}</p>
        </div>
      )}

      {/* External ID */}
      {reservation.externalId && (
        <div className="pb-3 border-b">
          <h4 className="font-medium mb-2 flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            ID Externo
          </h4>
          <p className="text-sm font-mono">{reservation.externalId}</p>
        </div>
      )}

      {/* Notes */}
      {reservation.notes && (
        <div className="pb-3 border-b">
          <h4 className="font-medium mb-2 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Notas
          </h4>
          <p className="text-sm whitespace-pre-wrap">{reservation.notes}</p>
        </div>
      )}

      {/* Creation info */}
      <div>
        <p className="text-xs text-muted-foreground">
          Creado el {format(reservation.createdAt, 'dd/MM/yyyy HH:mm')}
        </p>
      </div>
    </div>
  );
};

export default ReservationDetails;
