import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  Compass,
  MapPin,
  Shield,
  Route as RouteIcon,
  Landmark,
  Scale,
  LayoutDashboard,
  Sun,
  Moon,
  Sparkles,
  CloudSun,
  Info,
  Menu,
  X,
} from "lucide-react";
import { useUserStore } from "../store/userStore";
import { ToastContainer } from "../components/Toast";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
import { cn } from "../lib/cn";

export const Shell: React.FC = () => {
  const location = useLocation();
  const { theme, setTheme, reduceEffects, setReduceEffects } = useUserStore();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync theme to document body
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const navLinks = [
    { to: "/explore", label: "Explore", icon: <MapPin className="w-4 h-4" /> },
    { to: "/route", label: "Safe Route", icon: <RouteIcon className="w-4 h-4" /> },
    { to: "/safety", label: "Safety Map", icon: <Shield className="w-4 h-4" /> },
    { to: "/heritage", label: "Heritage", icon: <Landmark className="w-4 h-4" /> },
    { to: "/compare", label: "Compare", icon: <Scale className="w-4 h-4" /> },
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-0 text-text-1">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-bg-0/80 backdrop-blur-xl border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Tagline */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-bg-0 font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-bg-0 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-text-1 block leading-none">
                CityCompass
              </span>
              <span className="text-[10px] text-text-3 font-medium block mt-0.5">
                Your city, verified.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-xs font-medium transition-all",
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                      : "text-text-2 hover:text-text-1 hover:bg-white/5"
                  )}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Header Controls */}
          <div className="flex items-center gap-2">
            {/* Demo data badge */}
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/30 text-[11px] font-medium hover:bg-secondary/25 transition-colors cursor-pointer"
            >
              <Info className="w-3 h-3" />
              <span>Demo Data</span>
            </button>

            {/* Weather pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-glass-bg border border-glass-border text-xs text-text-2">
              <CloudSun className="w-3.5 h-3.5 text-caution" />
              <span>28°C Pune</span>
            </div>

            {/* Reduce effects toggle */}
            <button
              type="button"
              onClick={() => setReduceEffects(!reduceEffects)}
              title={reduceEffects ? "Enable 3D & animations" : "Reduce motion & effects"}
              className={cn(
                "p-2 rounded-input border transition-colors cursor-pointer",
                reduceEffects
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-glass-bg text-text-3 border-glass-border hover:text-text-1"
              )}
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="p-2 rounded-input bg-glass-bg text-text-2 border border-glass-border hover:text-text-1 transition-colors cursor-pointer"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-caution" /> : <Moon className="w-4 h-4 text-secondary" />}
            </button>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-input bg-glass-bg text-text-2 border border-glass-border"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden p-4 border-t border-glass-border bg-bg-1/95 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-card text-sm font-medium",
                  location.pathname === link.to ? "bg-primary/15 text-primary" : "text-text-2 hover:bg-white/5"
                )}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Demo Data Transparency Modal */}
      <Modal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        title="Transparency: Data Sources & Honest Labeling"
        subtitle="CityCompass MVP Verification Standards"
      >
        <div className="space-y-4 text-xs text-text-2 leading-relaxed">
          <p>
            In accordance with <strong>Rule #5 (Never invent data and present it as real)</strong>:
          </p>
          <div className="space-y-2">
            <div className="p-3 rounded-card bg-white/5 border border-glass-border">
              <span className="font-semibold text-text-1 block mb-0.5">Real Data:</span>
              <p>Geographic coordinates, road geometry, landmark locations, and Overpass OSM features across Pune.</p>
            </div>
            <div className="p-3 rounded-card bg-white/5 border border-glass-border">
              <span className="font-semibold text-text-1 block mb-0.5">Synthetic Data:</span>
              <p>~300 citizen incident reports and hotspot clusters generated with realistic spatial clustering, time decay, and credibility distributions for live testing.</p>
            </div>
            <div className="p-3 rounded-card bg-white/5 border border-glass-border">
              <span className="font-semibold text-text-1 block mb-0.5">Mocks & Heuristics:</span>
              <p>OpenRouteService multi-alternative path routing, diurnal weather forecasting model, and Claude AI story synthesis with deterministic fallback caches.</p>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setShowDemoModal(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
