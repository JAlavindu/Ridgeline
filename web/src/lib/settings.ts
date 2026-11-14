import { createContext, useContext } from "react";
import type { EarthOptions, PanelType } from "../engine";

/** App-wide settings. Physics never changes with them; they are the user's mission rules. */
export interface Settings {
  earthRule: "centre" | "any_part";
  earthMarginDeg: number;      // 0..1 extra degrees Earth must clear the horizon
  panel: PanelType;
  panelFacingAzDeg: number;    // only for a fixed vertical panel
  efficiencyPct: number;       // example value only
  mastM: number;               // only for smooth-Moon and custom sites; real masks are built for 2 m
}

export const DEFAULT_SETTINGS: Settings = {
  earthRule: "centre",
  earthMarginDeg: 0,
  panel: "tracking",
  panelFacingAzDeg: 0,
  efficiencyPct: 30.7,          // Spectrolab XTJ Prime, beginning of life (plan F14), labelled "example"
  mastM: 2,
};

/** Real terrain masks were computed for this mast height, so it cannot change for those sites. */
export const MASK_MAST_M = 2;

export const STORAGE_KEY = "ridgeline.settings.v1";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // private window or blocked storage: settings just aren't remembered
  }
}

export function earthOptionsOf(settings: Settings): EarthOptions {
  return { rule: settings.earthRule, margin_deg: settings.earthMarginDeg };
}

export interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
  reset: () => {},
});

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
