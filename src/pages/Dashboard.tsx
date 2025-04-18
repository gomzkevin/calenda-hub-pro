import React from 'react';
import { useReservationGroups } from '@/hooks/useReservationGroups';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DoorClosed, DoorOpen, Clock, Home, Calendar, BellDot } from 'lucide-react';
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
      color: 'bg-alanto-forest',
      emptyMessage: 'No hay salidas hoy',
      details: reservationGroups.checkingOut.map(res => ({
        propertyName: propertyOccupancy.find(p => p.id === res.propertyId)?.name || 'Alojamiento'
      }))
    },
    {
      title: 'Llegan hoy',
      value: reservationGroups.checkingIn.length,
      icon: <DoorOpen className="w-5 h-5" />,
      color: 'bg-alanto-forest-light',
      emptyMessage: 'No hay llegadas hoy',
      details: reservationGroups.checkingIn.map(res => ({
        propertyName: propertyOccupancy.find(p => p.id === res.propertyId)?.name || 'Alojamiento'
      }))
    },
    {
      title: 'Terminan mañana',
      value: reservationGroups.checkingOutTomorrow.length,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-alanto-amber',
      details: reservationGroups.checkingOutTomorrow.map(res => ({
        propertyName: propertyOccupancy.find(p => p.id === res.propertyId)?.name || 'Alojamiento'
      }))
    },
    {
      title: 'En curso',
      value: reservationGroups.active.length,
      icon: <Home className="w-5 h-5" />,
      color: 'bg-alanto-amber-dark',
      details: reservationGroups.active.map(res => ({
        propertyName: propertyOccupancy.find(p => p.id === res.propertyId)?.name || 'Alojamiento'
      }))
    },
    {
      title: 'Empiezan mañana',
      value: reservationGroups.checkingInTomorrow.length,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-alanto-forest-light',
      emptyMessage: 'No hay llegadas mañana',
      details: reservationGroups.checkingInTomorrow.map(res => ({
        propertyName: propertyOccupancy.find(p => p.id === res.propertyId)?.name || 'Alojamiento'
      }))
    },
    {
      title: 'Próximas reservas',
      value: reservationGroups.upcoming.length,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-alanto-forest'
    }
  ];
  
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario';
  
  return (
    <div className="space-y-6 bg-alanto-cream min-h-screen p-6">
      <div>
        <h1 className="text-2xl font-bold text-alanto-forest">
          Te damos la Bienvenida, {userName}
        </h1>
      </div>
      
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
              <div className="flex items-start space-x-3">
                <div className="text-3xl font-bold text-alanto-forest-dark">
                  {stat.value}
                </div>
                {stat.details && (
                  <div className="pt-1.5">
                    {stat.value === 0 && stat.emptyMessage ? (
                      <p className="text-sm text-alanto-forest-light italic">
                        {stat.emptyMessage}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {stat.details.map((detail, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <BellDot className="w-3 h-3 text-alanto-forest-light" />
                            <span className="text-sm text-alanto-forest-light">
                              {detail.propertyName}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4 text-alanto-forest">
          Desempeño de alojamientos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {propertyOccupancy.map((property) => (
            <Card key={property.id} className="border-none shadow-md bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-alanto-forest">
                  {property.name}
                  <span className="text-sm text-muted-foreground ml-2">
                    ({property.type || 'standalone'})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-alanto-forest-pale rounded-full">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(property.occupancyRate, 100)}%`,
                        backgroundColor: property.occupancyRate >= 75 ? '#2d4c1c' : // Verde Bosque
                                      property.occupancyRate >= 50 ? '#eaa934' : // Ámbar Dorado
                                      property.occupancyRate >= 25 ? '#f2bc5e' : // Ámbar Claro
                                      '#d0d0d0' // Gris Medio
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-alanto-forest">
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
