import { useMemo } from "react";

import {
  coverage,
  flatMask,
  isoToTdb,
  makeObserver,
  meanPanelIrradiance,
  outlook,
  sampleSeries,
  summarize,
  tdbToIso,
  type HorizonMask,
  type Observer,
  type Outlook,
  type Series,
  type Summary,
} from "../engine";
import { lunarSites } from "../data/lunarSites";
import { utcInputToIso } from "../lib/format";
import { sampleMinutesFor, type ScenarioCard } from "../lib/plan";
import { MASK_MAST_M, earthOptionsOf, useSettings } from "../lib/settings";
import { useEphemeris, useMask } from "./useEngine";

export type HorizonKind = "LOLA terrain" | "approximate (500 m terrain)" | "smooth Moon";

export interface ScenarioResult {
  name: string;
  lat: number;
  lon: number;
  obs: Observer;
  horizon: HorizonMask;
  horizonKind: HorizonKind;
  startTdb: number;
  series: Series;
  summary: Summary;
  look: Outlook;
  panelWm2: number;          // mean sunlight on the chosen panel (W/m2)
  electricWm2: number;       // panelWm2 x example efficiency
}

export type ScenarioState =
  | { status: "loading"; message?: string }
  | { status: "error"; message: string }
  | { status: "ready"; result: ScenarioResult };

/**
 * Everything the board shows for one card, from the real engine.
 * `customMask` is the approximate horizon for custom coordinates (null = smooth Moon, undefined = still computing).
 */
export function useScenario(card: ScenarioCard | null, customMask?: HorizonMask | null): ScenarioState {
  const { eph, error } = useEphemeris();
  const { settings } = useSettings();
  const site = card?.site;
  const preset = site?.kind === "preset" ? lunarSites.find((s) => s.id === site.siteId) : undefined;
  const { mask: realMask, loading } = useMask(preset?.id ?? "");

  return useMemo((): ScenarioState => {
    if (!card) return { status: "loading" };
    if (error) return { status: "error", message: `Could not load the ephemeris: ${error}` };
    if (!eph) return { status: "loading", message: "Downloading the Sun and Earth positions (2.8 MB, first visit only)…" };
    if (loading) return { status: "loading", message: "Loading the terrain horizon…" };
    if (card.site.kind === "custom" && customMask === undefined) {
      return { status: "loading", message: "Building the horizon from the polar terrain (6.7 MB the first time)…" };
    }

    let name: string, lat: number, lon: number;
    if (card.site.kind === "preset") {
      if (!preset || preset.latitude === null || preset.longitude === null) {
        return { status: "error", message: "This site has no coordinates." };
      }
      name = preset.name;
      lat = preset.latitude;
      lon = preset.longitude;
    } else {
      name = card.site.label;
      lat = card.site.lat;
      lon = card.site.lon;
    }

    const terrain = card.site.kind === "preset" ? realMask : (customMask ?? null);
    const mast = terrain && card.site.kind === "preset" ? MASK_MAST_M : settings.mastM;
    const obs = makeObserver(lat, lon, terrain?.site_height_m ?? 0, mast);
    const horizon = terrain ?? flatMask(obs);
    const horizonKind: HorizonKind = !terrain
      ? "smooth Moon"
      : card.site.kind === "preset"
        ? "LOLA terrain"
        : "approximate (500 m terrain)";

    try {
      const earth = earthOptionsOf(settings);
      const startTdb = isoToTdb(utcInputToIso(card.startUtc));
      // Never quietly shorten a mission: if it would run past the end of the data, say so instead.
      const { lastTdb } = coverage(eph);
      if (startTdb + card.missionDays * 86400 > lastTdb + 1) {
        const end = new Date(tdbToIso(lastTdb)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
        return {
          status: "error",
          message: `Our data ends on ${end}, and this mission would run past it. Start earlier or make it shorter.`,
        };
      }
      const series = sampleSeries(eph, obs, horizon, startTdb, card.missionDays * 24, sampleMinutesFor(card.missionDays), earth);
      const panelWm2 = meanPanelIrradiance(series, settings.panel, settings.panelFacingAzDeg);
      return {
        status: "ready",
        result: {
          name, lat, lon, obs, horizon, horizonKind, startTdb, series,
          summary: summarize(series),
          look: outlook(eph, obs, horizon, startTdb, undefined, earth),
          panelWm2,
          electricWm2: (panelWm2 * settings.efficiencyPct) / 100,
        },
      };
    } catch (err) {
      return { status: "error", message: err instanceof Error ? err.message : String(err) };
    }
  }, [eph, error, loading, realMask, customMask, card, preset, settings]);
}
