import React from "react";
import { useNavigate } from "react-router-dom";
import { Navigation, MapPin, ShieldCheck, ExternalLink, Info } from "lucide-react";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";

export interface NavigateConfirmPlace {
  id: number;
  name: string;
  category?: string;
  address?: string;
  lat: number;
  lng: number;
  safety_score?: number;
  rating?: number;
  photo_url?: string;
}

export interface NavigateConfirmModalProps {
  place: NavigateConfirmPlace | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDetails?: (placeId: number) => void;
}

export const NavigateConfirmModal: React.FC<NavigateConfirmModalProps> = ({
  place,
  isOpen,
  onClose,
  onViewDetails,
}) => {
  const navigate = useNavigate();

  if (!place) return null;

  const handleConfirmNavigation = () => {
    onClose();
    navigate(
      `/route?dest_lat=${place.lat}&dest_lng=${place.lng}&dest_name=${encodeURIComponent(
        place.name
      )}`
    );
  };

  const handleOpenGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`,
      "_blank"
    );
  };

  const handleDetails = () => {
    onClose();
    if (onViewDetails) {
      onViewDetails(place.id);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Get Directions"
      subtitle="Plan your journey to this location"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Place Summary Card */}
        <div className="p-4 rounded-card bg-bg-2/50 border border-glass-border space-y-3">
          <div className="flex items-start gap-3">
            {place.photo_url ? (
              <img
                src={place.photo_url}
                alt={place.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-glass-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <Navigation className="w-7 h-7" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  {place.category || "Location"}
                </span>
                {place.safety_score !== undefined && (
                  <Badge
                    variant={place.safety_score >= 80 ? "safe" : "caution"}
                    className="py-0 text-[10px]"
                  >
                    <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                    {Math.round(place.safety_score)}% Safe
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-bold text-text-1 truncate mt-0.5">{place.name}</h3>
              <p className="text-xs text-text-3 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0 text-text-3" />
                <span className="truncate">{place.address || "Pune, Maharashtra"}</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-text-2 bg-primary/5 p-2.5 rounded-lg border border-primary/15 leading-relaxed">
            Do you want to get verified safe route directions to <span className="font-semibold text-text-1">{place.name}</span> from your current location?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <Button
            variant="primary"
            size="md"
            className="w-full gap-2 shadow-lg shadow-primary/25 font-bold"
            onClick={handleConfirmNavigation}
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>Yes, Show Route from My Location</span>
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-1.5 text-text-2 hover:text-text-1"
              onClick={handleDetails}
            >
              <Info className="w-3.5 h-3.5" />
              <span>View Details</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-1.5 text-text-2 hover:text-text-1"
              onClick={handleOpenGoogleMaps}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
