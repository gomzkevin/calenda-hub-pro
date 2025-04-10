
import React from 'react';
import { ExternalLink, Trash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ICalLink } from '@/types';
import { getPropertyById } from '@/data/mockData';

interface ICalLinkCardProps {
  icalLink: ICalLink;
}

const ICalLinkCard: React.FC<ICalLinkCardProps> = ({ icalLink }) => {
  const property = getPropertyById(icalLink.propertyId);
  
  const refreshICalLink = () => {
    // This would call an API to refresh the iCal data
    alert('Refreshing iCal data...');
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 bg-platform-${icalLink.platform.toLowerCase()}`} />
          {icalLink.platform}
        </CardTitle>
        <div className="text-sm font-medium">{property?.name}</div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm truncate text-gray-500" title={icalLink.url}>
          {icalLink.url}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Added on {new Date(icalLink.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open(icalLink.url, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Open URL
        </Button>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={refreshICalLink}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ICalLinkCard;
