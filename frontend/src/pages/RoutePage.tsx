import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Clock,
  Shield,
  Play,
  Share2,
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

const PRESET_ROUTES = [
  {
    name: "Nightlife Corridor: Koregaon Park to FC Road",
    origin: [18.5362, 73.8885],
    destination: [18.5222, 73.8407],
    desc: "Late night commuter trip through central junctions",
  },
  {
    name: "Heritage Trail: Swargate to Shaniwar Wada",
    origin: [18.5018, 73.8586],
    destination: [18.5196, 73.8553],
    desc: "Transit corridor through historic Peth areas",
  },
  {
    name: "Airport Link: Yerawada to Shivajinagar",
    origin: [18.5583, 73.8967],
    destination: [18.5312, 73.8445],
    desc: "Arterial road with busy underpasses",
  },
];

export const RoutePage: React.FC = () => {
  const { theme, safetyPriority } = useUserStore();
  const addToast = useToastStore((s) => s.addToast);

  const [selectedPreset, setSelectedPreset] = useState(0);
  const [hour, setHour] = useState(22);
  const priority = safetyPriority || "balanced";
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(1);

  // Animation simulation state
  const [isSimulating, setIsSimulating] = useState(false);

  const preset = PRESET_ROUTES[selectedPreset];

  const { data: routeData, isLoading } = useQuery({
    queryKey: ["safe-routes", preset.origin, preset.destination, hour, priority],
    queryFn: () =>
      api.computeSafeRoute({
        origin: preset.origin as [number, number],
        destination: preset.destination as [number, number],
        hour,
        priority,
      }),
  });

  const routes = routeData?.routes || [];
  const currentRoute = routes[selectedRouteIdx] || routes[0];

  // Traveling dot animation along path
  useEffect(() => {
    if (!isSimulating || !currentRoute?.geometry?.length) return;
    let step = 0;
    const totalSteps = currentRoute.geometry.length;
    const interval = setInterval(() => {
      step += 1;
      if (step >= totalSteps) {
        setIsSimulating(false);
      }
    }, 70);
    return () => clearInterval(interval);
  }, [isSimulating, currentRoute]);

  const tileUrl =
    theme === "light"
      ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  const getDashArray = (pattern: string) => {
    if (pattern === "dashed") return "8, 8";
    if (pattern === "dotted") return "2, 6";
    return undefined; // solid
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast({ type: "safe", title: "Route Link Copied", message: "Safe route shared to clipboard." });
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 flex flex-col lg:flex-row gap-6">
      {/* Left Configuration Panel */}
      <div className="w-full lg:w-[460px] flex flex-col space-y-5 shrink-0">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Multi-Criteria Safe-Route Engine</span>
          </span>
          <h1 className="text-2xl font-extrabold text-text-1 mt-1">Navigate with Verified Safety</h1>
          <p className="text-xs text-text-3 mt-1">
            Recommends lower-risk paths using real-time incident clusters and streetlight illumination.
          </p>
        </div>

        {/* Preset Commute Pairs */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-2">Demo Corridor Presets:</label>
          <div className="space-y-1.5">
            {PRESET_ROUTES.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedPreset(idx);
                  setIsSimulating(false);
                }}
                className={`w-full p-2.5 rounded-card border text-left transition-all cursor-pointer ${
                  selectedPreset === idx
                    ? "bg-primary/15 border-primary text-text-1 font-semibold shadow-sm"
                    : "bg-white/5 border-glass-border text-text-2 hover:bg-white/10"
                }`}
              >
                <div className="text-xs font-bold">{p.name}</div>
                <div className="text-[11px] text-text-3 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Departure Time & Priority */}
        <GlassCard className="p-4 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Departure: {hour}:00 ({hour >= 20 || hour < 5 ? "Night Route" : "Day Route"})</span>
            </span>
            <span className="font-mono text-primary font-bold">
              {hour >= 20 || hour < 5 ? "Elevated Night Caution" : "Standard Traffic"}
            </span>
          </div>
          <Slider min={0} max={23} value={hour} onChange={setHour} valueFormatter={(v) => `${v}:00`} />
        </GlassCard>

        {/* 3 Candidate Route Cards */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-text-2 uppercase tracking-wider text-[10px]">
            Ranked Route Alternatives:
          </span>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-24 rounded-card" />
            ))
          ) : (
            routes.map((r: any, idx: number) => {
              const isSelected = selectedRouteIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedRouteIdx(idx);
                    setIsSimulating(false);
                  }}
                  className={`p-3.5 rounded-card border transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-primary border-primary bg-primary/10 shadow-md"
                      : "bg-white/5 border-glass-border hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="text-sm font-bold text-text-1">{r.label} Route</span>
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
                    <span className="text-primary font-semibold text-[11px]">{r.tradeoff_text}</span>
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

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="primary"
            size="md"
            className="flex-1 gap-2 shadow-md shadow-primary/20"
            onClick={() => setIsSimulating(!isSimulating)}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isSimulating ? "Stop Preview" : "Simulate Navigation"}</span>
          </Button>
          <Button variant="secondary" size="md" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Right Map Canvas Area */}
      <div className="flex-1 h-[520px] lg:h-auto min-h-[480px] rounded-panel overflow-hidden border border-glass-border relative shadow-lg">
        <MapContainer
          center={[(preset.origin[0] + preset.destination[0]) / 2, (preset.origin[1] + preset.destination[1]) / 2]}
          zoom={13}
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer url={tileUrl} maxZoom={19} />

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
                  opacity: isSelected ? 1.0 : 0.4,
                  dashArray: getDashArray(r.dash_pattern),
                }}
              />
            );
          })}

          {/* Origin & Destination Markers */}
          <Marker position={preset.origin as [number, number]}>
            <Popup>Origin: {preset.name.split(" to ")[0]}</Popup>
          </Marker>
          <Marker position={preset.destination as [number, number]}>
            <Popup>Destination: {preset.name.split(" to ")[1] || "Destination"}</Popup>
          </Marker>
        </MapContainer>

        {/* Route Details Overlay Pill */}
        {currentRoute && (
          <div className="absolute top-4 left-4 z-10 p-3 rounded-card bg-bg-1/90 backdrop-blur-xl border border-glass-border shadow-lg flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: currentRoute.color }} />
            <div>
              <span className="text-xs font-bold text-text-1">{currentRoute.label} Route Active</span>
              <div className="text-[11px] text-text-3">
                {currentRoute.duration_min} min • {currentRoute.distance_km} km • {currentRoute.tradeoff_text}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutePage;
