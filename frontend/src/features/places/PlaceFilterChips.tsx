import { Utensils, Bed, Landmark, Bus, Sparkles, Shield, Flame, CloudSun, ShoppingBag, Gamepad2, Trees, HeartPulse } from "lucide-react";
import { Chip } from "../../components/Chip";

export interface PlaceFilterChipsProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  activeLayers: string[];
  onToggleLayer: (layer: string) => void;
}

export const PlaceFilterChips: React.FC<PlaceFilterChipsProps> = ({
  selectedCategory,
  onSelectCategory,
  activeLayers,
  onToggleLayer,
}) => {
  const categories = [
    { id: "all", label: "All Places", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: "food", label: "Food & Cafes", icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: "transport", label: "Metro & Transit", icon: <Bus className="w-3.5 h-3.5" /> },
    { id: "shopping", label: "Malls & D-Marts", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { id: "entertainment", label: "Game Zones & Clubs", icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { id: "hotel", label: "Hotels & Stays", icon: <Bed className="w-3.5 h-3.5" /> },
    { id: "heritage", label: "Heritage & Forts", icon: <Landmark className="w-3.5 h-3.5" /> },
    { id: "park", label: "Parks & Tekdis", icon: <Trees className="w-3.5 h-3.5" /> },
    { id: "health", label: "Hospitals", icon: <HeartPulse className="w-3.5 h-3.5" /> },
  ];

  const mapLayers = [
    { id: "safety", label: "Safety Heatmap", icon: <Shield className="w-3.5 h-3.5 text-safe" /> },
    { id: "traffic", label: "Traffic Hotspots", icon: <Flame className="w-3.5 h-3.5 text-danger" /> },
    { id: "weather", label: "Weather Alerts", icon: <CloudSun className="w-3.5 h-3.5 text-info" /> },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-bg-1/80 backdrop-blur-md border border-glass-border shadow-sm">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            selected={selectedCategory === cat.id}
            onClick={() => onSelectCategory(cat.id)}
          />
        ))}
      </div>

      <div className="hidden sm:block w-px h-6 bg-glass-border mx-1" />

      <div className="flex items-center gap-1.5">
        {mapLayers.map((layer) => {
          const isSelected = activeLayers.includes(layer.id);
          return (
            <Chip
              key={layer.id}
              label={layer.label}
              icon={layer.icon}
              selected={isSelected}
              onClick={() => onToggleLayer(layer.id)}
              className={isSelected ? "bg-white/10 text-primary border-primary/50" : ""}
            />
          );
        })}
      </div>
    </div>
  );
};
