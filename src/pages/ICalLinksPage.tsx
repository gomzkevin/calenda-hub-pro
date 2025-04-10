
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sampleICalLinks } from '@/data/mockData';
import ICalLinkCard from '@/components/ical/ICalLinkCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ICalLinksPage: React.FC = () => {
  const icalLinks = sampleICalLinks;
  
  const platformLinks = {
    Airbnb: icalLinks.filter(link => link.platform === 'Airbnb'),
    Booking: icalLinks.filter(link => link.platform === 'Booking'),
    VRBO: icalLinks.filter(link => link.platform === 'VRBO'),
    Other: icalLinks.filter(link => !['Airbnb', 'Booking', 'VRBO'].includes(link.platform))
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">iCal Links</h1>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search links..."
              className="w-full"
            />
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add iCal Link
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({icalLinks.length})</TabsTrigger>
          <TabsTrigger value="airbnb">Airbnb ({platformLinks.Airbnb.length})</TabsTrigger>
          <TabsTrigger value="booking">Booking ({platformLinks.Booking.length})</TabsTrigger>
          <TabsTrigger value="vrbo">VRBO ({platformLinks.VRBO.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {icalLinks.map((icalLink) => (
              <ICalLinkCard key={icalLink.id} icalLink={icalLink} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="airbnb">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {platformLinks.Airbnb.map((icalLink) => (
              <ICalLinkCard key={icalLink.id} icalLink={icalLink} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="booking">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {platformLinks.Booking.map((icalLink) => (
              <ICalLinkCard key={icalLink.id} icalLink={icalLink} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="vrbo">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {platformLinks.VRBO.map((icalLink) => (
              <ICalLinkCard key={icalLink.id} icalLink={icalLink} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ICalLinksPage;
