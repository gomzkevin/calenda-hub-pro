
import React, { useState, useEffect } from 'react';
import { format, addDays, differenceInCalendarDays } from 'date-fns';
import { Reservation, Property, ReservationStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { checkAvailability, getReservationsForMonth } from '@/services/reservation/queries'; 
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';

interface ReservationFormProps {
  reservation?: Reservation;
  properties: Property[];
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ReservationForm: React.FC<ReservationFormProps> = ({
  reservation,
  properties,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    propertyId: reservation?.propertyId || '',
    startDate: reservation?.startDate || null,
    endDate: reservation?.endDate || null,
    guestName: reservation?.guestName || '',
    guestCount: reservation?.guestCount || 1,
    contactInfo: reservation?.contactInfo || '',
    status: reservation?.status || 'Reserved',
    notes: reservation?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const nights = formData.startDate && formData.endDate 
    ? differenceInCalendarDays(formData.endDate, formData.startDate) 
    : 0;

  // Fetch reservations for the current month to determine unavailable dates
  useEffect(() => {
    if (formData.propertyId) {
      const fetchReservations = async () => {
        try {
          const month = currentMonth.getMonth() + 1;
          const year = currentMonth.getFullYear();
          const reservations = await getReservationsForMonth(month, year);
          
          // Filter reservations for the selected property
          const propertyReservations = reservations.filter(
            res => res.propertyId === formData.propertyId && 
                  (res.id !== reservation?.id) // Exclude current reservation if editing
          );
          
          // Create array of unavailable dates
          const blockedDates: Date[] = [];
          
          propertyReservations.forEach(res => {
            // Add all dates from start to end (exclusive of end date)
            const start = new Date(res.startDate);
            const end = new Date(res.endDate);
            
            let current = new Date(start);
            while (current < end) {
              blockedDates.push(new Date(current));
              current.setDate(current.getDate() + 1);
            }
          });
          
          setUnavailableDates(blockedDates);
        } catch (error) {
          console.error('Error fetching reservations:', error);
        }
      };
      
      fetchReservations();
    }
  }, [formData.propertyId, currentMonth, reservation?.id]);

  useEffect(() => {
    if (formData.propertyId && formData.startDate && formData.endDate) {
      setIsCheckingAvailability(true);
      checkAvailability(
        formData.propertyId,
        formData.startDate,
        formData.endDate,
        reservation?.id
      )
        .then(available => {
          setIsAvailable(available);
          if (!available) {
            setErrors(prev => ({
              ...prev,
              availability: "Las fechas seleccionadas se solapan con una reserva existente"
            }));
          } else {
            setErrors(prev => {
              const newErrors = {...prev};
              delete newErrors.availability;
              return newErrors;
            });
          }
        })
        .catch(err => {
          console.error("Error checking availability:", err);
          setErrors(prev => ({
            ...prev,
            availability: "Error al verificar disponibilidad"
          }));
          setIsAvailable(false); // Set to false when error occurs
        })
        .finally(() => setIsCheckingAvailability(false));
    }
  }, [formData.propertyId, formData.startDate, formData.endDate, reservation?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.propertyId) newErrors.propertyId = "Selecciona una propiedad";
    if (!formData.startDate) newErrors.startDate = "Selecciona fecha de check-in";
    if (!formData.endDate) newErrors.endDate = "Selecciona fecha de check-out";
    if (!formData.guestName) newErrors.guestName = "Ingresa el nombre del huésped";
    
    if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = "La fecha de check-out debe ser posterior a la fecha de check-in";
    }
    
    if (!isAvailable) {
      newErrors.availability = "Las fechas seleccionadas se solapan con una reserva existente";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit form
    onSubmit(formData);
  };

  // Function to handle month change in the calendar
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  // Function to check if a date should be disabled
  const isDateDisabled = (date: Date): boolean => {
    return unavailableDates.some(unavailableDate => 
      date.getDate() === unavailableDate.getDate() &&
      date.getMonth() === unavailableDate.getMonth() &&
      date.getFullYear() === unavailableDate.getFullYear()
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="propertyId">Alojamiento *</Label>
          <Select
            value={formData.propertyId}
            onValueChange={(value) => setFormData({...formData, propertyId: value})}
          >
            <SelectTrigger className={errors.propertyId ? "border-red-500" : ""}>
              <SelectValue placeholder="Selecciona una propiedad" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.propertyId && <p className="text-sm text-red-500">{errors.propertyId}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Estado *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({...formData, status: value as ReservationStatus})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Reserved">Reservado</SelectItem>
              <SelectItem value="Blocked">Bloqueado</SelectItem>
              <SelectItem value="Tentative">Tentativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Fecha de Check-in *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.startDate && "text-muted-foreground",
                  errors.startDate && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? format(formData.startDate, "PPP") : <span>Selecciona una fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.startDate || undefined}
                onSelect={(date) => date && setFormData({...formData, startDate: date})}
                disabled={isDateDisabled}
                onMonthChange={handleMonthChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Fecha de Check-out *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.endDate && "text-muted-foreground",
                  errors.endDate && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.endDate ? format(formData.endDate, "PPP") : <span>Selecciona una fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.endDate || undefined}
                onSelect={(date) => date && setFormData({...formData, endDate: date})}
                disabled={isDateDisabled}
                onMonthChange={handleMonthChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
        </div>

        {nights > 0 && (
          <div className="col-span-2">
            <p className="text-sm text-muted-foreground">
              {nights} {nights === 1 ? 'noche' : 'noches'} de estancia
            </p>
          </div>
        )}
        
        {errors.availability && (
          <div className="col-span-2">
            <p className="text-sm text-red-500">{errors.availability}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="guestName">Nombre del Huésped *</Label>
          <Input
            id="guestName"
            value={formData.guestName}
            onChange={(e) => setFormData({...formData, guestName: e.target.value})}
            className={errors.guestName ? "border-red-500" : ""}
          />
          {errors.guestName && <p className="text-sm text-red-500">{errors.guestName}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="guestCount">Número de Huéspedes</Label>
          <Input
            id="guestCount"
            type="number"
            min="1"
            value={formData.guestCount}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setFormData({...formData, guestCount: isNaN(value) ? 1 : value});
            }}
          />
        </div>
        
        <div className="col-span-2 space-y-2">
          <Label htmlFor="contactInfo">Información de Contacto</Label>
          <Input
            id="contactInfo"
            value={formData.contactInfo}
            onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
            placeholder="Email o teléfono"
          />
        </div>
        
        <div className="col-span-2 space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows={3}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isCheckingAvailability || !isAvailable}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : isCheckingAvailability ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando disponibilidad...
            </>
          ) : (
            'Guardar Reserva'
          )}
        </Button>
      </div>
    </form>
  );
};

export default ReservationForm;
