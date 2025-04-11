
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  ImageIcon, 
  CalendarIcon, 
  Building2, 
  HomeIcon,
  BedDouble,
  Bath,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getPropertyById, sampleICalLinks } from '@/data/mockData';
import ICalLinkCard from '@/components/ical/ICalLinkCard';

const icalFormSchema = z.object({
  platform: z.string().min(1, { message: 'Please select a platform' }),
  url: z.string().url({ message: 'Please enter a valid URL' }),
});

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const property = getPropertyById(id || '');
  const propertyIcalLinks = sampleICalLinks.filter(link => link.propertyId === id);
  
  const form = useForm<z.infer<typeof icalFormSchema>>({
    resolver: zodResolver(icalFormSchema),
    defaultValues: {
      platform: '',
      url: '',
    },
  });
  
  const onSubmit = (values: z.infer<typeof icalFormSchema>) => {
    // Here you would normally save to the database
    toast.success('Calendar link added successfully');
    setIsDialogOpen(false);
    form.reset();
  };
  
  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h1 className="text-2xl font-bold mb-4">Property not found</h1>
        <Button onClick={() => navigate('/properties')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Properties
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/properties')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{property.name}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Property Images */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Property Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-secondary flex items-center justify-center rounded-md">
                {property.imageUrl ? (
                  <img 
                    src={property.imageUrl} 
                    alt={property.name} 
                    className="h-full w-full object-cover rounded-md"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Property Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Type</h3>
                  <p className="text-muted-foreground">{property.type}</p>
                </div>
                <div>
                  <h3 className="font-medium">Address</h3>
                  <p className="text-muted-foreground">{property.address}</p>
                </div>
                <div>
                  <h3 className="font-medium">Bedrooms</h3>
                  <p className="text-muted-foreground flex items-center">
                    <BedDouble className="w-4 h-4 mr-1" />
                    {property.bedrooms}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Bathrooms</h3>
                  <p className="text-muted-foreground flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    {property.bathrooms}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Capacity</h3>
                  <p className="text-muted-foreground flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {property.capacity} guests
                  </p>
                </div>
              </div>
              {property.description && (
                <div className="mt-4">
                  <h3 className="font-medium">Description</h3>
                  <p className="text-muted-foreground">{property.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Calendar Links */}
        <div>
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Calendar Links
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Calendar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Calendar Link</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Platform</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a platform" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Airbnb">Airbnb</SelectItem>
                                <SelectItem value="Booking">Booking.com</SelectItem>
                                <SelectItem value="VRBO">VRBO</SelectItem>
                                <SelectItem value="Manual">Manual</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>iCal URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/calendar.ics" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit">Add Calendar</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {propertyIcalLinks.length > 0 ? (
                <div className="space-y-4">
                  {propertyIcalLinks.map((icalLink) => (
                    <ICalLinkCard key={icalLink.id} icalLink={icalLink} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium">No Calendar Links</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Add calendar links from platforms like Airbnb, Booking.com, or VRBO
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
