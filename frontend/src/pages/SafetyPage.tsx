import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Flame,
  Sun,
  Moon,
  Clock,
  Sparkles,
  MapPin,
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { Slider } from "../components/Toggle";
import { ScoreBar } from "../components/ScoreBar";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import { SafetyOrb } from "../three/SafetyOrb";
import { api } from "../lib/api";

export const SafetyPage: React.FC = () => {
  const [selectedHour, setSelectedHour] = useState(21); // Default evening/night
  const [selectedBucket, setSelectedBucket] = useState<string>("evening");

  // Center coordinate (Pune Shivajinagar / Swargate corridor)
  const [targetLat, setTargetLat] = useState(18.5204);
  const [targetLng, setTargetLng] = useState(73.8567);

  const { data: scoreData, isLoading: scoreLoading } = useQuery({
    queryKey: ["safety-score", targetLat, targetLng, selectedHour],
    queryFn: () => api.getSafetyScore(targetLat, targetLng, selectedHour),
  });

  const { data: hotspots, isLoading: hotspotsLoading } = useQuery({
    queryKey: ["safety-hotspots", selectedBucket],
    queryFn: () => api.getHotspots(selectedBucket),
  });

  const timeBuckets = [
    { id: "morning", label: "Morning (6AM - 12PM)", icon: <Sun className="w-3.5 h-3.5 text-caution" />, hour: 9 },
    { id: "afternoon", label: "Afternoon (12PM - 5PM)", icon: <Sun className="w-3.5 h-3.5 text-primary" />, hour: 14 },
    { id: "evening", label: "Evening (5PM - 9PM)", icon: <Moon className="w-3.5 h-3.5 text-secondary" />, hour: 19 },
    { id: "night", label: "Night (9PM - 6AM)", icon: <Moon className="w-3.5 h-3.5 text-danger" />, hour: 23 },
  ];

  const handleBucketChange = (b: string, h: number) => {
    setSelectedBucket(b);
    setSelectedHour(h);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-glass-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Real-Time Urban Risk Assessment</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-1 mt-1">
            Pune Safety & Incident Intelligence
          </h1>
        </div>

        {/* Time-of-Day Quick Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {timeBuckets.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => handleBucketChange(tb.id, tb.hour)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-xs font-medium border transition-all cursor-pointer ${
                selectedBucket === tb.id
                  ? "bg-primary text-bg-0 border-primary font-bold shadow-md shadow-primary/20"
                  : "bg-white/5 text-text-2 border-glass-border hover:text-text-1"
              }`}
            >
              {tb.icon}
              <span>{tb.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 3D Safety Orb & Score Breakdown */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-6 flex flex-col items-center text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-text-3">
              Corridor Safety Index
            </span>
            {scoreLoading || !scoreData ? (
              <Skeleton className="w-40 h-40 rounded-full" />
            ) : (
              <SafetyOrb score={scoreData.safety_score} size={160} />
            )}
            <div className="space-y-1">
              <div className="inline-block">
                <Badge
                  variant={
                    scoreData?.risk_level === "safe"
                      ? "safe"
                      : scoreData?.risk_level === "caution"
                      ? "caution"
                      : "danger"
                  }
                  className="text-xs px-3 py-1 uppercase tracking-wider font-bold"
                >
                  {scoreData?.risk_level || "Analyzing"} Zone
                </Badge>
              </div>
              <p className="text-xs text-text-2 leading-relaxed pt-2">
                {scoreData?.explanation || "Evaluating incident clustering and municipal street illumination."}
              </p>
            </div>
          </GlassCard>

          {/* Breakdown Bars */}
          <GlassCard className="p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>What's Driving This Score</span>
            </h4>
            {scoreData ? (
              <div className="space-y-3 pt-1">
                <ScoreBar
                  label="Street Illumination"
                  score={scoreData.breakdown.lighting_score * 100}
                />
                <ScoreBar
                  label="Commercial Footfall Proxy"
                  score={scoreData.breakdown.footfall_proxy * 100}
                />
                <ScoreBar
                  label="Incident Density Resistance"
                  score={(1.0 - scoreData.breakdown.incident_density) * 100}
                />
                <ScoreBar
                  label="Severity Damping"
                  score={(1.0 - scoreData.breakdown.severity_factor) * 100}
                />
                <ScoreBar
                  label="Diurnal Safety Multiplier"
                  score={(1.0 - scoreData.breakdown.time_of_day_factor) * 100}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Skeleton className="w-full h-8" />
                <Skeleton className="w-full h-8" />
                <Skeleton className="w-full h-8" />
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Columns: Diurnal Slider & Ranked Hotspots List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Time Slider Card */}
          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Simulate Hour of Day: {selectedHour}:00</span>
              </span>
              <span className="text-xs font-mono text-primary font-bold">
                {selectedHour >= 21 || selectedHour < 5 ? "Night Multiplier Active (+35% Risk)" : "Standard Daylight"}
              </span>
            </div>
            <Slider
              min={0}
              max={23}
              value={selectedHour}
              onChange={setSelectedHour}
              valueFormatter={(v) => `${v}:00`}
            />
          </GlassCard>

          {/* DBSCAN Hotspots List */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text-1 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-danger" />
                  <span>DBSCAN High-Risk Incident Clusters ({selectedBucket})</span>
                </h3>
                <p className="text-xs text-text-3">
                  Spatial clusters computed via Haversine DBSCAN (eps=150m, min_samples=3).
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-glass-border text-xs font-mono text-primary">
                {hotspots?.length || 0} Clusters Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {hotspotsLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={idx} className="w-full h-24 rounded-card" />
                ))
              ) : hotspots && hotspots.length > 0 ? (
                hotspots.map((h: any) => (
                  <div
                    key={h.id}
                    onClick={() => {
                      setTargetLat(h.centroid_lat);
                      setTargetLng(h.centroid_lng);
                    }}
                    className={`p-4 rounded-card border transition-all cursor-pointer ${
                      targetLat === h.centroid_lat && targetLng === h.centroid_lng
                        ? "bg-danger/15 border-danger/50 text-text-1"
                        : "bg-white/5 border-glass-border text-text-2 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-danger" />
                        <span>Cluster #{h.id}</span>
                      </span>
                      <Badge variant="danger" className="text-[10px] py-0 font-mono">
                        Risk {Math.round(h.risk_score)}%
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-text-3 space-y-0.5 font-mono">
                      <div>Centroid: {h.centroid_lat.toFixed(4)}, {h.centroid_lng.toFixed(4)}</div>
                      <div>Incidents: {h.incident_count} corroborated events</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-xs text-text-3">
                  No critical incident hotspots active in this time partition.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default SafetyPage;
