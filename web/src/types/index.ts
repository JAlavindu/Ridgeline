export interface Site {
  id: string;
  name: string;
  program: string;
  country: string;
  lat: number;
  lon: number;
  height_m: number | null;
  status: string;
  date: string | null;
  coord_source: string;
  coord_frame: string;
  notes?: string;
}

export interface HorizonMask {
  az_step_deg: number;
  elev_deg: number[];
  elev_lo_deg: number[] | null;
  elev_hi_deg: number[] | null;
  radius_km: number;
  dems_used: string[];
  observer_height_m: number;
  site_height_m?: number | null;
  site_id?: string;
  site_name?: string;
  lat?: number;
  lon?: number;
  label?: string;
  _comment?: string;
}

export interface BodyPosition {
  az_deg: number;
  el_deg: number;
  dist_km: number;
  angular_radius_deg: number;
}

export interface SkyState {
  time_utc: string;
  sun: BodyPosition;
  earth: BodyPosition;
  sun_earth_sep_deg: number;
  sun_visible_fraction: number; // 0 to 1 (Formula F11)
  solar_flux_w_m2: number;       // S = 1361 * (1AU/dist)^2 * fraction (Formula F13)
  is_sun_visible: boolean;
  is_earth_visible: boolean;
  is_eclipse: boolean;
  terrain_elev_at_sun_az: number;
  terrain_elev_at_earth_az: number;
  sun_elevation_rate_deg_per_hr: number; // Formula F7
}

export interface CountdownWindow {
  event: 'sunset' | 'sunrise' | 'earthset' | 'earthrise';
  nominal_hours: number;
  earliest_hours: number;
  latest_hours: number;
  uncertainty_hours: number;
  formatted_target_utc: string;
}

export interface TimelineHour {
  time_utc: string;
  sun_el: number;
  earth_el: number;
  sun_terrain_el: number;
  earth_terrain_el: number;
  sun_fraction: number;
  is_sunlit: boolean;
  is_partial: boolean;
  is_dark: boolean;
  is_earth_visible: boolean;
  is_eclipse: boolean;
  is_both: boolean;
}

export interface SlipDataPoint {
  slip_days: number;
  target_date: string;
  sunlight_percent: number;      // % sunlit over mission duration
  earth_visible_percent: number; // % Earth visible over mission duration
  combined_percent: number;      // % both sun and Earth
  longest_night_hours: number;   // Longest darkness stretch
  is_viable: boolean;            // meets mission criteria
}

export interface TileData3D {
  site_id: string;
  grid_size: number; // e.g. 80 x 80
  spacing_m: number; // e.g. 50m
  elevations: number[][]; // height in meters relative to site
  slopes_deg: number[][]; // slope in degrees
  avg_sunlight_pct: number[][]; // 0 - 100%
  center_lat: number;
  center_lon: number;
}

export interface NeighbourhoodCrop {
  site_id: string;
  site_name: string;
  width_km: number;
  height_km: number;
  grid_size: number; // e.g. 60 x 60
  grid: number[][]; // 0-100% average illumination
  site_x_norm: number; // 0..1 location of site
  site_y_norm: number;
}

export type AppMode = 'explore' | 'plan';
