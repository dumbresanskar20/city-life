import React, { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Compass,
  ShieldCheck,
  Route as RouteIcon,
  Scale,
  ArrowRight,
  Sparkles,
  Camera,
  Cpu,
  Flame,
  Navigation,
} from "lucide-react";
import { Button } from "../components/Button";
import { GlassCard } from "../components/GlassCard";
import { Skeleton } from "../components/Skeleton";

const CityHero = lazy(() => import("../three/CityHero"));

export const LandingPage: React.FC = () => {
  const coreLoopSteps = [
    {
      step: "01",
      icon: <Camera className="w-5 h-5 text-primary" />,
      title: "Citizen Report",
      desc: "Instant submission with text, photos, or voice notes.",
    },
    {
      step: "02",
      icon: <Cpu className="w-5 h-5 text-secondary" />,
      title: "AI Credibility Engine",
      desc: "NLP, photo classifier & spatial-temporal corroboration (0-100 score).",
    },
    {
      step: "03",
      icon: <Flame className="w-5 h-5 text-caution" />,
      title: "Live Heatmap Update",
      desc: "Verified reports dynamically reshape DBSCAN hotspots and safety scores.",
    },
    {
      step: "04",
      icon: <Navigation className="w-5 h-5 text-safe" />,
      title: "Actionable Safe Route",
      desc: "Clear navigation tradeoffs: 'Route B: +4 min, 38% lower risk'.",
    },
  ];

  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
      title: "Citizen Reports with AI Verification",
      desc: "Eliminates rumor and noise. Every citizen report is cross-referenced with photo classification, nearby reports, and historical credibility before it impacts city scores.",
      badge: "Credibility 0-100",
    },
    {
      icon: <RouteIcon className="w-6 h-6 text-secondary" />,
      title: "Safe-Route Engine",
      desc: "Never just the shortest distance. Evaluates lighting, verified incidents, and time of day to give commuters and tourists provably safer alternatives.",
      badge: "Multi-Criteria Routing",
    },
    {
      icon: <Scale className="w-6 h-6 text-caution" />,
      title: "5-Dimension Place Comparison",
      desc: "Compare landmarks, cafes, and neighborhoods side-by-side across Safety, Cleanliness, Affordability, Ratings, and Accessibility with AI verdicts.",
      badge: "Radar Insights",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with 3D Canvas */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-glass-border">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Suspense fallback={<Skeleton className="w-full h-full" />}>
            <CityHero />
          </Suspense>
        </div>

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 z-1 pointer-events-none bg-gradient-to-t from-bg-0 via-transparent to-bg-0/60" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Pune Smart Exploration MVP</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-text-1 max-w-4xl mx-auto leading-[1.1]"
          >
            Your city, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">verified.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-text-2 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Convert scattered urban data into verified, actionable intelligence. Explore trusted places, report civic hazards with AI validation, and travel with safer night routes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
          >
            <Link to="/explore">
              <Button size="lg" variant="primary" className="gap-2 shadow-lg shadow-primary/25">
                <span>Explore the City</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/route">
              <Button size="lg" variant="secondary" className="gap-2">
                <span>See Safe Routes</span>
                <RouteIcon className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 4-Step How It Works Strip (The Core Loop) */}
      <section className="w-full py-16 bg-bg-1/40 border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">The Closed-Loop Engine</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-1">How CityCompass Verifies the City</h2>
            <p className="text-xs sm:text-sm text-text-3">
              Citizen reports directly update safety heatmaps and intelligent routing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coreLoopSteps.map((item, idx) => (
              <GlassCard key={idx} className="relative space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="font-mono text-2xl font-black text-white/10">{item.step}</span>
                </div>
                <h3 className="text-sm font-bold text-text-1">{item.title}</h3>
                <p className="text-xs text-text-2 leading-relaxed">{item.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Core Feature Highlights */}
      <section className="w-full py-20 bg-bg-0">
        <div className="max-w-7xl mx-auto px-4 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Feature Highlights</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-1">Built for Commuters, Tourists & Locals</h2>
            <p className="text-sm text-text-2">
              Actionable answers instead of raw data dumps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <GlassCard key={idx} enableTilt glow className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-glass-border flex items-center justify-center">
                  {feat.icon}
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/5 text-primary border border-white/10">
                  {feat.badge}
                </div>
                <h3 className="text-base font-bold text-text-1">{feat.title}</h3>
                <p className="text-xs text-text-2 leading-relaxed">{feat.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-10 border-t border-glass-border bg-bg-1/40 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <span className="font-semibold text-text-2">CityCompass</span>
            <span>— Your city, verified.</span>
          </div>
          <div>Configured City: <strong className="text-text-1 font-semibold">Pune, Maharashtra</strong> (Zero Docker containerless architecture)</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
