
import React from 'react';
import { useReservationGroups } from '@/hooks/useReservationGroups';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DoorClosed, DoorOpen, Clock, Home, Calendar } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const reservationGroups = useReservationGroups();
  const { propertyOccupancy } = useDashboardStats();
  
  const stats = [
    {
      title: 'Salen hoy',
      value: reservationGroups.checkingOut.length,
      icon: <DoorClosed className="w-5 h-5" />,
      color: 'bg-alanto-forest'
    },
    {
      title: 'Llegan hoy',
      value: reservationGroups.checkingIn.length,
      icon: <DoorOpen className="w-5 h-5" />,
      color: 'bg-alanto-forest-light'
    },
    {
      title: 'Terminan pronto',
      value: reservationGroups.checkingOutTomorrow.length,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-alanto-amber'
    },
    {
      title: 'En curso',
      value: reservationGroups.active.length,
      icon: <Home className="w-5 h-5" />,
      color: 'bg-alanto-amber-dark'
    },
    {
      title: 'Empiezan pronto',
      value: reservationGroups.checkingInTomorrow.length,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-alanto-forest-light'
    },
    {
      title: 'Próximas reservas',
      value: reservationGroups.upcoming.length,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-alanto-forest'
    }
  ];
  
  return (
    <div className="space-y-6 bg-alanto-cream min-h-screen p-6">
      <div>
        <h1 className="text-2xl font-bold text-alanto-forest">
          Te damos la Bienvenida, {user?.name || 'Usuario'}
        </h1>
      </div>
      
      {/* Reservation Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-none shadow-md bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${stat.color} flex items-center justify-center text-white`}>
                  {stat.icon}
                </div>
                <span className="text-alanto-forest">{stat.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-alanto-forest-dark">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Property Performance Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-alanto-forest">
          Desempeño de alojamientos
        </h2>
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
    </div>
  );
};

export default Dashboard;
