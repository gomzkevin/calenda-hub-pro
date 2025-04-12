
import React from 'react';

const CalendarDayHeader: React.FC = () => {
  return (
    <>
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="text-center py-2 font-medium text-gray-600 border-b">
          {day}
        </div>
      ))}
    </>
  );
};

export default CalendarDayHeader;
