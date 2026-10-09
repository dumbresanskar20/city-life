import { create } from "zustand";

interface MapState {
  center: [number, number];
  zoom: number;
  selectedPlaceId: number | null;
  activeLayers: string[];
  tiltActive: boolean;
  timeBucket: "morning" | "afternoon" | "evening" | "night";

  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setSelectedPlaceId: (id: number | null) => void;
  toggleLayer: (layer: string) => void;
  setTiltActive: (active: boolean) => void;
  setTimeBucket: (bucket: "morning" | "afternoon" | "evening" | "night") => void;
}

const defaultLat = parseFloat(import.meta.env.VITE_DEFAULT_LAT || "18.5204");
const defaultLng = parseFloat(import.meta.env.VITE_DEFAULT_LNG || "73.8567");
const defaultZoom = parseInt(import.meta.env.VITE_DEFAULT_ZOOM || "13", 10);

export const useMapStore = create<MapState>((set) => ({
  center: [defaultLat, defaultLng],
  zoom: defaultZoom,
  selectedPlaceId: null,
  activeLayers: ["food", "heritage", "safety"],
  tiltActive: false,
  timeBucket: "evening",

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedPlaceId: (id) => set({ selectedPlaceId: id }),
  toggleLayer: (layer) =>
    set((state) => ({
      activeLayers: state.activeLayers.includes(layer)
        ? state.activeLayers.filter((l) => l !== layer)
        : [...state.activeLayers, layer],
    })),
  setTiltActive: (tiltActive) => set({ tiltActive }),
  setTimeBucket: (timeBucket) => set({ timeBucket }),
}));
