
import React from 'react';
import { Reservation, Property } from '@/types';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { Link } from 'lucide-react';

interface ReservationTooltipProps {
  reservation: Reservation;
  property: Property;
  sourceInfo: { property?: Property, reservation?: Reservation };
  style: string;
  topPosition: number;
  isStartDay: boolean;
}

const ReservationTooltip: React.FC<ReservationTooltipProps> = ({
  reservation,
  property,
  sourceInfo,
  style,
  topPosition,
  isStartDay
}) => {
  // Show parent or child icon if there's a relationship
  const showRelationshipIcon = property.type === 'parent' && reservation.propertyId !== property.id || 
                              property.type === 'child' && reservation.propertyId !== property.id;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`absolute h-6 ${style} flex items-center px-1.5 rounded text-white text-xs z-10`}
            style={{
              top: `${topPosition}px`,
              left: 0,
              right: 0,
            }}
          >
            <span className="truncate mr-1">{reservation.platform}</span>
            {showRelationshipIcon && <Link size={10} className="shrink-0" />}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p><strong>Platform:</strong> {reservation.platform}</p>
            <p><strong>Check-in:</strong> {format(new Date(reservation.startDate), 'MMM d, yyyy')}</p>
            <p><strong>Check-out:</strong> {format(new Date(reservation.endDate), 'MMM d, yyyy')}</p>
            {reservation.guestName && (
              <p><strong>Guest:</strong> {reservation.guestName}</p>
            )}
            {showRelationshipIcon && sourceInfo.property && (
              <p>
                <strong>Related to:</strong> {sourceInfo.property.name} 
                ({sourceInfo.property.type === 'parent' ? 'Main property' : 'Room'})
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ReservationTooltip;
