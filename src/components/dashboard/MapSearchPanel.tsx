import { useState, useRef, useCallback } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";
import { useToast } from "@/hooks/use-toast";

const GOOGLE_MAPS_API_KEY = "";

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "400px",
  borderRadius: "0.5rem"
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

export function MapSearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { toast } = useToast();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMarker(pos);
          map?.panTo(pos);
          map?.setZoom(12);
          toast({
            title: "Location found",
            description: "Map centered on your current location"
          });
        },
        () => {
          toast({
            title: "Error",
            description: "Unable to retrieve your location",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive"
      });
    }
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const pos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setMarker(pos);
        map?.panTo(pos);
        map?.setZoom(14);
        setSearchQuery(place.formatted_address || place.name || "");
      }
    }
  };

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  if (loadError) {
    return (
      <Card className="p-6 h-full flex flex-col gap-4">
        <div className="flex-1 bg-destructive/10 rounded-lg flex items-center justify-center min-h-[400px]">
          <div className="text-center text-destructive">
            <p>Error loading maps</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="p-6 h-full flex flex-col gap-4">
        <div className="flex-1 bg-muted rounded-lg flex items-center justify-center min-h-[400px]">
          <div className="text-center text-muted-foreground">
            <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin" />
            <p>Loading maps...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 h-full flex flex-col gap-4">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
          >
            <Input
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </Autocomplete>
        </div>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={handleUseLocation}
        >
          <MapPin className="mr-2 h-4 w-4" />
          Use My Location
        </Button>
      </div>

      <div className="flex-1 rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={marker || defaultCenter}
          zoom={marker ? 12 : 10}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {marker && <Marker position={marker} />}
        </GoogleMap>
      </div>
    </Card>
  );
}
