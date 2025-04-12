
import React from 'react';
import { format } from 'date-fns';
import { Link } from 'lucide-react';
import { Property } from '@/types';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface ReservationTooltipProps {
  reservation: any;
  property: Property;
  sourceInfo: { property?: Property, reservation?: any };
  style: string;
  borderRadius: string;
  topPosition: number;
  leftValue: string;
  rightValue: string;
  isStartDay: boolean;
}

const ReservationTooltip: React.FC<ReservationTooltipProps> = ({
  reservation,
  property,
  sourceInfo,
  style,
  borderRadius,
  topPosition,
  leftValue,
  rightValue,
  isStartDay
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`absolute h-5 ${style} ${borderRadius} flex items-center px-1 text-xs font-medium transition-all hover:brightness-90 hover:shadow-md overflow-hidden`}
            style={{
              top: `${topPosition}px`,
              left: leftValue,
              right: rightValue,
              zIndex: 5
            }}
          >
            {isStartDay && (
              <span className="truncate">
                {reservation.sourceReservationId ? (
                  <Link className="h-3 w-3 inline mr-1" />
                ) : null}
                {reservation.platform}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p><strong>{property.name}</strong></p>
            <p><strong>Platform:</strong> {reservation.platform}</p>
            <p><strong>Check-in:</strong> {format(reservation.startDate, 'MMM d, yyyy')}</p>
            <p><strong>Check-out:</strong> {format(reservation.endDate, 'MMM d, yyyy')}</p>
            
            {sourceInfo.property && (
              <p className="text-muted-foreground mt-1">
                <em>Bloqueado por reserva en {sourceInfo.property.name}</em>
              </p>
            )}
            
            {reservation.notes && reservation.notes !== 'Blocked' && (
              <p><strong>Notes:</strong> {reservation.notes}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ReservationTooltip;
