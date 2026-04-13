"use client";

import { create } from "zustand";

interface UserProfile {
  name: string;
  party: string;
  city: string;
  state: string;
  email: string;
}

interface UserState {
  profile: UserProfile;
  hasCompletedOnboarding: boolean;
  setProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: {
    name: "",
    party: "",
    city: "",
    state: "",
    email: "",
  },
  hasCompletedOnboarding: false,
  setProfile: (updates) =>
    set((s) => ({ profile: { ...s.profile, ...updates } })),
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
}));
