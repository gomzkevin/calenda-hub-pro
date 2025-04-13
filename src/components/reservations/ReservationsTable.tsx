
import React from 'react';
import { format, differenceInCalendarDays } from 'date-fns';
import { Reservation, Property } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Info, Link } from 'lucide-react';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReservationsTableProps {
  reservations: Reservation[];
  properties: Property[];
  onView: (reservation: Reservation) => void;
  onEdit: (reservation: Reservation) => void;
  onDelete: (reservation: Reservation) => void;
}

const ReservationsTable: React.FC<ReservationsTableProps> = ({
  reservations,
  properties,
  onView,
  onEdit,
  onDelete,
}) => {
  // Maps for easy lookup
  const propertyMap = properties.reduce<Record<string, Property>>((acc, property) => {
    acc[property.id] = property;
    return acc;
  }, {});

  // Filter out blocked reservations first
  const filteredReservations = reservations.filter(res => 
    res.notes !== 'Blocked' && 
    res.status !== 'Blocked'
  );

  // Sort reservations by check-in date (startDate)
  const sortedReservations = [...filteredReservations].sort((a, b) => 
    a.startDate.getTime() - b.startDate.getTime()
  );

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

  // Find source reservation property
  const getSourceReservationInfo = (reservation: Reservation): { property?: Property, reservation?: Reservation } => {
    if (!reservation.sourceReservationId) return {};
    
    const sourceReservation = reservations.find(r => r.id === reservation.sourceReservationId);
    if (!sourceReservation) return {};
    
    const sourceProperty = propertyMap[sourceReservation.propertyId];
    
    return { property: sourceProperty, reservation: sourceReservation };
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alojamiento</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Noches</TableHead>
            <TableHead>Huésped</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedReservations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                No hay reservaciones que mostrar
              </TableCell>
            </TableRow>
          ) : (
            sortedReservations.map((reservation) => {
              const property = propertyMap[reservation.propertyId];
              const nights = differenceInCalendarDays(reservation.endDate, reservation.startDate);
              const { property: sourceProperty } = getSourceReservationInfo(reservation);
              
              return (
                <TableRow key={reservation.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      {property?.name || 'Propiedad desconocida'}
                      
                      {reservation.sourceReservationId && sourceProperty && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <Link className="h-3 w-3 mr-1" />
                                <span>Bloqueado por {sourceProperty.name}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Esta propiedad está bloqueada automáticamente debido a una reserva en {sourceProperty.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColorClass(reservation.platform)}`}>
                      {getDisplayPlatform(reservation.platform)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(reservation.startDate, 'dd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    {format(reservation.endDate, 'dd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    {nights} {nights === 1 ? 'noche' : 'noches'}
                  </TableCell>
                  <TableCell>
                    {reservation.guestName || '-'}
                  </TableCell>
                  <TableCell>
                    {reservation.status ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClass(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Reserved
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(reservation)}
                        title="Ver detalles"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      
                      {reservation.source === 'Manual' && !reservation.sourceReservationId && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(reservation)}
                            title="Editar reserva"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(reservation)}
                            title="Eliminar reserva"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReservationsTable;
