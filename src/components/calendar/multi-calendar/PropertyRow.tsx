
import React, { useMemo } from 'react';
import { Property, Reservation } from '@/types';
import DayCell from './DayCell';

interface PropertyRowProps {
  property: Property;
  visibleDays: Date[];
  getDayReservationStatus: (property: Property, day: Date) => {
    hasReservation: boolean;
    isIndirect: boolean;
    reservations: any[];
  };
  sortReservations: (resA: any, resB: any) => number;
  propertyLanes: Map<string, number>;
  getReservationStyle: (reservation: any, isIndirect: boolean) => string;
  getSourceReservationInfo: (reservation: any) => { property?: Property, reservation?: any };
  normalizeDate: (date: Date) => Date;
  onPropertySelect?: (propertyId: string) => void;
}

const PropertyRow: React.FC<PropertyRowProps> = ({
  property,
  visibleDays,
  getDayReservationStatus,
  sortReservations,
  propertyLanes,
  getReservationStyle,
  getSourceReservationInfo,
  normalizeDate,
  onPropertySelect
}) => {
  // Determinar el tipo de indicador según el tipo de propiedad
  let typeIndicator = '';
  if (property.type === 'parent') {
    typeIndicator = 'Alojamiento principal';
  } else if (property.type === 'child') {
    typeIndicator = 'Habitación';
  } else if (property.type === 'standalone' || !property.type) {
    typeIndicator = 'Casa';
  }

  // Group days into weeks for reservation bar rendering
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < visibleDays.length; i += 7) {
      result.push(visibleDays.slice(i, i + 7));
    }
    return result;
  }, [visibleDays]);

  // Apply different background colors and border styles based on property type
  let propertyTypeStyles = '';
  if (property.type === 'parent') {
    propertyTypeStyles = 'bg-blue-50/40 border-l-4 border-l-blue-400';
  } else if (property.type === 'child') {
    propertyTypeStyles = 'bg-amber-50/40 border-l-2 border-l-amber-400';
  } else if (property.type === 'standalone' || !property.type) {
    propertyTypeStyles = 'bg-purple-50/40 border-l-3 border-l-purple-400';
  }

  // Handle property click
  const handlePropertyClick = () => {
    if (onPropertySelect) {
      onPropertySelect(property.id);
    }
  };

  return (
    <React.Fragment>
      <div 
        className={`sticky left-0 z-10 bg-white border-b border-r border-gray-100/80 p-3 font-medium truncate h-16 transition-colors ${propertyTypeStyles} shadow-sm hover:bg-gray-50 cursor-pointer`}
        onClick={handlePropertyClick}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">{property.name}</span>
          {typeIndicator && (
            <span className="text-xs text-gray-500 mt-1">
              {typeIndicator}
            </span>
          )}
        </div>
      </div>
      
      {visibleDays.map((day, dayIndex) => (
        <DayCell
          key={`day-${property.id}-${dayIndex}`}
          day={day}
          property={property}
          dayIndex={dayIndex}
          getDayReservationStatus={getDayReservationStatus}
          sortReservations={sortReservations}
          propertyLanes={propertyLanes}
          getReservationStyle={getReservationStyle}
          getSourceReservationInfo={getSourceReservationInfo}
          normalizeDate={normalizeDate}
        />
      ))}
    </React.Fragment>
  );
};

export default PropertyRow;
