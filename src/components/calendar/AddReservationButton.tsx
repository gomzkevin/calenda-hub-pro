import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProperties } from '@/services/propertyService';
import { createManualReservation } from '@/services/reservation'; 
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReservationForm from '@/components/reservations/ReservationForm';
import { Platform } from '@/types';

interface AddReservationButtonProps {
  initialDate?: Date;
  propertyId?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const AddReservationButton: React.FC<AddReservationButtonProps> = ({
  initialDate,
  propertyId,
  className,
  size = 'default',
  variant = 'default',
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
  });

  const createReservation = useMutation({
    mutationFn: createManualReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({
        title: "Reserva creada",
        description: "La reserva ha sido creada exitosamente",
      });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error al crear la reserva",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleButtonClick = () => {
    setIsOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    await createReservation.mutateAsync(formData);
  };

  return (
    <>
      <Button
        onClick={handleButtonClick}
        className={className}
        size={size}
        variant={variant}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nueva Reserva
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nueva Reserva</DialogTitle>
          </DialogHeader>
          {isLoadingProperties ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ReservationForm
              properties={properties}
              onSubmit={handleSubmit}
              onCancel={() => setIsOpen(false)}
              isSubmitting={createReservation.isPending}
              reservation={
                initialDate || propertyId
                  ? {
                      id: '',
                      propertyId: propertyId || '',
                      startDate: initialDate || null,
                      endDate: null,
                      platform: 'Manual' as Platform,
                      source: 'Manual',
                      status: 'Reserved',
                      guestName: '',
                      guestCount: 1,
                      createdAt: new Date(),
                    }
                  : undefined
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddReservationButton;
