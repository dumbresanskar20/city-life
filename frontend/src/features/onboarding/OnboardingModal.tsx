import React, { useState } from "react";
import { Utensils, Landmark, Moon, Trees, ShoppingBag, Shield, Check } from "lucide-react";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { Chip } from "../../components/Chip";
import { useUserStore, type SafetyPriority, type BudgetLevel } from "../../store/userStore";

export const OnboardingModal: React.FC = () => {
  const {
    hasCompletedOnboarding,
    setOnboardingComplete,
    interests,
    setInterests,
    budget,
    setBudget,
    safetyPriority,
    setSafetyPriority,
  } = useUserStore();

  const [step, setStep] = useState(0);

  if (hasCompletedOnboarding) return null;

  const interestOptions = [
    { id: "food", label: "Street Food & Cafes", icon: <Utensils className="w-4 h-4" /> },
    { id: "heritage", label: "Heritage & Forts", icon: <Landmark className="w-4 h-4" /> },
    { id: "nightlife", label: "Nightlife & Lounges", icon: <Moon className="w-4 h-4" /> },
    { id: "nature", label: "Tekdis & Nature", icon: <Trees className="w-4 h-4" /> },
    { id: "shopping", label: "Peths & Bazaars", icon: <ShoppingBag className="w-4 h-4" /> },
  ];

  const budgetOptions: { id: BudgetLevel; label: string; desc: string }[] = [
    { id: "low", label: "Budget-Friendly (₹)", desc: "Affordable local dining & transit" },
    { id: "medium", label: "Balanced (₹₹)", desc: "Popular cafes and landmarks" },
    { id: "high", label: "Premium (₹₹₹)", desc: "Fine dining & luxury stays" },
  ];

  const safetyOptions: { id: SafetyPriority; label: string; desc: string }[] = [
    { id: "cautious", label: "Cautious (Safety-First)", desc: "Avoid unlit stretches & high incident zones" },
    { id: "balanced", label: "Balanced", desc: "Optimal balance of route speed and safety" },
    { id: "relaxed", label: "Direct", desc: "Prioritize shortest commute times" },
  ];

  const toggleInterest = (id: string) => {
    if (interests.includes(id)) {
      setInterests(interests.filter((i) => i !== id));
    } else {
      setInterests([...interests, id]);
    }
  };

  const handleFinish = () => {
    setOnboardingComplete(true);
  };

  return (
    <Modal
      isOpen={!hasCompletedOnboarding}
      onClose={() => setOnboardingComplete(true)}
      title="Personalize CityCompass"
      subtitle={`Step ${step + 1} of 3 — Tailor your recommendations and route safety`}
    >
      <div className="space-y-6 pt-2">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-text-1">What are you exploring in Pune?</h4>
              <p className="text-xs text-text-3">Select your interests to customize the map recommendations.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {interestOptions.map((opt) => (
                <Chip
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={interests.includes(opt.id)}
                  onClick={() => toggleInterest(opt.id)}
                  className="py-2 px-3 text-xs"
                />
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-text-1">What is your typical budget preference?</h4>
              <p className="text-xs text-text-3">Affects affordability scoring across places.</p>
            </div>
            <div className="space-y-2">
              {budgetOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setBudget(opt.id)}
                  className={`p-3.5 rounded-card border cursor-pointer transition-all ${
                    budget === opt.id
                      ? "bg-primary/15 border-primary/50 text-text-1"
                      : "bg-white/5 border-glass-border text-text-2 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-text-1">{opt.label}</span>
                    {budget === opt.id && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-[11px] text-text-3 mt-0.5">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-text-1">What is your route safety preference?</h4>
              <p className="text-xs text-text-3">Determines how the safe route engine weights nighttime illumination and incident clusters.</p>
            </div>
            <div className="space-y-2">
              {safetyOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSafetyPriority(opt.id)}
                  className={`p-3.5 rounded-card border cursor-pointer transition-all ${
                    safetyPriority === opt.id
                      ? "bg-primary/15 border-primary/50 text-text-1"
                      : "bg-white/5 border-glass-border text-text-2 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-text-1">{opt.label}</span>
                    {safetyPriority === opt.id && <Shield className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-[11px] text-text-3 mt-0.5">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-glass-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOnboardingComplete(true)}
            className="text-text-3"
          >
            Skip for now
          </Button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button variant="primary" size="sm" onClick={() => setStep(step + 1)}>
                Continue
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleFinish}>
                Explore Pune
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
