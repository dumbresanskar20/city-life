import React from "react";
import { GlassCard } from "../components/GlassCard";

export const ExplorePage: React.FC = () => {
  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <GlassCard className="p-8 text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-1">Explore Map</h1>
        <p className="text-sm text-text-3">Full interactive Leaflet map loading in Phase 3.</p>
      </GlassCard>
    </div>
  );
};

export const HeritagePage: React.FC = () => {
  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <GlassCard className="p-8 text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-1">Heritage Landmarks</h1>
        <p className="text-sm text-text-3">Cultural timeline and AI storytelling.</p>
      </GlassCard>
    </div>
  );
};

export const SafetyPage: React.FC = () => {
  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <GlassCard className="p-8 text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-1">Safety Heatmap & Hotspots</h1>
        <p className="text-sm text-text-3">Incident heatmap and Safety Orb.</p>
      </GlassCard>
    </div>
  );
};

export const RoutePage: React.FC = () => {
  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <GlassCard className="p-8 text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-1">Safe Route Engine</h1>
        <p className="text-sm text-text-3">Multi-criteria routing and risk analysis.</p>
      </GlassCard>
    </div>
  );
};

export const ComparePage: React.FC = () => {
  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <GlassCard className="p-8 text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-1">Place Comparison</h1>
        <p className="text-sm text-text-3">5-dimension radar charts and AI verdicts.</p>
      </GlassCard>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <GlassCard className="p-8 text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-1">City Analytics Dashboard</h1>
        <p className="text-sm text-text-3">Urban incident KPIs and verification trends.</p>
      </GlassCard>
    </div>
  );
};
