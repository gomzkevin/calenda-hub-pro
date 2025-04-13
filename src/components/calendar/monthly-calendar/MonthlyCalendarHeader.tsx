
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthlyCalendarHeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const MonthlyCalendarHeader: React.FC<MonthlyCalendarHeaderProps> = ({
  currentMonth,
  onPrevMonth,
  onNextMonth
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const calendar = document.querySelector('.monthly-calendar-container');
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
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b">
      <h2 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={onPrevMonth}
          title="Previous Month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={onNextMonth}
          title="Next Month"
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
  );
};

export default MonthlyCalendarHeader;
