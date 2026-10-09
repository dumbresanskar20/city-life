import React from "react";
import { Star, ShieldCheck, Heart } from "lucide-react";
import { GlassCard } from "../../components/GlassCard";
import { ScoreRing } from "../../components/ScoreRing";
import { Badge } from "../../components/Badge";
import { useUserStore } from "../../store/userStore";

export interface PlaceItem {
  id: number;
  name: string;
  category: string;
  subcategory?: string;
  lat: number;
  lng: number;
  address?: string;
  price_level: number;
  rating: number;
  rating_count: number;
  tags?: string[];
  cleanliness_score: number;
  safety_score: number;
  affordability_score: number;
  accessibility_score: number;
  overall_score: number;
  photo_url?: string;
}

export interface PlaceCardProps {
  place: PlaceItem;
  isSelected?: boolean;
  onSelect: () => void;
  onHover?: (hovered: boolean) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSelected,
  onSelect,
  onHover,
}) => {
  const { savedPlaceIds, toggleSavedPlace } = useUserStore();
  const isSaved = savedPlaceIds.includes(place.id);

  const priceSymbols = "₹".repeat(place.price_level || 1);

  return (
    <GlassCard
      enableTilt
      glow
      onClick={onSelect}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={`p-3.5 transition-all select-none ${
        isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-white/20"
      }`}
    >
      <div className="flex gap-3">
        {/* Photo thumbnail */}
        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-glass-border relative">
          <img
            src={
              place.photo_url ||
              "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=400&auto=format&fit=crop&q=80"
            }
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSavedPlace(place.id);
            }}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 backdrop-blur-md text-white hover:text-danger transition-colors cursor-pointer"
          >
            <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-danger text-danger" : ""}`} />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                {place.category}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-text-2">
                <Star className="w-3 h-3 text-caution fill-caution" />
                <span>{place.rating}</span>
                <span className="text-text-3 font-normal">({place.rating_count})</span>
              </div>
            </div>
            <h3 className="text-sm font-bold text-text-1 truncate mt-0.5">{place.name}</h3>
            <p className="text-[11px] text-text-3 truncate">{place.address || "Pune, Maharashtra"}</p>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-glass-border">
            <span className="font-mono text-xs font-semibold text-text-2">{priceSymbols}</span>
            <div className="flex items-center gap-1.5">
              <Badge variant={place.safety_score >= 80 ? "safe" : "caution"} className="py-0 text-[10px]">
                <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                {Math.round(place.safety_score)}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Score Ring */}
        <div className="shrink-0 flex items-center justify-center pl-1">
          <ScoreRing score={place.overall_score} size={46} strokeWidth={4} />
        </div>
      </div>
    </GlassCard>
  );
};
