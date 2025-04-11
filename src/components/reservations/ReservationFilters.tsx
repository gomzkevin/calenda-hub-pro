
import React from 'react';
import { format } from 'date-fns';
import { Property, Platform } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

interface FilterValues {
  propertyId: string;
  platform: string;
  startDate: Date | null;
  endDate: Date | null;
  searchText: string;
}

interface ReservationFiltersProps {
  properties: Property[];
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  onResetFilters: () => void;
}

const ReservationFilters: React.FC<ReservationFiltersProps> = ({
  properties,
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  // Count active filters
  const activeFilterCount = [
    filters.propertyId,
    filters.platform,
    filters.startDate,
    filters.endDate,
    filters.searchText
  ].filter(Boolean).length;

  const handlePropertyChange = (value: string) => {
    onFilterChange({ ...filters, propertyId: value });
  };

  const handlePlatformChange = (value: string) => {
    onFilterChange({ ...filters, platform: value });
  };

  const handleStartDateChange = (date: Date | null) => {
    onFilterChange({ ...filters, startDate: date });
  };

  const handleEndDateChange = (date: Date | null) => {
    onFilterChange({ ...filters, endDate: date });
  };

  const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchText: e.target.value });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-lg font-medium flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </h2>
        
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Property filter */}
        <div>
          <Select
            value={filters.propertyId}
            onValueChange={handlePropertyChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Alojamiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los alojamientos</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Platform filter */}
        <div>
          <Select
            value={filters.platform}
            onValueChange={handlePlatformChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las plataformas</SelectItem>
              <SelectItem value="Airbnb">Airbnb</SelectItem>
              <SelectItem value="Booking">Booking</SelectItem>
              <SelectItem value="Vrbo">Vrbo</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
              <SelectItem value="Other">Otra</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Start date filter */}
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? (
                  format(filters.startDate, "PPP")
                ) : (
                  "Desde fecha"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.startDate || undefined}
                onSelect={handleStartDateChange}
                initialFocus
              />
              {filters.startDate && (
                <div className="p-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartDateChange(null)}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
        
        {/* End date filter */}
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? (
                  format(filters.endDate, "PPP")
                ) : (
                  "Hasta fecha"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.endDate || undefined}
                onSelect={handleEndDateChange}
                initialFocus
              />
              {filters.endDate && (
                <div className="p-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEndDateChange(null)}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Search input */}
        <div>
          <div className="relative">
            <Input
              placeholder="Buscar por huésped..."
              value={filters.searchText}
              onChange={handleSearchTextChange}
              className="w-full"
            />
            {filters.searchText && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onFilterChange({ ...filters, searchText: '' })}
                className="absolute right-0 top-0 h-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationFilters;
