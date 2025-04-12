
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReservations, createManualReservation, updateManualReservation, deleteManualReservation } from '@/services/reservation';
import { getProperties } from '@/services/propertyService';
import { Reservation, Property } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, CalendarRange, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import ReservationsTable from '@/components/reservations/ReservationsTable';
import ReservationForm from '@/components/reservations/ReservationForm';
import ReservationDetails from '@/components/reservations/ReservationDetails';
import ReservationFilters from '@/components/reservations/ReservationFilters';

const ReservationsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize with today's date for startDate filter
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to beginning of day
  
  // State
  const [filters, setFilters] = useState({
    propertyId: '',
    platform: '',
    startDate: today, // Default to today's date
    endDate: null as Date | null,
    searchText: '',
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  // Queries
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getProperties,
  });
  
  const { data: allReservations = [], isLoading: isLoadingReservations } = useQuery({
    queryKey: ['reservations', filters],
    queryFn: () => {
      // Only pass non-empty values to the API
      const apiFilters: any = {};
      if (filters.propertyId && filters.propertyId !== 'all') apiFilters.propertyId = filters.propertyId;
      if (filters.platform && filters.platform !== 'all') apiFilters.platform = filters.platform;
      if (filters.startDate) apiFilters.startDate = filters.startDate;
      if (filters.endDate) apiFilters.endDate = filters.endDate;
      if (filters.searchText) apiFilters.searchText = filters.searchText;
      
      return getReservations(Object.keys(apiFilters).length > 0 ? apiFilters : undefined);
    },
  });
  
  // Property lookup map
  const propertyMap = properties.reduce<Record<string, Property>>((acc, property) => {
    acc[property.id] = property;
    return acc;
  }, {});
  
  // Mutations
  const createReservation = useMutation({
    mutationFn: createManualReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({
        title: "Reserva creada",
        description: "La reserva ha sido creada exitosamente",
      });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error al crear la reserva",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateReservation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      updateManualReservation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({
        title: "Reserva actualizada",
        description: "La reserva ha sido actualizada exitosamente",
      });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar la reserva",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteReservation = useMutation({
    mutationFn: deleteManualReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({
        title: "Reserva eliminada",
        description: "La reserva ha sido eliminada exitosamente",
      });
      setIsConfirmDeleteOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar la reserva",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handlers
  const handleOpenNewForm = () => {
    setSelectedReservation(null);
    setIsFormOpen(true);
  };
  
  const handleOpenEditForm = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsFormOpen(true);
  };
  
  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDetailsOpen(true);
  };
  
  const handleConfirmDelete = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsConfirmDeleteOpen(true);
  };
  
  const handleSubmitForm = async (formData: any) => {
    if (selectedReservation) {
      await updateReservation.mutateAsync({
        id: selectedReservation.id,
        data: formData,
      });
    } else {
      await createReservation.mutateAsync(formData);
    }
  };
  
  const handleDeleteReservation = async () => {
    if (selectedReservation) {
      await deleteReservation.mutateAsync(selectedReservation.id);
    }
  };
  
  const handleResetFilters = () => {
    setFilters({
      propertyId: '',
      platform: '',
      startDate: today, // Reset to today's date instead of null
      endDate: null,
      searchText: '',
    });
  };
  
  const isSubmitting = 
    createReservation.isPending || 
    updateReservation.isPending || 
    deleteReservation.isPending;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Reservaciones</h1>
        </div>
        <Button onClick={handleOpenNewForm}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Reserva
        </Button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        {isLoadingProperties ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-44" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        ) : (
          <ReservationFilters
            properties={properties}
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={handleResetFilters}
          />
        )}
      </div>
      
      {/* Reservations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoadingReservations ? (
          <div className="p-6 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : (
          <div>
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="font-medium">
                  {allReservations.filter(res => 
                    res.notes !== 'Blocked' && 
                    res.status !== 'Blocked'
                  ).length} reservas activas
                </h2>
              </div>
            </div>
            <ReservationsTable
              reservations={allReservations}
              properties={properties}
              onView={handleViewDetails}
              onEdit={handleOpenEditForm}
              onDelete={handleConfirmDelete}
            />
          </div>
        )}
      </div>
      
      {/* Create/Edit Reservation Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedReservation ? 'Editar Reserva' : 'Nueva Reserva'}
            </DialogTitle>
          </DialogHeader>
          <ReservationForm
            reservation={selectedReservation || undefined}
            properties={properties}
            onSubmit={handleSubmitForm}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
      
      {/* Reservation Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalles de la Reserva</SheetTitle>
          </SheetHeader>
          {selectedReservation && (
            <div className="mt-6">
              <ReservationDetails
                reservation={selectedReservation}
                property={propertyMap[selectedReservation.propertyId]}
              />
              
              {selectedReservation.source === 'Manual' && (
                <div className="mt-6 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleOpenEditForm(selectedReservation);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleConfirmDelete(selectedReservation);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Reserva</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReservation}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationsPage;
