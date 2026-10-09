import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Landmark,
  Clock,
  Ticket,
  Sparkles,
  BookOpen,
  Navigation,
  Calendar,
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import { api } from "../lib/api";

export const HeritagePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSiteId, setSelectedSiteId] = useState<number>(1);
  const [storyText, setStoryText] = useState<string | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  const { data: sites, isLoading } = useQuery({
    queryKey: ["heritage-sites"],
    queryFn: () => api.getHeritageSites(),
  });

  const selectedSite = sites?.find((s: any) => s.id === selectedSiteId) || sites?.[0];

  const handleFetchStory = async (id: number) => {
    setIsGeneratingStory(true);
    setStoryText("");
    try {
      const res = await fetch(api.streamHeritageStory(id), {
        method: "POST",
      });
      const data = await res.json();
      const fullText = data.story;

      // Simulated streaming / typing effect
      let charIdx = 0;
      const interval = setInterval(() => {
        charIdx += 4;
        if (charIdx >= fullText.length) {
          setStoryText(fullText);
          setIsGeneratingStory(false);
          clearInterval(interval);
        } else {
          setStoryText(fullText.substring(0, charIdx));
        }
      }, 25);
    } catch {
      setIsGeneratingStory(false);
      setStoryText("Failed to retrieve story. Please try again.");
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-glass-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5" />
            <span>Living History & Maratha Citadel Lore</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-1 mt-1">
            Pune Heritage Landmarks & Chronology
          </h1>
          <p className="text-xs text-text-3 mt-1">
            Explore ancient rock-cut cave sanctuaries, Maratha hill citadels, and freedom struggle memorials.
          </p>
        </div>
      </div>

      {/* Horizontal Timeline Strip */}
      <div className="p-4 rounded-card bg-bg-1/80 border border-glass-border shadow-sm overflow-x-auto space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-3 block">
          Historical Chronology Timeline
        </span>
        <div className="flex items-center gap-4 min-w-[600px] pt-2">
          {sites?.map((s: any) => (
            <div
              key={s.id}
              onClick={() => {
                setSelectedSiteId(s.id);
                setStoryText(null);
              }}
              className={`flex-1 p-3 rounded-card border transition-all cursor-pointer ${
                selectedSiteId === s.id
                  ? "bg-secondary/15 border-secondary/50 text-text-1 font-semibold"
                  : "bg-white/5 border-glass-border text-text-2 hover:bg-white/10"
              }`}
            >
              <span className="text-[10px] font-mono text-secondary block">{s.era}</span>
              <h4 className="text-xs font-bold text-text-1 truncate mt-0.5">{s.place?.name}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Landmark Showcase */}
      {selectedSite && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Badge variant="primary" className="text-xs">
                    {selectedSite.era}
                  </Badge>
                  <h2 className="text-2xl font-extrabold text-text-1 mt-2">
                    {selectedSite.place?.name}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      navigate(
                        `/route?dest_lat=${selectedSite.place?.lat}&dest_lng=${selectedSite.place?.lng}&dest_name=${encodeURIComponent(
                          selectedSite.place?.name
                        )}`
                      )
                    }
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Plan Safe Route</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-sm text-text-2 leading-relaxed">{selectedSite.summary}</p>
                <div className="p-4 rounded-card bg-white/5 border border-glass-border space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-3 block">
                    Historical Significance
                  </span>
                  <p className="text-xs text-text-1 leading-relaxed font-medium">
                    {selectedSite.significance}
                  </p>
                </div>
              </div>

              {/* Timings, Entry Fees, Traditions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-card bg-bg-2/50 border border-glass-border space-y-1">
                  <span className="text-text-3 flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5" /> Timings
                  </span>
                  <span className="font-semibold text-text-1">{selectedSite.visiting_hours}</span>
                </div>
                <div className="p-3 rounded-card bg-bg-2/50 border border-glass-border space-y-1">
                  <span className="text-text-3 flex items-center gap-1 font-semibold">
                    <Ticket className="w-3.5 h-3.5" /> Entry Fee
                  </span>
                  <span className="font-semibold text-text-1">{selectedSite.entry_fee}</span>
                </div>
                <div className="p-3 rounded-card bg-bg-2/50 border border-glass-border space-y-1">
                  <span className="text-text-3 flex items-center gap-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5" /> Traditions
                  </span>
                  <span className="font-semibold text-text-1">
                    {selectedSite.traditions?.slice(0, 2).join(", ") || "Festivals"}
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* AI Storytelling Section */}
            <GlassCard className="p-6 space-y-4 bg-secondary/10 border-secondary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-secondary">
                  <BookOpen className="w-5 h-5" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    "Tell Me the Story" (Curated History)
                  </h3>
                </div>
                {!storyText && !isGeneratingStory && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1.5 shadow-md shadow-secondary/25"
                    onClick={() => handleFetchStory(selectedSite.id)}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Narrate Lore</span>
                  </Button>
                )}
              </div>

              {isGeneratingStory && (
                <div className="text-xs text-text-3 font-mono animate-pulse">
                  Synthesizing historical narrative...
                </div>
              )}

              {storyText && (
                <div className="p-4 rounded-card bg-bg-1 border border-glass-border text-xs text-text-1 leading-relaxed font-serif text-sm">
                  {storyText}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right Landmark List */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-text-3">
              All Heritage Landmarks
            </span>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-20 rounded-card" />
              ))
            ) : (
              sites?.map((s: any) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedSiteId(s.id);
                    setStoryText(null);
                  }}
                  className={`p-4 rounded-card border transition-all cursor-pointer ${
                    selectedSiteId === s.id
                      ? "bg-secondary/15 border-secondary text-text-1 font-bold shadow-md"
                      : "bg-white/5 border-glass-border text-text-2 hover:bg-white/10"
                  }`}
                >
                  <div className="text-xs font-bold">{s.place?.name}</div>
                  <div className="text-[11px] text-text-3 font-mono mt-0.5">{s.era}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeritagePage;
