
import React from 'react';

export interface CalendarLegendItem {
  color: string;
  label: string;
  isDashed?: boolean;
}

interface CalendarLegendProps {
  items?: CalendarLegendItem[];
  className?: string;
}

const DEFAULT_LEGEND_ITEMS: CalendarLegendItem[] = [
  { color: 'bg-blue-500', label: 'Booking' },
  { color: 'bg-red-400', label: 'Airbnb' },
  { color: 'bg-purple-500', label: 'Vrbo' },
  { color: 'bg-green-500', label: 'Manual' },
  { color: 'bg-amber-400', label: 'Bloqueado (Parent/Child)' },
  { color: 'bg-gray-300', label: 'Otro bloqueo', isDashed: true }
];

const CalendarLegend: React.FC<CalendarLegendProps> = ({ 
  items = DEFAULT_LEGEND_ITEMS,
  className = '' 
}) => {
  return (
    <div className={`flex flex-wrap gap-3 mt-4 p-4 border-t ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {item.isDashed ? (
            <div className={`h-3 w-12 ${item.color} border border-dashed border-gray-500 rounded-full`}></div>
          ) : (
            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
          )}
          <span className="text-xs">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default CalendarLegend;
