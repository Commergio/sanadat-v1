import { create } from "zustand";
import type { Company, Subscription } from "@/lib/types";
import { mockCompany, mockSubscription } from "@/lib/mock-data";

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
  company: mockCompany as unknown as Company,
  subscription: mockSubscription as unknown as Subscription,
  sidebarOpen: false,
  onboardingStep: 0,
  setCompany: (company) => set({ company }),
  setSubscription: (subscription) => set({ subscription }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
}));
