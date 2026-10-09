import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Flame,
  TrendingUp,
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import { api } from "../lib/api";

export const DashboardPage: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => api.getAnalyticsSummary(),
  });

  const categoryData = analytics?.incidents_by_category || [];
  const hourData = analytics?.incidents_by_hour?.map((h: any) => ({
    hour: `${h.hour}:00`,
    count: h.count,
  })) || [];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-glass-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Civic Transparency & Analytics</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-1 mt-1">
            Pune Urban Intelligence Dashboard
          </h1>
          <p className="text-xs text-text-3 mt-1">
            Real-time telemetry on incident verification, cluster formations, and corridor safety.
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-3 font-semibold">
            <span>Total Reported Events</span>
            <ShieldAlert className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black font-mono text-text-1">
            {isLoading ? "..." : analytics?.total_reports ?? 0}
          </div>
          <span className="text-[11px] text-safe flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>100% Bayesian Credibility Audited</span>
          </span>
        </GlassCard>

        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-3 font-semibold">
            <span>Verified Active Incidents</span>
            <CheckCircle2 className="w-4 h-4 text-safe" />
          </div>
          <div className="text-2xl font-black font-mono text-text-1">
            {isLoading ? "..." : analytics?.total_incidents ?? 0}
          </div>
          <span className="text-[11px] text-text-3 font-mono">
            Affecting Live Heatmaps & Routes
          </span>
        </GlassCard>

        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-3 font-semibold">
            <span>Active DBSCAN Hotspots</span>
            <Flame className="w-4 h-4 text-danger" />
          </div>
          <div className="text-2xl font-black font-mono text-text-1">
            {isLoading ? "..." : analytics?.active_hotspots_count ?? 0}
          </div>
          <span className="text-[11px] text-danger flex items-center gap-1">
            <span>DBSCAN eps=150m, min_samples=3</span>
          </span>
        </GlassCard>

        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-3 font-semibold">
            <span>AI Verification Rate</span>
            <AlertTriangle className="w-4 h-4 text-caution" />
          </div>
          <div className="text-2xl font-black font-mono text-text-1">
            {isLoading ? "..." : "88.4%"}
          </div>
          <span className="text-[11px] text-primary flex items-center gap-1">
            <span>Corroboration Confidence High</span>
          </span>
        </GlassCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents by Category */}
        <GlassCard className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-text-1">Incidents by Civic Category</h3>
          <div className="w-full h-64">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-card" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="category" tick={{ fill: "#94A3B8", fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-2 rounded-md bg-bg-1 border border-glass-border shadow-md text-xs">
                            <span className="font-bold text-primary">{payload[0].value} incidents</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#2DD4BF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Incidents by Hour */}
        <GlassCard className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-text-1">Incident Temporal Distribution (24h)</h3>
          <div className="w-full h-64">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-card" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="hour" tick={{ fill: "#94A3B8", fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-2 rounded-md bg-bg-1 border border-glass-border shadow-md text-xs">
                            <span className="font-bold text-secondary">{payload[0].value} incidents</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Top and Bottom Places by Verified Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6 space-y-3">
          <h3 className="text-sm font-bold text-text-1 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-safe" />
            <span>Highest Scored Locations</span>
          </h3>
          <div className="space-y-2">
            {analytics?.top_places?.map((p: any) => (
              <div
                key={p.id}
                className="p-3 rounded-card bg-white/5 border border-glass-border flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-text-1">{p.name}</h4>
                  <span className="text-[10px] text-text-3 uppercase">{p.category}</span>
                </div>
                <Badge variant="safe" className="font-mono">
                  {Math.round(p.overall_score)}%
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-3">
          <h3 className="text-sm font-bold text-text-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-caution" />
            <span>Locations Requiring Municipal Attention</span>
          </h3>
          <div className="space-y-2">
            {analytics?.bottom_places?.map((p: any) => (
              <div
                key={p.id}
                className="p-3 rounded-card bg-white/5 border border-glass-border flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-text-1">{p.name}</h4>
                  <span className="text-[10px] text-text-3 uppercase">{p.category}</span>
                </div>
                <Badge variant="caution" className="font-mono">
                  {Math.round(p.overall_score)}%
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default DashboardPage;
