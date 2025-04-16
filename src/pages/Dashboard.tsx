
import React from 'react';
import { Building, CalendarCheck, CalendarClock, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const Dashboard: React.FC = () => {
  const { 
    totalProperties,
    activeReservations,
    checkInsToday,
    checkOutsToday,
    propertyOccupancy
  } = useDashboardStats();
  
  const stats = [
    {
      title: 'Properties',
      value: totalProperties,
      icon: <Building className="w-5 h-5" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Reservations',
      value: activeReservations,
      icon: <CalendarClock className="w-5 h-5" />,
      color: 'bg-green-500'
    },
    {
      title: 'Check-ins Today',
      value: checkInsToday,
      icon: <CalendarCheck className="w-5 h-5" />,
      color: 'bg-amber-500'
    },
    {
      title: 'Check-outs Today',
      value: checkOutsToday,
      icon: <LogOut className="w-5 h-5" />,
      color: 'bg-purple-500'
    }
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      
      {/* Key Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <div className={`w-8 h-8 rounded-full ${stat.color} flex items-center justify-center text-white mr-2`}>
                  {stat.icon}
                </div>
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Property Occupancy */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {propertyOccupancy.map((property) => (
          <Card key={property.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {property.name}
                <span className="text-sm text-muted-foreground ml-2">
                  ({property.type || 'standalone'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(property.occupancyRate, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {property.occupancyRate.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
