
import React from 'react';
import { Building, Calendar, Link as LinkIcon, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { sampleProperties, sampleICalLinks, sampleReservations, sampleUsers } from '@/data/mockData';
import MonthlyCalendar from '@/components/calendar/MonthlyCalendar';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const properties = sampleProperties;
  const icalLinks = sampleICalLinks;
  const reservations = sampleReservations;
  const activeReservations = reservations.filter(res => new Date(res.endDate) >= new Date());
  
  const stats = [
    {
      title: 'Properties',
      value: properties.length,
      icon: <Building className="w-5 h-5" />,
      color: 'bg-blue-500',
      link: '/properties'
    },
    {
      title: 'Active Reservations',
      value: activeReservations.length,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-green-500',
      link: '/calendar'
    },
    {
      title: 'iCal Sources',
      value: icalLinks.length,
      icon: <LinkIcon className="w-5 h-5" />,
      color: 'bg-purple-500',
      link: '/ical-links'
    },
    {
      title: 'Users',
      value: sampleUsers.length,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-amber-500',
      link: '/users'
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link to="/calendar">
            <Calendar className="w-4 h-4 mr-2" />
            View Calendar
          </Link>
        </Button>
      </div>
      
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
              <div className="mt-2">
                <Button asChild variant="ghost" size="sm" className="text-blue-600 p-0 h-auto">
                  <Link to={stat.link}>
                    View All
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Reservations</CardTitle>
          <CardDescription>Calendar view of all properties</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyCalendar />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
