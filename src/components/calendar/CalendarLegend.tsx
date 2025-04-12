
import React from 'react';

const CalendarLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-3 mt-4 p-4 border-t">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
        <span className="text-xs">Booking</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-400"></div>
        <span className="text-xs">Airbnb</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
        <span className="text-xs">Vrbo</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="text-xs">Manual</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
        <span className="text-xs">Bloqueado (Parent/Child)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-12 bg-gray-300 border border-dashed border-gray-500 rounded-full"></div>
        <span className="text-xs">Otro bloqueo</span>
      </div>
    </div>
  );
};

export default CalendarLegend;
