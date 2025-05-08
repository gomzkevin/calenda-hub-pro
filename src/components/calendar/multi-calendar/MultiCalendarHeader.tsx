
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface MultiCalendarHeaderProps {
  startDate: Date;
  endDate: Date;
  goForward: () => void;
  goBackward: () => void;
}

const MultiCalendarHeader: React.FC<MultiCalendarHeaderProps> = ({
  startDate,
  endDate,
  goForward,
  goBackward
}) => {
  // Format the date range for display
  const dateRangeText = React.useMemo(() => {
    const startMonth = format(startDate, 'MMMM');
    const endMonth = format(endDate, 'MMMM');
    const startYear = format(startDate, 'yyyy');
    const endYear = format(endDate, 'yyyy');
    
    if (startMonth === endMonth && startYear === endYear) {
      // Same month and year
      return `${startMonth} ${startYear}`;
    } else if (startYear === endYear) {
      // Same year, different months
      return `${startMonth} - ${endMonth} ${startYear}`;
    } else {
      // Different years
      return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
    }
  }, [startDate, endDate]);

  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
      <h2 className="text-xl font-semibold text-gray-800">{dateRangeText}</h2>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={goBackward}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={goForward}
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MultiCalendarHeader;
