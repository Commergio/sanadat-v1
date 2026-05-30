import { create } from "zustand";
import { buildDemoCompany } from "@/lib/company-local-storage";
import type { Company, Subscription } from "@/lib/types";
import { mockSubscription } from "@/lib/mock-data";

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
  company: buildDemoCompany(),
  subscription: mockSubscription as unknown as Subscription,
  sidebarOpen: false,
  onboardingStep: 0,
  setCompany: (company) => set({ company }),
  setSubscription: (subscription) => set({ subscription }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
}));
