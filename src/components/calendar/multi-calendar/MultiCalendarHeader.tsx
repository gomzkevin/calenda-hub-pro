
import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const getDateRangeDisplay = () => {
    if (visibleDays.length === 0) return '';
    
    const firstDay = visibleDays[0];
    const lastDay = visibleDays[visibleDays.length - 1];
    
    if (firstDay.getMonth() === lastDay.getMonth()) {
      return `${format(firstDay, 'MMMM yyyy')} (${format(firstDay, 'd')}-${format(lastDay, 'd')})`;
    }
    
    return `${format(firstDay, 'MMMM d')} - ${format(lastDay, 'MMMM d, yyyy')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const calendar = document.querySelector('.multi-calendar-container');
      if (calendar) {
        calendar.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change events
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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

          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MultiCalendarHeader;
