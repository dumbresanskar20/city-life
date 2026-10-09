import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Clock,
  Shield,
  Play,
  Square,
  Share2,
  Navigation,
  MapPin,
  ArrowUpDown,
  Crosshair,
  ExternalLink,
  Compass,
  X,
  ListOrdered,
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Slider } from "../components/Toggle";
import { Skeleton } from "../components/Skeleton";
import { RiskProfileChart } from "../features/routing/RiskProfileChart";
import { useUserStore } from "../store/userStore";
import { useToastStore } from "../store/toastStore";
import { api } from "../lib/api";
import { getMapTileConfig } from "../lib/mapConfig";

// Popular Pune Route Presets
const POPULAR_PRESETS = [
  {
    name: "KP to FC Road (Nightlife)",
    origin: [18.5362, 73.8885] as [number, number],
    originName: "Koregaon Park (North Main Rd)",
    destination: [18.5222, 73.8407] as [number, number],
    destinationName: "FC Road, Deccan",
    desc: "Late-night corridor through illuminated junctions",
  },
  {
    name: "Swargate to Shaniwar Wada",
    origin: [18.5018, 73.8586] as [number, number],
    originName: "Swargate Transit Hub",
    destination: [18.5196, 73.8553] as [number, number],
    destinationName: "Shaniwar Wada",
    desc: "Historic central spine via Bajirao Road",
  },
  {
    name: "Airport to Shivajinagar",
    origin: [18.5822, 73.9197] as [number, number],
    originName: "Pune International Airport",
    destination: [18.5322, 73.8492] as [number, number],
    destinationName: "Shivajinagar Metro Station",
    desc: "Airport arterial road with grade separators",
  },
  {
    name: "Kothrud to Hinjawadi IT Park",
    origin: [18.5074, 73.8077] as [number, number],
    originName: "Kothrud (Chandani Chowk)",
    destination: [18.5913, 73.7389] as [number, number],
    destinationName: "Hinjawadi Phase 1 IT Hub",
    desc: "Expressway link to western tech corridor",
  },
  {
    name: "Viman Nagar to Phoenix Mall",
    origin: [18.5679, 73.9143] as [number, number],
    originName: "Viman Nagar",
    destination: [18.5622, 73.9168] as [number, number],
    destinationName: "Phoenix Marketcity Pune",
    desc: "Short commercial retail corridor",
  },
];

