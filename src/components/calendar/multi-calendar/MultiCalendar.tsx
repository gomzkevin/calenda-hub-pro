
import React, { useMemo } from 'react';
import { useReservations } from './hooks/useReservations';
import { useDateNavigation } from './hooks/useDateNavigation';
import { usePropertyRelationships } from './hooks/usePropertyRelationships';
import MultiCalendarHeader from './MultiCalendarHeader';
import DayHeader from './DayHeader';
import PropertyRow from './PropertyRow';
import { Property } from '@/types';
import { Card } from '@/components/ui/card';
import { calculateBarPositionAndStyle, getReservationStyle } from '../utils/styleCalculation';
import {
  normalizeDate,
  isSameDate,
  sortReservationsByStartDate
} from '../utils/dateUtils';

interface MultiCalendarProps {
  onPropertySelect?: (propertyId: string) => void;
}

const MultiCalendarComponent: React.FC<MultiCalendarProps> = ({ onPropertySelect }) => {
  // Custom hooks for data and navigation
  const { startDate, endDate, visibleDays, goForward, goBackward } = useDateNavigation();
  const { reservations, isLoading } = useReservations(startDate, endDate);
  
  // Mock para las propiedades mientras resolvemos los errores
  const properties: Property[] = useMemo(() => [], []);
  
  // Objeto provisional para resolver los errores
  const { 
    parentToChildren, 
    childToParent,
    siblingGroups 
  } = usePropertyRelationships(properties, reservations);
  
  // Emular la función getSourceReservationInfo para resolver el error
  const getSourceReservationInfo = (reservation: any) => ({ property: undefined, reservation: undefined });
  
  // Crear un Map vacío para propertyLanes
  const propertyLanes = new Map<string, number>();
  
  // Memoize property sorting to prevent recalculations
  const sortedProperties = useMemo(() => {
    return [...properties].sort((a, b) => {
      // Parent properties first, then sort alphabetically
      if (a.type === 'parent' && b.type !== 'parent') return -1;
      if (a.type !== 'parent' && b.type === 'parent') return 1;
      
      // Then children
      if (a.type === 'child' && b.type !== 'child') return -1;
      if (a.type !== 'child' && b.type === 'child') return 1;
      
      // When both have same type, sort by name
      return a.name.localeCompare(b.name);
    });
  }, [properties]);
  
  // getDayReservationStatus es una función memoizada para mejorar el rendimiento
  const getDayReservationStatus = useMemo(() => {
    return (property: Property, day: Date) => {
      // Verifica eficientemente si hay reservaciones para esta propiedad en este día
      const normalizedDate = normalizeDate(day);
      const propertyReservations = reservations.filter(res => 
        res.propertyId === property.id && 
        normalizedDate >= normalizeDate(new Date(res.startDate)) && 
        normalizedDate < normalizeDate(new Date(res.endDate))
      );
      
      // Verifica si alguna reservación es indirecta (de relaciones)
      const isIndirect = propertyReservations.some(res => res.isRelationshipBlock || res.sourceReservationId);
      
      return {
        hasReservation: propertyReservations.length > 0,
        isIndirect,
        reservations: propertyReservations
      };
    };
  }, [reservations]);
  
  if (isLoading) {
    return (
      <Card className="w-full h-full p-4 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="w-32 h-8 bg-gray-200 animate-pulse rounded"></div>
          <div className="flex space-x-2">
            <div className="w-8 h-8 bg-gray-200 animate-pulse rounded"></div>
            <div className="w-8 h-8 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
        <div className="flex-grow">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex mb-2">
              <div className="w-40 h-16 bg-gray-200 animate-pulse rounded"></div>
              <div className="flex-grow grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="h-16 bg-gray-100 animate-pulse rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <MultiCalendarHeader 
        startDate={startDate}
        visibleDays={visibleDays}
        onPrev={goBackward}
        onNext={goForward}
      />
      
      <div className="flex-1 overflow-auto">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[200px_repeat(7,_1fr)] sticky top-0 z-10">
            <div className="bg-white border-b border-gray-200 h-10"></div>
            {visibleDays.map((day, i) => (
              <DayHeader key={i} day={day} index={i} />
            ))}
          </div>
          
          <div className="grid grid-cols-[200px_repeat(7,_1fr)]">
            {sortedProperties.map((property) => (
              <React.Fragment key={property.id}>
                <PropertyRow
                  property={property}
                  visibleDays={visibleDays}
                  getDayReservationStatus={getDayReservationStatus}
                  sortReservations={sortReservationsByStartDate}
                  propertyLanes={propertyLanes}
                  getReservationStyle={getReservationStyle}
                  getSourceReservationInfo={getSourceReservationInfo}
                  normalizeDate={normalizeDate}
                  onPropertySelect={onPropertySelect}
                />
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiCalendarComponent;
