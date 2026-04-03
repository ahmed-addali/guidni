"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type DestinationInfo = {
  slug: string;
  city: string;
  country: string;
};

const DEFAULT_DESTINATION: DestinationInfo = {
  slug: "djerba",
  city: "Djerba",
  country: "Tunisia",
};

type DestinationStore = {
  destination: DestinationInfo;
  setDestination: (dest: DestinationInfo) => void;
};

export const useDestinationStore = create<DestinationStore>()(
  persist(
    (set) => ({
      destination: DEFAULT_DESTINATION,
      setDestination: (dest) => set({ destination: dest }),
    }),
    {
      name: "guidni-destination",
      storage: createJSONStorage(() => {
        // SSR-safe: return a no-op storage on the server
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
    }
  )
);
