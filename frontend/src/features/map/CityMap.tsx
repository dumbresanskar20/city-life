import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Plus, Navigation } from "lucide-react";
import { useMapStore } from "../../store/mapStore";
import { useUserStore } from "../../store/userStore";
import { getMapTileConfig } from "../../lib/mapConfig";
import type { PlaceItem } from "../places/PlaceCard";

// Fix Leaflet's default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createCustomPin(category: string, isSelected: boolean) {
  const colors: Record<string, string> = {
    food: "#F97316",
    hotel: "#3B82F6",
    heritage: "#A855F7",
    attraction: "#10B981",
    transport: "#6366F1",
    other: "#2DD4BF",
  };

  const color = colors[category] || "#2DD4BF";
  const size = isSelected ? 36 : 28;

  return L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
      ">
        <div style="
          width: ${size / 2.6}px;
          height: ${size / 2.6}px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function MapController({ selectedPlace }: { selectedPlace?: PlaceItem | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPlace) {
      map.flyTo([selectedPlace.lat, selectedPlace.lng], 15, { duration: 0.8 });
    }
  }, [selectedPlace, map]);

  return null;
}

export interface CityMapProps {
  places: PlaceItem[];
  selectedPlaceId: number | null;
  onSelectPlace: (id: number) => void;
  onNavigatePlace?: (place: PlaceItem) => void;
  onOpenReportModal: () => void;
  className?: string;
}

export const CityMap: React.FC<CityMapProps> = ({
  places,
  selectedPlaceId,
  onSelectPlace,
  onNavigatePlace,
  onOpenReportModal,
  className,
}) => {
  const { center, zoom, tiltActive, setTiltActive } = useMapStore();
  const theme = useUserStore((s) => s.theme);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId);
  const tileConfig = getMapTileConfig(theme === "light" ? "light" : "dark");

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${
        tiltActive ? "map-tilt-active" : ""
      } ${className || ""}`}
    >
      <div className="w-full h-full leaflet-stage">
        <MapContainer center={center} zoom={zoom} zoomControl={false} className="w-full h-full z-0">
          <TileLayer
            attribution={tileConfig.attribution}
            url={tileConfig.url}
            maxZoom={tileConfig.maxZoom}
          />
          <MapController selectedPlace={selectedPlace} />

          {places.map((place) => {
            const isSelected = place.id === selectedPlaceId;
            return (
              <Marker
                key={place.id}
                position={[place.lat, place.lng]}
                icon={createCustomPin(place.category, isSelected)}
                eventHandlers={{
                  click: () => onSelectPlace(place.id),
                }}
              >
                <Popup className="citycompass-popup">
                  <div className="p-2 space-y-1.5 min-w-[150px]">
                    <h4 className="font-bold text-xs text-text-1">{place.name}</h4>
                    <p className="text-[10px] text-text-3 capitalize">{place.category}</p>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-glass-border">
                      <span className="font-bold text-primary">Score: {Math.round(place.overall_score)}%</span>
                      <span className="font-mono text-text-2">{"₹".repeat(place.price_level || 1)}</span>
                    </div>
                    {onNavigatePlace && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigatePlace(place);
                        }}
                        className="w-full mt-1.5 py-1 px-2 text-[10px] font-bold rounded-md bg-primary text-bg-0 hover:opacity-90 flex items-center justify-center gap-1 cursor-pointer transition-opacity"
                      >
                        <Navigation className="w-3 h-3 fill-current" />
                        <span>Get Directions</span>
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setTiltActive(!tiltActive)}
          title="Toggle 3D Perspective Tilt"
          className={`p-2.5 rounded-xl border backdrop-blur-md shadow-md transition-all cursor-pointer ${
            tiltActive
              ? "bg-primary text-bg-0 border-primary font-bold shadow-primary/30"
              : "bg-bg-1/80 text-text-2 border-glass-border hover:text-text-1"
          }`}
        >
          <Box className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button
          type="button"
          onClick={onOpenReportModal}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-bg-0 font-bold text-xs shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Report an Issue</span>
        </button>
      </div>
    </div>
  );
};
