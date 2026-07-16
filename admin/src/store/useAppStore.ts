import { create } from "zustand";

interface AppState {
  activeVenueId: string | null;
  activeVenueName: string | null;
  setActiveVenue: (id: string | null, name: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeVenueId: null,
  activeVenueName: null,
  setActiveVenue: (id, name) =>
    set({ activeVenueId: id, activeVenueName: name }),
}));
