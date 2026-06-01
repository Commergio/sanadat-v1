import { create } from "zustand";
import type { Company, Subscription } from "@/lib/types";

interface AppState {
  company: Company | null;
  subscription: Subscription | null;
  sidebarOpen: boolean;
  onboardingStep: number;
  setCompany: (company: Company | null) => void;
  setSubscription: (subscription: Subscription | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setOnboardingStep: (step: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  company: null,
  subscription: null,
  sidebarOpen: false,
  onboardingStep: 0,
  setCompany: (company) => set({ company }),
  setSubscription: (subscription) => set({ subscription }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
}));
