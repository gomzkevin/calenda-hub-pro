
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface PropertyICalExportProps {
  propertyId: string;
  propertyName: string;
}

const PropertyICalExport = ({ propertyId, propertyName }: PropertyICalExportProps) => {
  const icalUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ical?propertyId=${propertyId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(icalUrl);
      toast.success('URL copiada al portapapeles');
    } catch (err) {
      toast.error('Error al copiar URL');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Exportar Reservas Manuales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use esta URL para sincronizar las reservas manuales de {propertyName} en otras plataformas:
          </p>
          <div className="flex gap-2">
            <Input
              value={icalUrl}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyICalExport;
