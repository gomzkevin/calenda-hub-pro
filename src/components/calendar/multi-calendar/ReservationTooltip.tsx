
import React from 'react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Property } from '@/types';

interface ReservationTooltipProps {
  reservation: any;
  property: Property;
  sourceInfo: { property?: Property, reservation?: any };
  style: string;
  topPosition: number;
  isStartDay: boolean;
  clipPath?: string;
  zIndex?: number;
}

const ReservationTooltip: React.FC<ReservationTooltipProps> = ({
  reservation,
  property,
  sourceInfo,
  style,
  topPosition,
  isStartDay,
  clipPath,
  zIndex = 10
}) => {
  const isBlock = reservation.status === 'Blocked' || reservation.isBlocking;
  const showSourceInfo = sourceInfo.property && sourceInfo.reservation;
  
  // Adjust label position for triangular clips
  const labelClass = clipPath ? 'truncate' : 'truncate';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`absolute h-8 ${style} rounded-full flex items-center px-2 text-white text-xs cursor-pointer overflow-hidden`}
            style={{
              top: `${topPosition}px`,
              left: 0,
              right: 0,
              clipPath,
              zIndex
            }}
          >
            <span className={labelClass}>
              {reservation.platform || 'Blocked'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p><strong>Platform:</strong> {reservation.platform || 'N/A'}</p>
            <p><strong>Check-in:</strong> {format(new Date(reservation.startDate), 'MMM d, yyyy')}</p>
            <p><strong>Check-out:</strong> {format(new Date(reservation.endDate), 'MMM d, yyyy')}</p>
            
            {reservation.status && <p><strong>Status:</strong> {reservation.status}</p>}
            {isBlock && <p><strong>Blocked:</strong> Yes</p>}
            {reservation.guestName && <p><strong>Guest:</strong> {reservation.guestName}</p>}
            
            {showSourceInfo && (
              <>
                <div className="border-t my-1 pt-1">
                  <p className="font-medium">Source Reservation:</p>
                  <p><strong>Property:</strong> {sourceInfo.property.name}</p>
                  <p><strong>Platform:</strong> {sourceInfo.reservation.platform}</p>
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ReservationTooltip;
