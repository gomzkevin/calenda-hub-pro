
import React from 'react';
import { format, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MultiCalendarHeaderProps {
  startDate: Date;
  visibleDays: Date[];
  onPrev: () => void;
  onNext: () => void;
}

const MultiCalendarHeader: React.FC<MultiCalendarHeaderProps> = ({
  startDate,
  visibleDays,
  onPrev,
  onNext
}) => {
  const getDateRangeDisplay = () => {
    if (visibleDays.length === 0) return '';
    
    const firstDay = visibleDays[0];
    const lastDay = visibleDays[visibleDays.length - 1];
    
    if (firstDay.getMonth() === lastDay.getMonth()) {
      return `${format(firstDay, 'MMMM yyyy')} (${format(firstDay, 'd')}-${format(lastDay, 'd')})`;
    }
    
    return `${format(firstDay, 'MMMM d')} - ${format(lastDay, 'MMMM d, yyyy')}`;
  };

  return (
    <div className="sticky top-0 z-30 bg-white border-b">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-xl font-semibold">{getDateRangeDisplay()}</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={onPrev}
            title="Previous 15 Days"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={onNext}
            title="Next 15 Days"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MultiCalendarHeader;
