import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, IndianRupee, Star, Filter } from "lucide-react";
import { SearchInput } from "../components/SearchInput";
import { Skeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { CityMap } from "../features/map/CityMap";
import { PlaceCard, type PlaceItem } from "../features/places/PlaceCard";
import { PlaceDrawer } from "../features/places/PlaceDrawer";
import { PlaceFilterChips } from "../features/places/PlaceFilterChips";
import { NavigateConfirmModal } from "../features/places/NavigateConfirmModal";
import { OnboardingModal } from "../features/onboarding/OnboardingModal";
import { ReportModal } from "../features/reports/ReportModal";
import { useMapStore } from "../store/mapStore";
import { api } from "../lib/api";
import { cn } from "../lib/cn";

export const ExplorePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState<string>("overall");
  const [budgetFilter, setBudgetFilter] = useState<number>(0);
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmNavPlace, setConfirmNavPlace] = useState<PlaceItem | null>(null);

  const { selectedPlaceId, setSelectedPlaceId, activeLayers, toggleLayer } = useMapStore();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const { data: placesData, isLoading } = useQuery<{ items: PlaceItem[]; total: number }>({
    queryKey: ["places", selectedCategory, searchQuery, sortOption, budgetFilter, minRatingFilter],
    queryFn: () =>
      api.getPlaces({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        q: searchQuery || undefined,
        sort: sortOption,
        budget: budgetFilter > 0 ? budgetFilter : undefined,
        min_rating: minRatingFilter > 0 ? minRatingFilter : undefined,
        limit: 300,
      }),
  });

  const places = placesData?.items || [];
  const totalCount = placesData?.total ?? places.length;

  return (
    <div className="relative flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden flex flex-col md:flex-row">
      {/* Onboarding Dialog */}
      <OnboardingModal />

      {/* Left Sidebar List of Places */}
      <div className="w-full md:w-96 lg:w-[440px] h-1/2 md:h-full z-10 flex flex-col bg-bg-1/95 backdrop-blur-2xl border-r border-glass-border shrink-0 order-2 md:order-1">
        {/* Search & Filter Header */}
        <div className="p-3.5 space-y-2.5 border-b border-glass-border bg-bg-0/60">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search Pune metro, cafes, D-Mart, malls, hospitals..."
          />

          <PlaceFilterChips
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            activeLayers={activeLayers}
            onToggleLayer={toggleLayer}
          />

          {/* Secondary Filter & Sort Bar */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {/* Sort selector */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-glass-bg border border-glass-border text-xs text-text-2">
                <ArrowUpDown className="w-3 h-3 text-primary" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-transparent text-xs text-text-1 focus:outline-none cursor-pointer"
                >
                  <option value="overall" className="bg-bg-1 text-text-1">Sort: Overall Score</option>
                  <option value="safety" className="bg-bg-1 text-text-1">Sort: Safety First</option>
                  <option value="rating" className="bg-bg-1 text-text-1">Sort: Highest Rated</option>
                  <option value="affordability" className="bg-bg-1 text-text-1">Sort: Most Affordable</option>
                </select>
              </div>

              {/* Quick filter toggle button */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-colors cursor-pointer",
                  showFilters || budgetFilter > 0 || minRatingFilter > 0
                    ? "bg-primary/15 text-primary border-primary/40 font-medium"
                    : "bg-glass-bg text-text-3 border-glass-border hover:text-text-1"
                )}
              >
                <Filter className="w-3 h-3" />
                <span>Filters{(budgetFilter > 0 || minRatingFilter > 0) ? " • Active" : ""}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Filter Panel */}
          {showFilters && (
            <div className="p-2.5 rounded-xl bg-white/5 border border-glass-border space-y-2 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Budget Tier Filter */}
              <div className="flex items-center justify-between">
                <span className="text-text-3 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-secondary" /> Budget:
                </span>
                <div className="flex items-center gap-1">
                  {[
                    { val: 0, label: "Any" },
                    { val: 1, label: "₹" },
                    { val: 2, label: "₹₹" },
                    { val: 3, label: "₹₹₹" },
                    { val: 4, label: "₹₹₹₹" },
                  ].map((b) => (
                    <button
                      key={b.val}
                      type="button"
                      onClick={() => setBudgetFilter(b.val)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer",
                        budgetFilter === b.val
                          ? "bg-secondary text-white font-semibold"
                          : "bg-glass-bg text-text-2 hover:bg-white/10"
                      )}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Rating Filter */}
              <div className="flex items-center justify-between">
                <span className="text-text-3 flex items-center gap-1">
                  <Star className="w-3 h-3 text-caution" /> Min Rating:
                </span>
                <div className="flex items-center gap-1">
                  {[
                    { val: 0, label: "All" },
                    { val: 4.0, label: "4.0+" },
                    { val: 4.5, label: "4.5+" },
                    { val: 4.7, label: "4.7+" },
                  ].map((r) => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setMinRatingFilter(r.val)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer",
                        minRatingFilter === r.val
                          ? "bg-caution text-bg-0 font-bold"
                          : "bg-glass-bg text-text-2 hover:bg-white/10"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Places List View */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-text-3 font-semibold">
            <span className="text-primary font-medium">{places.length} of {totalCount} Pune Locations</span>
            <span>Live City Map Synchronized</span>
          </div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-card border border-glass-border bg-white/5 space-y-2">
                <Skeleton className="w-full h-16" />
                <Skeleton className="w-3/4 h-4" />
              </div>
            ))
          ) : places.length === 0 ? (
            <EmptyState
              title="No locations match your filter"
              description="Try adjusting your search query, price tier, or category filter."
              actionLabel="Reset All Filters"
              onAction={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setBudgetFilter(0);
                setMinRatingFilter(0);
              }}
            />
          ) : (
            places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                isSelected={place.id === selectedPlaceId || place.id === confirmNavPlace?.id}
                onSelect={() => setConfirmNavPlace(place)}
              />
            ))
          )}
        </div>
      </div>

      {/* Full Map Canvas Area */}
      <div className="flex-1 h-1/2 md:h-full relative order-1 md:order-2">
        <CityMap
          places={places}
          selectedPlaceId={selectedPlaceId || confirmNavPlace?.id || null}
          onSelectPlace={(id) => {
            const p = places.find((x) => x.id === id);
            if (p) setConfirmNavPlace(p);
          }}
          onNavigatePlace={(place) => setConfirmNavPlace(place)}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />
      </div>

      {/* Navigate Confirmation Prompt Modal */}
      <NavigateConfirmModal
        isOpen={!!confirmNavPlace}
        place={confirmNavPlace}
        onClose={() => setConfirmNavPlace(null)}
        onViewDetails={(id) => {
          setConfirmNavPlace(null);
          setSelectedPlaceId(id);
        }}
      />

      {/* Place Detail Drawer */}
      <PlaceDrawer
        placeId={selectedPlaceId}
        onClose={() => setSelectedPlaceId(null)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Citizen Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReportCreated={() => {
          setIsReportModalOpen(false);
        }}
      />
    </div>
  );
};

export default ExplorePage;
