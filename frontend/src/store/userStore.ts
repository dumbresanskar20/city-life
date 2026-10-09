import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SafetyPriority = "relaxed" | "balanced" | "cautious";
export type BudgetLevel = "low" | "medium" | "high";
export type ThemeMode = "dark" | "light" | "system";

interface UserState {
  hasCompletedOnboarding: boolean;
  interests: string[];
  budget: BudgetLevel;
  safetyPriority: SafetyPriority;
  theme: ThemeMode;
  reduceEffects: boolean;
  savedPlaceIds: number[];

  setOnboardingComplete: (complete: boolean) => void;
  setInterests: (interests: string[]) => void;
  setBudget: (budget: BudgetLevel) => void;
  setSafetyPriority: (priority: SafetyPriority) => void;
  setTheme: (theme: ThemeMode) => void;
  setReduceEffects: (reduce: boolean) => void;
  toggleSavedPlace: (id: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      interests: ["food", "heritage"],
      budget: "medium",
      safetyPriority: "balanced",
      theme: "dark",
      reduceEffects: false,
      savedPlaceIds: [],

      setOnboardingComplete: (complete) => set({ hasCompletedOnboarding: complete }),
      setInterests: (interests) => set({ interests }),
      setBudget: (budget) => set({ budget }),
      setSafetyPriority: (safetyPriority) => set({ safetyPriority }),
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          const activeTheme =
            theme === "system"
              ? window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
              : theme;
          document.documentElement.setAttribute("data-theme", activeTheme);
        }
      },
      setReduceEffects: (reduceEffects) => set({ reduceEffects }),
      toggleSavedPlace: (id) =>
        set((state) => ({
          savedPlaceIds: state.savedPlaceIds.includes(id)
            ? state.savedPlaceIds.filter((p) => p !== id)
            : [...state.savedPlaceIds, id],
        })),
    }),
    {
      name: "citycompass-user-preferences",
    }
  )
);
