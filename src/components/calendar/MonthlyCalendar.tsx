
import React, { useState, useMemo, useEffect } from 'react';
import { addMonths } from 'date-fns';
import { Reservation } from '@/types';
import { getReservationsForMonth } from '@/services/reservation';
import { getPropertyById } from '@/services/propertyService';
import { getChildPropertyIds, getParentPropertyId } from '@/services/reservation/propertyRelations';
import { useQuery } from '@tanstack/react-query';
import { 
  calculateReservationLanes, 
  calculateBlockLanes 
} from './utils/laneCalculation';
import { generateMonthDays, normalizeDate } from './utils/dateUtils';
import CalendarHeader from './CalendarHeader';
import CalendarDayHeader from './CalendarDayHeader';
import CalendarGrid from './CalendarGrid';
import ReservationBars from './ReservationBars';
import CalendarLegend from './CalendarLegend';

interface MonthlyCalendarProps {
  propertyId?: string;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ propertyId }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [relatedPropertyIds, setRelatedPropertyIds] = useState<string[]>([]);
  
  // Fetch property details to determine if it's a parent or child
  const { data: property } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => propertyId ? getPropertyById(propertyId) : null,
    enabled: !!propertyId
  });
  
  // Fetch related property IDs (parent/children) for handling relationship blocks
  useEffect(() => {
    const fetchRelatedProperties = async () => {
      if (!propertyId) return;
      
      try {
        let relatedIds: string[] = [];
        
        // If this is a parent property, get all its children
        if (property?.type === 'parent') {
          const childIds = await getChildPropertyIds(propertyId);
          relatedIds = [...childIds];
        } 
        // If this is a child property, get its parent and siblings
        else if (property?.type === 'child' && property?.parentId) {
          const parentId = property.parentId;
          const childIds = await getChildPropertyIds(parentId);
          
          // Add parent and all siblings except self
          relatedIds = [parentId, ...childIds.filter(id => id !== propertyId)];
        }
        
        setRelatedPropertyIds(relatedIds);
      } catch (error) {
        console.error('Error fetching related properties:', error);
      }
    };
    
    if (property) {
      fetchRelatedProperties();
    }
  }, [propertyId, property]);
  
  // Use React Query to fetch all reservations for the current month
  const { data: allReservations = [], isLoading } = useQuery({
    queryKey: ['reservations', currentMonth.getMonth() + 1, currentMonth.getFullYear(), propertyId, relatedPropertyIds],
    queryFn: async () => {
      try {
        // Get all reservations for this month
        const monthlyReservations = await getReservationsForMonth(
          currentMonth.getMonth() + 1, 
          currentMonth.getFullYear()
        );
        
        // If no property is selected, return all reservations
        if (!propertyId) {
          return monthlyReservations;
        }
        
        // Create a set of all relevant property IDs (selected property + related ones)
        const relevantPropertyIds = new Set([propertyId, ...relatedPropertyIds]);
        
        // Filter reservations for the specific property and its related properties
        return monthlyReservations.filter(res => relevantPropertyIds.has(res.propertyId));
      } catch (error) {
        console.error('Error fetching reservations:', error);
        return [];
      }
    },
    enabled: !!currentMonth
  });
  
  // Filter reservations - main reservations, blocked and relationship blocks
  const { filteredReservations, propagatedBlocks, relationshipBlocks } = useMemo(() => {
    if (!allReservations || allReservations.length === 0) {
      return { filteredReservations: [], propagatedBlocks: [], relationshipBlocks: [] };
    }
    
    // Normalize dates
    const normalizedReservations = allReservations.map(res => ({
      ...res,
      startDate: normalizeDate(new Date(res.startDate)),
      endDate: normalizeDate(new Date(res.endDate))
    }));
    
    // Filter reservations for the selected property
    const directReservations = normalizedReservations.filter(
      res => res.propertyId === propertyId && 
             res.notes !== 'Blocked' &&
             res.status !== 'Blocked' &&
             !res.isRelationshipBlock
    );
    
    // Identify propagated blocks (blocks created due to sourceReservationId)
    const blockedReservations = normalizedReservations.filter(res => 
      res.propertyId === propertyId &&
      res.sourceReservationId && 
      (res.notes === 'Blocked' || res.status === 'Blocked')
    );
    
    // Identify relationship blocks (for parent-child properties)
    const relatedBlocks = normalizedReservations.filter(res => 
      // Include blocks from related properties that would affect this property
      res.propertyId !== propertyId && 
      relatedPropertyIds.includes(res.propertyId) &&
      !res.sourceReservationId // Avoid duplicates with propagated blocks
    );
    
    return {
      filteredReservations: directReservations,
      propagatedBlocks: blockedReservations,
      relationshipBlocks: relatedBlocks
    };
  }, [allReservations, propertyId, relatedPropertyIds]);
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };
  
  // Generate the days for the current month
  const weeks = useMemo(() => generateMonthDays(currentMonth), [currentMonth]);
  
  // Calculate reservation lanes for each week
  const weekReservationLanes = useMemo(() => {
    return calculateReservationLanes(weeks, filteredReservations);
  }, [weeks, filteredReservations]);
  
  // Calculate propagated block lanes for each week
  const weekPropagatedBlockLanes = useMemo(() => {
    return calculateBlockLanes(weeks, propagatedBlocks, 10);
  }, [weeks, propagatedBlocks]);
  
  // Calculate relationship block lanes for each week
  const weekRelationshipBlockLanes = useMemo(() => {
    return calculateBlockLanes(weeks, relationshipBlocks, 5);
  }, [weeks, relationshipBlocks]);
  
  // Calculate cell height based on maximum lanes
  const calculateCellHeight = () => {
    const maxLanes: { [key: number]: number } = {};
    
    weeks.forEach((_, weekIndex) => {
      const weekLanes = weekReservationLanes[weekIndex] || {};
      const blockLanes = weekPropagatedBlockLanes[weekIndex] || {};
      const relationshipLanes = weekRelationshipBlockLanes[weekIndex] || {};
      
      const maxRegularLane = Object.values(weekLanes).reduce((max, lane) => Math.max(max, lane), 0);
      const maxBlockLane = Object.values(blockLanes).reduce((max, lane) => Math.max(max, lane), 0);
      const maxRelationshipLane = Object.values(relationshipLanes).reduce((max, lane) => Math.max(max, lane), 0);
      
      maxLanes[weekIndex] = Math.max(maxRegularLane, Math.max(maxBlockLane - 10, maxRelationshipLane - 5));
    });
    
    const maxLaneAcrossWeeks = Object.values(maxLanes).reduce((max, lane) => Math.max(max, lane), 0);
    const laneHeight = 14; // Height for each reservation lane
    const minCellHeight = 120; // Minimum height for calendar cells
    return Math.max(minCellHeight, 80 + (maxLaneAcrossWeeks * laneHeight));
  };
  
  const cellHeight = useMemo(() => calculateCellHeight(), [
    weekReservationLanes, 
    weekPropagatedBlockLanes, 
    weekRelationshipBlockLanes
  ]);
  
  return (
    <div className="bg-white rounded-lg shadow">
      <CalendarHeader 
        currentMonth={currentMonth}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
      />
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7">
          <CalendarDayHeader />
          
          <CalendarGrid
            weeks={weeks}
            currentMonth={currentMonth}
            relationshipBlocks={relationshipBlocks}
            cellHeight={cellHeight}
          />
          
          <ReservationBars
            weeks={weeks}
            filteredReservations={filteredReservations}
            relationshipBlocks={relationshipBlocks}
            propagatedBlocks={propagatedBlocks}
            weekReservationLanes={weekReservationLanes}
            weekRelationshipBlockLanes={weekRelationshipBlockLanes}
            weekPropagatedBlockLanes={weekPropagatedBlockLanes}
          />
        </div>
      )}
      
      <CalendarLegend />
    </div>
  );
};

export default MonthlyCalendar;