// Custom Leaflet Icons for Start, End, and Animation
const startPinIcon = L.divIcon({
  className: "custom-start-pin",
  html: `<div style="background-color: #10B981; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(16,185,129,0.5);"><span style="transform: rotate(45deg); color: white; font-size: 11px; font-weight: 800;">A</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const endPinIcon = L.divIcon({
  className: "custom-end-pin",
  html: `<div style="background-color: #EF4444; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(239,68,68,0.5);"><span style="transform: rotate(45deg); color: white; font-size: 11px; font-weight: 800;">B</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const simVehicleIcon = L.divIcon({
  className: "custom-vehicle-pin",
  html: `<div style="background-color: #06B6D4; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 14px #06B6D4; animation: pulse 1.5s infinite;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Component to dynamically fit map bounds to Origin and Destination
function MapAutoFitter({
  origin,
  destination,
  geometry,
}: {
  origin: [number, number];
  destination: [number, number];
  geometry?: [number, number][];
}) {
  const map = useMap();
  useEffect(() => {
    if (!origin || !destination) return;
    try {
      if (geometry && geometry.length > 2) {
        const bounds = L.latLngBounds(geometry.map((pt) => L.latLng(pt[0], pt[1])));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else {
        const bounds = L.latLngBounds([origin, destination]);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
    } catch {
      // Map may not be ready
    }
  }, [map, origin[0], origin[1], destination[0], destination[1], geometry]);

  return null;
}

// Map Click Listener to pick location directly on map
function MapPickListener({
  mode,
  onPick,
}: {
  mode: "origin" | "destination" | null;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (mode) {
        onPick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export const RoutePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { theme, safetyPriority } = useUserStore();
  const addToast = useToastStore((s) => s.addToast);

  // Parse query params if user clicked "Get Directions" anywhere on website
  const queryDestLat = searchParams.get("dest_lat");
  const queryDestLng = searchParams.get("dest_lng");
  const queryDestName = searchParams.get("dest_name");
  const queryOriginLat = searchParams.get("origin_lat");
  const queryOriginLng = searchParams.get("origin_lng");
  const queryOriginName = searchParams.get("origin_name");

  // Route points state
  const [origin, setOrigin] = useState<[number, number]>(() => {
    if (queryOriginLat && queryOriginLng) {
      return [parseFloat(queryOriginLat), parseFloat(queryOriginLng)];
    }
    return [18.5204, 73.8567]; // Default Pune Central Deccan
  });
  const [originName, setOriginName] = useState<string>(() => {
    return queryOriginName || "Current Location (FC Road Deccan)";
  });

  const [destination, setDestination] = useState<[number, number]>(() => {
    if (queryDestLat && queryDestLng) {
      return [parseFloat(queryDestLat), parseFloat(queryDestLng)];
    }
    return [18.5362, 73.8885]; // Default Koregaon Park
  });
  const [destinationName, setDestinationName] = useState<string>(() => {
    return queryDestName ? decodeURIComponent(queryDestName) : "Koregaon Park";
  });

  // Autocomplete search states
  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [mapPickMode, setMapPickMode] = useState<"origin" | "destination" | null>(null);

  // Routing preferences
  const [hour, setHour] = useState(21);
  const [priority, setPriority] = useState<string>(safetyPriority || "balanced");
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(1);
  const [showTurnByTurn, setShowTurnByTurn] = useState(false);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);

  // Auto-request live GPS location on initial load if no custom origin was provided in URL
  useEffect(() => {
    if (!queryOriginLat && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOrigin([pos.coords.latitude, pos.coords.longitude]);
          setOriginName("My Live Location (GPS)");
        },
        () => {
          // Graceful fallback to Pune Deccan
        },
        { timeout: 5000 }
      );
    }
  }, [queryOriginLat]);

  // Update destination if URL query params change
  useEffect(() => {
    if (queryDestLat && queryDestLng) {
      const lat = parseFloat(queryDestLat);
      const lng = parseFloat(queryDestLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setDestination([lat, lng]);
        setDestinationName(queryDestName ? decodeURIComponent(queryDestName) : "Selected Destination");
        addToast({
          type: "safe",
          title: "Destination Loaded",
          message: `Calculating safest route to ${queryDestName ? decodeURIComponent(queryDestName) : "selected place"}.`,
        });
      }
    }
  }, [queryDestLat, queryDestLng, queryDestName, addToast]);

  // Autocomplete for Origin
  useEffect(() => {
    if (!originSearch || originSearch.trim().length < 2) {
      setOriginSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.getPlaces({ search: originSearch.trim(), limit: 6 });
        setOriginSuggestions(res.items || []);
      } catch {
        setOriginSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [originSearch]);

  // Autocomplete for Destination
  useEffect(() => {
    if (!destSearch || destSearch.trim().length < 2) {
      setDestSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.getPlaces({ search: destSearch.trim(), limit: 6 });
        setDestSuggestions(res.items || []);
      } catch {
        setDestSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [destSearch]);

  // Safe Route Computation Query
  const { data: routeData, isLoading } = useQuery({
    queryKey: ["safe-routes", origin[0], origin[1], destination[0], destination[1], hour, priority],
    queryFn: () =>
      api.computeSafeRoute({
        origin,
        destination,
        hour,
        priority,
      }),
  });

  const routes = routeData?.routes || [];
  const currentRoute = routes[selectedRouteIdx] || routes[0];

  // Traveling dot simulation along current route
  useEffect(() => {
    if (!isSimulating || !currentRoute?.geometry?.length) return;
    const totalSteps = currentRoute.geometry.length;
    const interval = setInterval(() => {
      setSimStep((prev) => {
        if (prev + 1 >= totalSteps) {
          setIsSimulating(false);
          return 0;
        }
        return prev + 1;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [isSimulating, currentRoute]);

  // Use GPS Location Button Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast({ type: "caution", title: "GPS Unavailable", message: "Geolocation is not supported by your browser." });
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setOrigin(coords);
        setOriginName("My Live Location (GPS)");
        setIsLocatingUser(false);
        addToast({ type: "safe", title: "Current Location Acquired", message: "Source updated to your current device GPS position." });
      },
      () => {
        setIsLocatingUser(false);
        addToast({ type: "caution", title: "Location Access Denied", message: "Please allow location access or pick on map." });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Swap Origin and Destination
  const handleSwapLocations = () => {
    const tempOrigin = origin;
    const tempOriginName = originName;
    setOrigin(destination);
    setOriginName(destinationName);
    setDestination(tempOrigin);
    setDestinationName(tempOriginName);
    setIsSimulating(false);
  };

  // Pick on Map click callback
  const handleMapPick = (lat: number, lng: number) => {
    if (mapPickMode === "origin") {
      setOrigin([lat, lng]);
      setOriginName(`Custom Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      addToast({ type: "safe", title: "Origin Set", message: "Source location selected on map." });
    } else if (mapPickMode === "destination") {
      setDestination([lat, lng]);
      setDestinationName(`Custom Destination (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      addToast({ type: "safe", title: "Destination Set", message: "Destination location selected on map." });
    }
    setMapPickMode(null);
  };

  // Share Route Link
  const handleShare = () => {
    const url = `${window.location.origin}/route?origin_lat=${origin[0]}&origin_lng=${origin[1]}&origin_name=${encodeURIComponent(
      originName
    )}&dest_lat=${destination[0]}&dest_lng=${destination[1]}&dest_name=${encodeURIComponent(destinationName)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      addToast({ type: "safe", title: "Route Link Copied", message: "Safe route share link copied to clipboard." });
    }
  };

  // Open in Google Maps
  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}`;
    window.open(url, "_blank");
  };

  const getDashArray = (pattern: string) => {
    if (pattern === "dashed") return "8, 8";
    if (pattern === "dotted") return "2, 6";
    return undefined; // solid
  };

  const tileConfig = getMapTileConfig(theme === "light" ? "light" : "dark");

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 flex flex-col lg:flex-row gap-6">
      {/* Left Configuration & Route Controls Panel */}
      <div className="w-full lg:w-[480px] flex flex-col space-y-5 shrink-0">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Multi-Criteria Safe-Route Engine</span>
          </span>
          <h1 className="text-2xl font-extrabold text-text-1 mt-1">Navigate with Verified Safety</h1>
          <p className="text-xs text-text-3 mt-1">
            Calculates safer, well-lit corridors avoiding low-illumination spots and civic hazard clusters.
          </p>
        </div>

        {/* Source & Destination Location Inputs Card */}
        <GlassCard className="p-4 space-y-3 relative shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-2">Journey Endpoints</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocatingUser}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20"
              >
                <Crosshair className={`w-3 h-3 ${isLocatingUser ? "animate-spin" : ""}`} />
                <span>{isLocatingUser ? "Locating..." : "My GPS"}</span>
              </button>
              <button
                type="button"
                onClick={handleSwapLocations}
                title="Swap Source and Destination"
                className="p-1 rounded-md text-text-3 hover:text-text-1 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Origin Input */}
          <div className="relative space-y-1">
            <label className="text-[11px] font-semibold text-text-3 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Source / Origin:</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={originName || "Search source place or area..."}
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-bg-2 border border-glass-border text-text-1 placeholder:text-text-3 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/60"
              />
              <MapPin className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 pointer-events-none" />
              {originSearch ? (
                <button
                  type="button"
                  onClick={() => setOriginSearch("")}
                  className="absolute right-2.5 text-text-3 hover:text-text-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMapPickMode(mapPickMode === "origin" ? null : "origin")}
                  title="Pick source on map"
                  className={`absolute right-2 p-1 rounded hover:bg-white/10 text-xs ${
                    mapPickMode === "origin" ? "text-primary font-bold" : "text-text-3"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Current Active Origin Pill */}
            <div className="flex items-center justify-between text-[11px] px-1 text-text-2">
              <span className="truncate">
                Active: <span className="font-semibold text-text-1">{originName}</span>
              </span>
              <span className="font-mono text-[10px] text-text-3">
                {origin[0].toFixed(3)}, {origin[1].toFixed(3)}
              </span>
            </div>

            {/* Origin Autocomplete Suggestions Dropdown */}
            {originSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-bg-1 border border-glass-border rounded-xl shadow-xl overflow-hidden divide-y divide-glass-border max-h-48 overflow-y-auto">
                {originSuggestions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setOrigin([item.lat, item.lng]);
                      setOriginName(item.name);
                      setOriginSearch("");
                      setOriginSuggestions([]);
                    }}
                    className="p-2.5 hover:bg-primary/15 cursor-pointer text-left transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text-1 truncate">{item.name}</div>
                      <div className="text-[10px] text-text-3 truncate">{item.address || item.category}</div>
                    </div>
                    <Badge variant="neutral" className="py-0 text-[9px] shrink-0">
                      {item.category}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Destination Input */}
          <div className="relative space-y-1 pt-1">
            <label className="text-[11px] font-semibold text-text-3 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Destination:</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={destinationName || "Search destination place or landmark..."}
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-bg-2 border border-glass-border text-text-1 placeholder:text-text-3 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/60"
              />
              <Navigation className="w-3.5 h-3.5 text-rose-400 absolute left-2.5 pointer-events-none" />
              {destSearch ? (
                <button
                  type="button"
                  onClick={() => setDestSearch("")}
                  className="absolute right-2.5 text-text-3 hover:text-text-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMapPickMode(mapPickMode === "destination" ? null : "destination")}
                  title="Pick destination on map"
                  className={`absolute right-2 p-1 rounded hover:bg-white/10 text-xs ${
                    mapPickMode === "destination" ? "text-primary font-bold" : "text-text-3"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Current Active Destination Pill */}
            <div className="flex items-center justify-between text-[11px] px-1 text-text-2">
              <span className="truncate">
                Active: <span className="font-semibold text-text-1">{destinationName}</span>
              </span>
              <span className="font-mono text-[10px] text-text-3">
                {destination[0].toFixed(3)}, {destination[1].toFixed(3)}
              </span>
            </div>

            {/* Destination Autocomplete Suggestions Dropdown */}
            {destSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-bg-1 border border-glass-border rounded-xl shadow-xl overflow-hidden divide-y divide-glass-border max-h-48 overflow-y-auto">
                {destSuggestions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setDestination([item.lat, item.lng]);
                      setDestinationName(item.name);
                      setDestSearch("");
                      setDestSuggestions([]);
                    }}
                    className="p-2.5 hover:bg-primary/15 cursor-pointer text-left transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text-1 truncate">{item.name}</div>
                      <div className="text-[10px] text-text-3 truncate">{item.address || item.category}</div>
                    </div>
                    <Badge variant="neutral" className="py-0 text-[9px] shrink-0">
                      {item.category}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map Pick Instruction Banner */}
          {mapPickMode && (
            <div className="p-2 rounded-lg bg-primary/15 border border-primary/30 text-[11px] text-primary flex items-center justify-between">
              <span>Click anywhere on the map to set {mapPickMode === "origin" ? "Source" : "Destination"}.</span>
              <button
                type="button"
                onClick={() => setMapPickMode(null)}
                className="font-bold underline text-[10px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </GlassCard>

        {/* Popular Quick Corridor Chips */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">
            Quick Pune Corridor Presets:
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {POPULAR_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setOrigin(p.origin);
                  setOriginName(p.originName);
                  setDestination(p.destination);
                  setDestinationName(p.destinationName);
                  setIsSimulating(false);
                }}
                className="shrink-0 px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer text-[11px] bg-white/5 border-glass-border text-text-2 hover:bg-white/10 hover:text-text-1"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Departure Time & Route Priority */}
        <GlassCard className="p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>
                Departure: {hour}:00 ({hour >= 20 || hour < 5 ? "Night Hours" : "Day Hours"})
              </span>
            </span>
            <span
              className={`font-mono font-bold text-[11px] ${
                hour >= 20 || hour < 5 ? "text-caution" : "text-primary"
              }`}
            >
              {hour >= 20 || hour < 5 ? "Elevated Night Risk Model" : "Standard Traffic Flow"}
            </span>
          </div>
          <Slider min={0} max={23} value={hour} onChange={setHour} valueFormatter={(v) => `${v}:00`} />

          {/* Priority Toggles */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[
              { id: "safest", label: "Safest Path" },
              { id: "balanced", label: "Balanced" },
              { id: "fastest", label: "Fastest" },
            ].map((pri) => (
              <button
                key={pri.id}
                type="button"
                onClick={() => setPriority(pri.id)}
                className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  priority === pri.id
                    ? "bg-primary text-bg-0 border-primary"
                    : "bg-white/5 text-text-2 border-glass-border hover:bg-white/10"
                }`}
              >
                {pri.label}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* 3 Ranked Candidate Route Alternatives */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-text-2 uppercase tracking-wider">
              Evaluated Route Alternatives:
            </span>
            <button
              type="button"
              onClick={() => setShowTurnByTurn(!showTurnByTurn)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <ListOrdered className="w-3 h-3" />
              <span>{showTurnByTurn ? "Show Route Cards" : "Turn-by-Turn"}</span>
            </button>
          </div>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-20 rounded-card" />
            ))
          ) : showTurnByTurn ? (
            /* Turn-by-Turn Navigation Steps */
            <GlassCard className="p-3.5 space-y-2 max-h-56 overflow-y-auto">
              <div className="text-xs font-bold text-text-1 flex items-center gap-1.5 pb-1 border-b border-glass-border">
                <Navigation className="w-3.5 h-3.5 text-primary" />
                <span>Turn-by-Turn Guidance to {destinationName}</span>
              </div>
              <div className="space-y-2 pt-1 text-xs text-text-2">
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                    1
                  </div>
                  <div>
                    <span className="text-text-1 font-medium">Depart from {originName}</span>
                    <p className="text-[10px] text-text-3">Head onto closest connected arterial road</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px] shrink-0">
                    2
                  </div>
                  <div>
                    <span className="text-text-1 font-medium">Follow Verified Well-Lit Corridor</span>
                    <p className="text-[10px] text-text-3">
                      High streetlight density and regular patrol frequency verified
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px] shrink-0">
                    3
                  </div>
                  <div>
                    <span className="text-text-1 font-medium">Navigate major intersection smoothly</span>
                    <p className="text-[10px] text-text-3">Active surveillance coverage along this corridor</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                    4
                  </div>
                  <div>
                    <span className="text-text-1 font-medium">Arrive safely at {destinationName}</span>
                    <p className="text-[10px] text-text-3">Total trip distance approx {currentRoute?.distance_km} km</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          ) : (
            routes.map((r: any, idx: number) => {
              const isSelected = selectedRouteIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedRouteIdx(idx);
                    setIsSimulating(false);
                    setSimStep(0);
                  }}
                  className={`p-3 rounded-card border transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-primary border-primary bg-primary/10 shadow-md"
                      : "bg-white/5 border-glass-border hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                      <span className="text-xs font-bold text-text-1">{r.label} Route</span>
                      <span className="text-[10px] font-mono text-text-3 capitalize">({r.dash_pattern})</span>
                    </div>
                    <Badge variant={r.risk_score < 40 ? "safe" : r.risk_score < 70 ? "caution" : "danger"}>
                      Risk {Math.round(r.risk_score)}%
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-2 mt-2 pt-2 border-t border-glass-border">
                    <div className="space-x-3">
                      <span className="font-bold text-text-1">{r.duration_min} min</span>
                      <span className="text-text-3 font-mono">{r.distance_km} km</span>
                    </div>
                    <span className="text-primary font-semibold text-[11px] truncate max-w-[180px]">
                      {r.tradeoff_text}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mini Risk Area Profile Chart */}
        {currentRoute && currentRoute.risk_profile && (
          <RiskProfileChart
            data={currentRoute.risk_profile}
            color={currentRoute.color}
            worstSegment={currentRoute.worst_segment}
          />
        )}

        {/* Actions Bar */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="primary"
            size="md"
            className="flex-1 gap-2 shadow-md shadow-primary/20"
            onClick={() => {
              setIsSimulating(!isSimulating);
              if (!isSimulating) setSimStep(0);
            }}
          >
            {isSimulating ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isSimulating ? "Stop Simulation" : "Simulate Journey"}</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={handleOpenGoogleMaps}
            title="Open Turn-by-Turn in Google Maps"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>

          <Button variant="secondary" size="md" onClick={handleShare} title="Share Route Link">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Right Map Canvas Area */}
      <div className="flex-1 h-[540px] lg:h-auto min-h-[500px] rounded-panel overflow-hidden border border-glass-border relative shadow-xl">
        <MapContainer
          center={[(origin[0] + destination[0]) / 2, (origin[1] + destination[1]) / 2]}
          zoom={13}
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution={tileConfig.attribution}
            url={tileConfig.url}
            maxZoom={tileConfig.maxZoom}
          />

          {/* Dynamic Auto Bounds Fitter */}
          <MapAutoFitter
            origin={origin}
            destination={destination}
            geometry={currentRoute?.geometry}
          />

          {/* Map Click Listener for picking custom points */}
          <MapPickListener mode={mapPickMode} onPick={handleMapPick} />

          {/* Draw Candidate Polylines */}
          {routes.map((r: any, idx: number) => {
            const isSelected = selectedRouteIdx === idx;
            return (
              <Polyline
                key={idx}
                positions={r.geometry}
                pathOptions={{
                  color: r.color,
                  weight: isSelected ? 6 : 3,
                  opacity: isSelected ? 1.0 : 0.35,
                  dashArray: getDashArray(r.dash_pattern),
                }}
              />
            );
          })}

          {/* Origin Marker (A) */}
          <Marker position={origin} icon={startPinIcon}>
            <Popup>
              <div className="p-1 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-500">Origin</span>
                <div className="text-xs font-bold text-text-1">{originName}</div>
              </div>
            </Popup>
          </Marker>

          {/* Destination Marker (B) */}
          <Marker position={destination} icon={endPinIcon}>
            <Popup>
              <div className="p-1 space-y-1">
                <span className="text-[10px] uppercase font-bold text-rose-500">Destination</span>
                <div className="text-xs font-bold text-text-1">{destinationName}</div>
              </div>
            </Popup>
          </Marker>

          {/* Simulation Traveling Vehicle Marker */}
          {isSimulating && currentRoute?.geometry?.[simStep] && (
            <Marker position={currentRoute.geometry[simStep] as [number, number]} icon={simVehicleIcon}>
              <Popup>Simulating traversal</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Route Details Floating Top Overlay Pill */}
        {currentRoute && (
          <div className="absolute top-4 left-4 right-4 sm:right-auto z-10 p-3 rounded-card bg-bg-1/90 backdrop-blur-xl border border-glass-border shadow-lg flex items-center justify-between sm:justify-start gap-3">
            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: currentRoute.color }} />
            <div className="min-w-0">
              <span className="text-xs font-bold text-text-1 truncate block">
                {currentRoute.label} Route • {destinationName}
              </span>
              <div className="text-[11px] text-text-3 truncate">
                {currentRoute.duration_min} min • {currentRoute.distance_km} km • Risk {Math.round(currentRoute.risk_score)}%
              </div>
            </div>
            {isSimulating && (
              <Badge variant="safe" className="animate-pulse text-[10px] shrink-0">
                Live Sim
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutePage;
