import React, { useState, useMemo } from 'react';
import { addMonths } from 'date-fns';
import { Reservation } from '@/types';
import { getReservationsForMonth, getReservationsForProperty } from '@/services/reservation';
import { useQuery } from '@tanstack/react-query';
import { 
  calculateReservationLanes, 
  calculateBlockLanes 
} from './utils/calendarUtils';
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
  
  // Use React Query to fetch reservations
  const { data: allReservations = [], isLoading } = useQuery({
    queryKey: ['reservations', currentMonth.getMonth() + 1, currentMonth.getFullYear(), propertyId],
    queryFn: async () => {
      if (propertyId) {
        console.log('Fetching reservations for property:', propertyId);
        const allReservations = await getReservationsForProperty(propertyId);
        console.log('Got reservations:', allReservations);
        return allReservations.filter(res => {
          const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
          const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
          
          return (res.startDate <= monthEnd && res.endDate >= monthStart);
        });
      } else {
        return getReservationsForMonth(
          currentMonth.getMonth() + 1, 
          currentMonth.getFullYear()
        );
      }
    }
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
    
    // Check each reservation for relationship block flag
    console.log('Normalized reservations:', normalizedReservations);
    
    // Filter out blocked reservations (but keep sourceReservationId blocks for separate display)
    const blockedReservations = normalizedReservations.filter(res => 
      res.sourceReservationId && (res.notes === 'Blocked' || res.status === 'Blocked')
    );
    
    // Identify relationship blocks (parent-child blocks)
    const relatedBlocks = normalizedReservations.filter(res => 
      res.isRelationshipBlock === true
    );
    
    console.log('Related blocks:', relatedBlocks);
    
    // Filter valid reservations (not blocked or relationship blocks)
    const validReservations = normalizedReservations.filter(res => 
      res.notes !== 'Blocked' && 
      res.status !== 'Blocked' && 
      !res.isRelationshipBlock
    );
    
    return {
      filteredReservations: validReservations,
      propagatedBlocks: blockedReservations,
      relationshipBlocks: relatedBlocks
    };
  }, [allReservations]);
  
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
