import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Scale, Trophy, Sparkles, Trash2 } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import { api } from "../lib/api";

export const ComparePage: React.FC = () => {
  // Default compare Shaniwar Wada (id 1) and Aga Khan Palace (id 2)
  const [selectedIds, setSelectedIds] = useState<number[]>([1, 2]);

  const { data: placesData } = useQuery({
    queryKey: ["all-places-compare"],
    queryFn: () => api.getPlaces({ limit: 50 }),
  });

  const { data: compareData, isLoading } = useQuery({
    queryKey: ["compare-data", selectedIds],
    queryFn: () => api.comparePlaces(selectedIds),
    enabled: selectedIds.length >= 2,
  });

  const allPlaces = placesData?.items || [];
  const comparedPlaces = compareData?.places || [];

  // Build radar chart dataset
  const radarData = [
    { subject: "Safety" },
    { subject: "Cleanliness" },
    { subject: "Affordability" },
    { subject: "Accessibility" },
    { subject: "Ratings" },
  ].map((item) => {
    const row: any = { subject: item.subject };
    comparedPlaces.forEach((p: any) => {
      if (item.subject === "Safety") row[p.name] = p.safety_score;
      if (item.subject === "Cleanliness") row[p.name] = p.cleanliness_score;
      if (item.subject === "Affordability") row[p.name] = p.affordability_score;
      if (item.subject === "Accessibility") row[p.name] = p.accessibility_score;
      if (item.subject === "Ratings") row[p.name] = p.rating * 20;
    });
    return row;
  });

  const colors = ["#2DD4BF", "#8B5CF6", "#F59E0B"];

  const handleAddPlace = (id: number) => {
    if (selectedIds.length < 3 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRemovePlace = (id: number) => {
    if (selectedIds.length > 2) {
      setSelectedIds(selectedIds.filter((p) => p !== id));
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-glass-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            <span>Multi-Dimensional Intelligence</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-1 mt-1">
            Compare Urban Places Side-by-Side
          </h1>
          <p className="text-xs text-text-3 mt-1">
            Compare landmarks and venues across 5 objective dimensions with AI verification.
          </p>
        </div>

        {/* Place Selector Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length < 3 && (
            <select
              onChange={(e) => handleAddPlace(parseInt(e.target.value, 10))}
              className="h-9 px-3 rounded-input bg-bg-2 border border-glass-border text-xs text-text-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              defaultValue=""
            >
              <option value="" disabled>
                + Add place to compare
              </option>
              {allPlaces
                .filter((p) => !selectedIds.includes(p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart Card */}
        <GlassCard className="p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>5-Dimension Radar Comparison</span>
            </h3>
            <span className="text-xs text-text-3">Scale 0 - 100</span>
          </div>

          <div className="w-full h-80">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-card" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} stroke="rgba(255,255,255,0.15)" />
                  {comparedPlaces.map((p: any, idx: number) => (
                    <Radar
                      key={p.id}
                      name={p.name}
                      dataKey={p.name}
                      stroke={colors[idx % colors.length]}
                      fill={colors[idx % colors.length]}
                      fillOpacity={0.25}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-2 rounded-card bg-bg-1 border border-glass-border shadow-md text-xs space-y-1">
                            {payload.map((entry: any, i: number) => (
                              <div key={i} className="flex items-center justify-between gap-3 font-mono">
                                <span style={{ color: entry.color }}>{entry.name}:</span>
                                <span className="font-bold text-text-1">{entry.value}%</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* AI Verdict & Winner Callouts */}
        <div className="space-y-6">
          <GlassCard className="p-6 space-y-4 bg-primary/10 border-primary/30">
            <div className="flex items-center gap-2 text-primary">
              <Trophy className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">AI Comparative Verdict</h3>
            </div>
            {isLoading || !compareData ? (
              <Skeleton className="w-full h-20" />
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-text-1 leading-relaxed">
                  {compareData.verdict}
                </p>
                <ul className="text-xs text-text-2 space-y-1 list-disc pl-4">
                  {compareData.verdict_reasons.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>

          {/* Places Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {comparedPlaces.map((p: any) => (
              <GlassCard key={p.id} className="p-4 space-y-2 relative">
                {selectedIds.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlace(p.id)}
                    className="absolute top-3 right-3 text-text-3 hover:text-danger cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                  {compareData?.best_for[p.id] || "Selected Venue"}
                </span>
                <h4 className="text-sm font-bold text-text-1 truncate">{p.name}</h4>
                <div className="text-xs text-text-3 font-mono">
                  Rating: {p.rating}/5.0 • Score: {Math.round(p.overall_score)}%
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Table */}
      <GlassCard className="p-6 space-y-4 overflow-x-auto">
        <h3 className="text-sm font-bold text-text-1">Side-by-Side Dimension Matrix</h3>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-glass-border text-text-3">
              <th className="py-3 px-4 font-semibold uppercase text-[10px]">Dimension</th>
              {comparedPlaces.map((p: any) => (
                <th key={p.id} className="py-3 px-4 font-semibold text-text-1">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-glass-border">
            {compareData?.dimensions.map((dim: any, idx: number) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 font-semibold text-text-2">{dim.dimension}</td>
                {comparedPlaces.map((p: any) => {
                  const isWinner = dim.winner_id === p.id;
                  const score = dim.scores[p.id];
                  return (
                    <td key={p.id} className="py-3 px-4 font-mono font-medium">
                      <div className="flex items-center gap-2">
                        <span className={isWinner ? "text-primary font-bold" : "text-text-2"}>
                          {Math.round(score)}%
                        </span>
                        {isWinner && (
                          <Badge variant="primary" className="text-[9px] py-0 px-1.5">
                            Winner
                          </Badge>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
};

export default ComparePage;
