import { earthVisibility, DEFAULT_EARTH_OPTIONS, type EarthOptions } from "./earth";
import { coverage, type Ephemeris } from "./ephemeris";
import { skyAt, type BodyPosition, type Observer } from "./geometry";
import type { HorizonMask } from "./mask";
import { sunlight } from "./sunlight";
import { tdbToIso } from "./time";

export interface SkyState {
  time_utc: string;
  sun: BodyPosition;
  earth: BodyPosition;
  sun_earth_sep_deg: number;
  sun_visible_fraction: number;          // F11 and F12 combined (0..1)
  solar_flux_w_m2: number;               // F13
  is_sun_visible: boolean;
  is_earth_visible: boolean;
  is_eclipse: boolean;
  terrain_elev_at_sun_az: number;
  terrain_elev_at_earth_az: number;
  earth_margin_deg: number;
  sun_elevation_rate_deg_per_hr: number; // measured over one minute
}

export function skyState(
  eph: Ephemeris,
  obs: Observer,
  mask: HorizonMask,
  tdbS: number,
  earthOptions: EarthOptions = DEFAULT_EARTH_OPTIONS,
): SkyState {
  const view = skyAt(eph, obs, tdbS);
  const light = sunlight(view.sun, view.earth, view.sun_earth_sep_deg, mask);
  const dte = earthVisibility(view.earth, mask, earthOptions);

  // Sun height one minute later (or earlier at the very end of the file) gives the rate.
  const { lastTdb } = coverage(eph);
  const step = tdbS + 60 <= lastTdb ? 60 : -60;
  const later = skyAt(eph, obs, tdbS + step).sun.el_deg;
  const rate = ((later - view.sun.el_deg) / step) * 3600;

  return {
    time_utc: tdbToIso(tdbS),
    sun: view.sun,
    earth: view.earth,
    sun_earth_sep_deg: view.sun_earth_sep_deg,
    sun_visible_fraction: light.visible_fraction,
    solar_flux_w_m2: light.irradiance_w_m2,
    is_sun_visible: light.visible_fraction > 0,
    is_earth_visible: dte.visible,
    is_eclipse: light.eclipse_fraction < 1,
    terrain_elev_at_sun_az: light.horizon_deg,
    terrain_elev_at_earth_az: dte.horizon_deg,
    earth_margin_deg: dte.margin_deg,
    sun_elevation_rate_deg_per_hr: rate,
  };
}
