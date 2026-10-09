import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Navigation,
  Heart,
  Scale,
  AlertTriangle,
  Clock,
  Shield,
  Sparkles,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { Drawer } from "../../components/Drawer";
import { Button } from "../../components/Button";
import { ScoreRing } from "../../components/ScoreRing";
import { ScoreBar } from "../../components/ScoreBar";
import { Skeleton } from "../../components/Skeleton";
import { api } from "../../lib/api";
import { useUserStore } from "../../store/userStore";
import { useToastStore } from "../../store/toastStore";
import type { PlaceItem } from "./PlaceCard";

export interface PlaceDrawerProps {
  placeId: number | null;
  onClose: () => void;
  onOpenReportModal?: (lat: number, lng: number) => void;
}

export const PlaceDrawer: React.FC<PlaceDrawerProps> = ({
  placeId,
  onClose,
  onOpenReportModal,
}) => {
  const navigate = useNavigate();
  const { savedPlaceIds, toggleSavedPlace } = useUserStore();
  const addToast = useToastStore((s) => s.addToast);

  const { data: place, isLoading } = useQuery<PlaceItem>({
    queryKey: ["place", placeId],
    queryFn: () => api.getPlace(placeId!),
    enabled: !!placeId,
  });

  const { data: explainData } = useQuery({
    queryKey: ["place-explain", placeId],
    queryFn: () => api.explainPlace(placeId!),
    enabled: !!placeId,
  });

  if (!placeId) return null;

  const isSaved = place ? savedPlaceIds.includes(place.id) : false;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast({ type: "safe", title: "Link Copied", message: "Place link copied to clipboard!" });
    }
  };

  const handleGetDirections = () => {
    if (place) {
      onClose();
      navigate(`/route?dest_lat=${place.lat}&dest_lng=${place.lng}&dest_name=${encodeURIComponent(place.name)}`);
    }
  };

  const handleCompare = () => {
    if (place) {
      onClose();
      navigate(`/compare?add=${place.id}`);
    }
  };

  return (
    <Drawer isOpen={!!placeId} onClose={onClose} width="max-w-lg">
      {isLoading || !place ? (
        <div className="space-y-4">
          <Skeleton className="w-full h-48 rounded-card" />
          <Skeleton className="w-3/4 h-6" />
          <Skeleton className="w-1/2 h-4" />
          <Skeleton className="w-full h-32" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Photo Banner */}
          <div className="relative w-full h-52 rounded-card overflow-hidden border border-glass-border shadow-md">
            <img
              src={
                place.photo_url ||
                "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80"
              }
              alt={place.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-0 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md">
                  {place.category}
                </span>
                <h2 className="text-xl font-extrabold text-white mt-1 drop-shadow-md">{place.name}</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-primary transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleSavedPlace(place.id)}
                  className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-danger transition-colors cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${isSaved ? "fill-danger text-danger" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Headline Score & Plain Summary Card */}
          <div className="p-4 rounded-card bg-bg-2/50 border border-glass-border flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-3">
                Overall Verified Score
              </span>
              <p className="text-xs text-text-2 leading-relaxed">
                {explainData?.headline_summary || "Multi-factor urban score evaluated across civic signals."}
              </p>
            </div>
            <ScoreRing score={place.overall_score} size={64} strokeWidth={6} label="Overall" />
          </div>

          {/* 5-Dimension Score Breakdown */}
          <div className="space-y-3 p-4 rounded-card bg-bg-2/30 border border-glass-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>5-Dimension Analysis</span>
            </h4>
            <div className="space-y-2.5 pt-1">
              <ScoreBar label="Safety & Illumination" score={place.safety_score} />
              <ScoreBar label="Cleanliness & Environment" score={place.cleanliness_score} />
              <ScoreBar label="Affordability (Price Tier)" score={place.affordability_score} />
              <ScoreBar label="Accessibility & Transit" score={place.accessibility_score} />
              <ScoreBar label="Visitor Rating" score={place.rating * 20} />
            </div>
          </div>

          {/* Plain English "Why This?" Rationale */}
          {explainData && (
            <div className="p-4 rounded-card bg-primary/10 border border-primary/30 space-y-2">
              <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Why We Recommend This</span>
              </div>
              <p className="text-xs text-text-1 leading-relaxed font-medium">
                {explainData.recommendation_why}
              </p>
              <ul className="space-y-1 pt-1 text-[11px] text-text-2 list-disc pl-4">
                {explainData.breakdown_reasons.map((r: string, idx: number) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Place Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-card bg-white/5 border border-glass-border space-y-1">
              <div className="flex items-center gap-1 text-text-3 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Hours</span>
              </div>
              <span className="text-text-1 font-medium block">08:00 AM - 10:30 PM</span>
            </div>
            <div className="p-3 rounded-card bg-white/5 border border-glass-border space-y-1">
              <div className="flex items-center gap-1 text-text-3 font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Nearby Reports</span>
              </div>
              <span className="text-text-1 font-medium block">
                {explainData?.nearby_reports_count ?? 2} civic reports nearby
              </span>
            </div>
          </div>

          {/* Actions Strip */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="primary"
              size="md"
              className="w-full gap-2 shadow-md shadow-primary/20"
              onClick={handleGetDirections}
            >
              <Navigation className="w-4 h-4" />
              <span>Get Safe Directions</span>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={handleCompare} className="gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>Compare</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenReportModal?.(place.lat, place.lng)}
                className="gap-1.5 text-caution"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report Issue</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};
