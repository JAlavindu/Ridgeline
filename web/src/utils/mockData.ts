import type { Site, HorizonMask, SkyState, CountdownWindow, TimelineHour, SlipDataPoint, TileData3D, NeighbourhoodCrop } from '../types';
import {
  sunVisibleFraction,
  solarFluxWm2,
  sunElevationRateDegPerHr,
  countdownUncertaintyHours,
} from './math';

export const SAMPLE_SITES: Site[] = [
  {
    id: "connecting_ridge",
    name: "Connecting Ridge (Shackleton-de Gerlache)",
    program: "Artemis candidate",
    country: "USA",
    lat: -89.45,
    lon: 222.5,
    height_m: 1650,
    status: "candidate",
    date: "2026-11-14",
    coord_source: "NASA PGDA 90 / Gläser et al. 2018",
    coord_frame: "MOON_ME",
    notes: "High illumination peak (~86-88% annual sunlight) along the ridge connecting Shackleton and de Gerlache craters."
  },
  {
    id: "malapert_massif",
    name: "Malapert Massif (Artemis III Candidate)",
    program: "Artemis candidate",
    country: "USA",
    lat: -85.99,
    lon: 2.93,
    height_m: 5040,
    status: "candidate",
    date: "2026-11-14",
    coord_source: "NASA Artemis III candidate regions",
    coord_frame: "MOON_ME",
    notes: "Elevated massif with persistent direct-to-Earth communication and long solar windows."
  },
  {
    id: "shackleton_site004",
    name: "Site 004 (near Shackleton Crater Rim)",
    program: "Artemis candidate",
    country: "USA",
    lat: -89.78,
    lon: 130.0,
    height_m: 1200,
    status: "candidate",
    date: "2026-11-14",
    coord_source: "NASA LROC / Barker 2021",
    coord_frame: "MOON_ME",
    notes: "Just 0.22° (~6.7 km) from the South Pole. Sub-horizon depressions cause deep shadows."
  },
  {
    id: "im1",
    name: "IM-1 Odysseus (Malapert A)",
    program: "CLPS",
    country: "USA",
    lat: -80.13,
    lon: 1.44,
    height_m: -2800,
    status: "landed",
    date: "2024-02-22",
    coord_source: "NASA LRO / Intuitive Machines",
    coord_frame: "MOON_ME",
    notes: "First commercial landing near south pole. Landed on 12° slope in Malapert A crater."
  },
  {
    id: "apollo11",
    name: "Apollo 11 (Tranquility Base)",
    program: "Apollo",
    country: "USA",
    lat: 0.67416,
    lon: 23.47314,
    height_m: -1926,
    status: "landed",
    date: "1969-07-20",
    coord_source: "LROC Coordinates of Human Features",
    coord_frame: "MOON_ME",
    notes: "Equatorial landing site. High daily solar swing (0° to 90°), Earth near zenith (~60° elevation)."
  }
];

/**
 * Generate a horizon profile for a site.
 * Default resolution is 0.25° (1,440 values) as per M3 contract update.
 * elev_lo_deg and elev_hi_deg are null for initial test masks.
 */
export function generateHorizonMask(site: Site, az_step_deg: number = 0.25): HorizonMask {
  const elev_deg: number[] = [];
  const count = Math.round(360 / az_step_deg); // 1,440 values for 0.25°

  // Deterministic seed based on site
  const isPolar = Math.abs(site.lat) > 80;
  const baseElev = isPolar ? 1.4 : 0.4;
  const amp = isPolar ? 2.5 : 1.2;
  const freq = isPolar ? 3 : 5;

  for (let i = 0; i < count; i++) {
    const az = i * az_step_deg;
    const azRad = (az * Math.PI) / 180;
    
    // Multi-frequency lunar mountain profile
    const hill1 = Math.sin(azRad * freq) * amp;
    const hill2 = Math.cos(azRad * (freq * 2.3) + 1.2) * (amp * 0.4);
    const craterWall = Math.sin(azRad * 1.5 - 0.5) > 0.6 ? 2.2 : 0;
    const roughness = (Math.sin(i * 13.7) % 0.3) * 0.4;

    const nominal = Math.max(-0.5, baseElev + hill1 + hill2 + craterWall + roughness);

    elev_deg.push(Number(nominal.toFixed(3)));
  }

  return {
    az_step_deg,
    elev_deg,
    elev_lo_deg: null,
    elev_hi_deg: null,
    radius_km: isPolar ? 250 : 150,
    dems_used: isPolar ? ["PGDA_78_5m", "PGDA_90_20m", "PGDA_90_240m"] : ["USGS_LOLA_118m"],
    observer_height_m: 2.0,
    site_height_m: site.height_m ?? (isPolar ? 1650 : 0),
    site_id: site.id,
    label: "synthetic",
  };
}

/**
 * Calculate dynamic SkyState for a site at a given time offset (hours from base date)
 */
export function computeSkyState(site: Site, hoursOffset: number, mask: HorizonMask): SkyState {
  const isPolar = Math.abs(site.lat) > 80;
  
  // Sun calculation: synodic period ~ 708.73 hours (29.53 days)
  const synodicPeriodHrs = 29.530589 * 24.0;
  const phase = ((hoursOffset % synodicPeriodHrs) + synodicPeriodHrs) % synodicPeriodHrs;
  const sunAzDeg = ((phase / synodicPeriodHrs) * 360.0 + (site.lon + 180)) % 360.0;

  // Elevation physics:
  // Near pole: swing is small (±(90 - |lat| + 1.54°))
  // Equatorial: swing goes 0 to 90°
  let sunElDeg: number;
  if (isPolar) {
    const colat = 90.0 - Math.abs(site.lat);
    const seasonalTilt = 1.54 * Math.sin((hoursOffset / (346.6 * 24.0)) * 2 * Math.PI);
    sunElDeg = colat * Math.cos((sunAzDeg * Math.PI) / 180) + seasonalTilt + 0.8;
  } else {
    sunElDeg = 90.0 * Math.sin(((phase / synodicPeriodHrs) * 2 * Math.PI));
  }

  // Earth position: libration box (±8.16° E-W, ±6.87° N-S)
  // Sub-Earth point wanders around (0, 0)
  const librationT = (hoursOffset / (27.321661 * 24.0)) * 2 * Math.PI;
  const libLon = 8.16 * Math.sin(librationT);
  const libLat = 6.87 * Math.cos(librationT * 1.05);

  let earthAzDeg: number;
  let earthElDeg: number;

  if (isPolar) {
    // Near south pole, Earth sits low near North azimuth
    earthAzDeg = (360 + (site.lon * -1) + libLon * 2) % 360;
    earthElDeg = (90.0 - Math.abs(site.lat)) + libLat + 2.5; // low near horizon
  } else {
    // Equatorial
    earthAzDeg = 90 + libLon;
    earthElDeg = 65 + libLat;
  }

  // Sample terrain horizon at Sun and Earth azimuths (dynamically using mask.az_step_deg)
  const numSteps = mask.elev_deg.length;
  const getIndex = (azDeg: number) => {
    const wrapped = ((azDeg % 360) + 360) % 360;
    return Math.min(numSteps - 1, Math.max(0, Math.floor(wrapped / mask.az_step_deg) % numSteps));
  };
  const sunIndex = getIndex(sunAzDeg);
  const earthIndex = getIndex(earthAzDeg);

  const terrainAtSun = mask.elev_deg[sunIndex] ?? 0;
  const terrainAtEarth = mask.elev_deg[earthIndex] ?? 0;

  // Distances and Radii
  const sunDistKm = 149597870.7 * (1.0 - 0.0167 * Math.cos((hoursOffset / 8766.0) * 2 * Math.PI));
  const earthDistKm = 384400.0 + 25000.0 * Math.sin(librationT);
  const sunAngularRadius = 0.267;
  const earthAngularRadius = 0.95;

  // Visible fraction and solar flux
  const sunFrac = sunVisibleFraction(sunElDeg, terrainAtSun, sunAngularRadius);
  const flux = solarFluxWm2(sunDistKm, sunFrac);

  // Separation for eclipse test
  const azDiff = Math.abs(sunAzDeg - earthAzDeg);
  const elDiff = Math.abs(sunElDeg - earthElDeg);
  const sepDeg = Math.sqrt(azDiff * azDiff + elDiff * elDiff);
  const isEclipse = sepDeg < (sunAngularRadius + earthAngularRadius);

  // Rate of solar elevation
  const rateDegPerHr = sunElevationRateDegPerHr(site.lat);

  const baseDate = new Date(site.date ? `${site.date}T00:00:00Z` : "2026-11-14T09:00:00Z");
  const currentTime = new Date(baseDate.getTime() + hoursOffset * 3600 * 1000);

  return {
    time_utc: currentTime.toISOString().replace(".000", ""),
    sun: {
      az_deg: Number(sunAzDeg.toFixed(2)),
      el_deg: Number(sunElDeg.toFixed(2)),
      dist_km: Math.round(sunDistKm),
      angular_radius_deg: sunAngularRadius,
    },
    earth: {
      az_deg: Number(earthAzDeg.toFixed(2)),
      el_deg: Number(earthElDeg.toFixed(2)),
      dist_km: Math.round(earthDistKm),
      angular_radius_deg: earthAngularRadius,
    },
    sun_earth_sep_deg: Number(sepDeg.toFixed(2)),
    sun_visible_fraction: Number(sunFrac.toFixed(3)),
    solar_flux_w_m2: Math.round(flux),
    is_sun_visible: sunFrac > 0.01,
    is_earth_visible: earthElDeg > terrainAtEarth,
    is_eclipse: isEclipse,
    terrain_elev_at_sun_az: Number(terrainAtSun.toFixed(2)),
    terrain_elev_at_earth_az: Number(terrainAtEarth.toFixed(2)),
    sun_elevation_rate_deg_per_hr: Number(rateDegPerHr.toFixed(3)),
  };
}

/**
 * Generate countdown uncertainty windows (F8)
 */
export function computeCountdowns(site: Site, currentHours: number, mask: HorizonMask): CountdownWindow[] {
  const uncertDeg = (mask.elev_hi_deg && mask.elev_hi_deg[0] != null)
    ? Math.abs(mask.elev_hi_deg[0] - mask.elev_deg[0])
    : 0.15;
  const uncertHrs = Number(countdownUncertaintyHours(uncertDeg, site.lat).toFixed(1));

  // Determine hours until next sunset / sunrise
  const nominalSunset = 48.5;
  const nominalSunrise = 120.0;
  const nominalEarthset = 64.0;
  const nominalEarthrise = 18.0;

  const baseDate = new Date(site.date ? `${site.date}T00:00:00Z` : "2026-11-14T09:00:00Z");
  const targetSunset = new Date(baseDate.getTime() + (currentHours + nominalSunset) * 3600000);

  return [
    {
      event: 'sunset',
      nominal_hours: nominalSunset,
      earliest_hours: Math.max(0, Number((nominalSunset - uncertHrs).toFixed(1))),
      latest_hours: Number((nominalSunset + uncertHrs).toFixed(1)),
      uncertainty_hours: uncertHrs,
      formatted_target_utc: targetSunset.toISOString().replace(".000", ""),
    },
    {
      event: 'sunrise',
      nominal_hours: nominalSunrise,
      earliest_hours: Number((nominalSunrise - uncertHrs).toFixed(1)),
      latest_hours: Number((nominalSunrise + uncertHrs).toFixed(1)),
      uncertainty_hours: uncertHrs,
      formatted_target_utc: new Date(baseDate.getTime() + (currentHours + nominalSunrise) * 3600000).toISOString().replace(".000", ""),
    },
    {
      event: 'earthset',
      nominal_hours: nominalEarthset,
      earliest_hours: Number((nominalEarthset - uncertHrs * 0.8).toFixed(1)),
      latest_hours: Number((nominalEarthset + uncertHrs * 0.8).toFixed(1)),
      uncertainty_hours: Number((uncertHrs * 0.8).toFixed(1)),
      formatted_target_utc: new Date(baseDate.getTime() + (currentHours + nominalEarthset) * 3600000).toISOString().replace(".000", ""),
    },
    {
      event: 'earthrise',
      nominal_hours: nominalEarthrise,
      earliest_hours: Number((nominalEarthrise - uncertHrs * 0.8).toFixed(1)),
      latest_hours: Number((nominalEarthrise + uncertHrs * 0.8).toFixed(1)),
      uncertainty_hours: Number((uncertHrs * 0.8).toFixed(1)),
      formatted_target_utc: new Date(baseDate.getTime() + (currentHours + nominalEarthrise) * 3600000).toISOString().replace(".000", ""),
    }
  ];
}

/**
 * Generate 720 hours (30 lunar days) of timeline data
 */
export function generateTimelineHours(site: Site, mask: HorizonMask, startOffsetHrs: number = 0, totalHours: number = 360): TimelineHour[] {
  const list: TimelineHour[] = [];
  for (let h = 0; h < totalHours; h += 2) {
    const state = computeSkyState(site, startOffsetHrs + h, mask);
    const isFull = state.sun_visible_fraction > 0.90;
    const isPart = state.sun_visible_fraction > 0.01 && state.sun_visible_fraction <= 0.90;
    const isDark = state.sun_visible_fraction <= 0.01;

    list.push({
      time_utc: state.time_utc,
      sun_el: state.sun.el_deg,
      earth_el: state.earth.el_deg,
      sun_terrain_el: state.terrain_elev_at_sun_az,
      earth_terrain_el: state.terrain_elev_at_earth_az,
      sun_fraction: state.sun_visible_fraction,
      is_sunlit: isFull,
      is_partial: isPart,
      is_dark: isDark,
      is_earth_visible: state.is_earth_visible,
      is_eclipse: state.is_eclipse,
      is_both: (isFull || isPart) && state.is_earth_visible && !state.is_eclipse,
    });
  }
  return list;
}

/**
 * Generate launch slip scenario data for ±60 days
 */
export function generateSlipData(site: Site): SlipDataPoint[] {
  const points: SlipDataPoint[] = [];
  const baseDate = new Date(site.date ? `${site.date}T00:00:00Z` : "2026-11-14T00:00:00Z");

  for (let slip = -60; slip <= 60; slip += 2) {
    const target = new Date(baseDate.getTime() + slip * 86400000);
    // Synodic cycle variation (29.53 days)
    const cyclePhase = ((slip % 29.53) + 29.53) % 29.53;
    const normalizedPhase = (cyclePhase / 29.53) * 2 * Math.PI;

    const isPolar = Math.abs(site.lat) > 80;
    let sunlightPct: number;
    let earthPct: number;
    let longestNight: number;

    if (isPolar) {
      // Polar ridge characteristics
      sunlightPct = Math.round(75 + 18 * Math.cos(normalizedPhase));
      earthPct = Math.round(82 + 12 * Math.sin((slip / 27.3) * 2 * Math.PI));
      longestNight = Math.round(Math.max(12, 120 * (1 - (sunlightPct / 100))));
    } else {
      // Equatorial: strictly ~50% sunlight, ~14.77 days night
      sunlightPct = 50;
      earthPct = 100;
      longestNight = 354; // ~14.75 days
    }

    const combined = Math.round((sunlightPct * earthPct) / 100);
    const viable = sunlightPct >= 65 && longestNight < 72;

    points.push({
      slip_days: slip,
      target_date: target.toISOString().split('T')[0],
      sunlight_percent: sunlightPct,
      earth_visible_percent: earthPct,
      combined_percent: combined,
      longest_night_hours: longestNight,
      is_viable: viable,
    });
  }

  return points;
}

/**
 * Generate 3D height, slope, and sunlight tile (aeqd projection)
 */
export function generate3DTile(site: Site, gridSize: number = 64, spacingM: number = 75): TileData3D {
  const elevations: number[][] = [];
  const slopes_deg: number[][] = [];
  const avg_sunlight_pct: number[][] = [];

  const isPolar = Math.abs(site.lat) > 80;
  const peakHeight = isPolar ? 1200 : 400;

  for (let i = 0; i < gridSize; i++) {
    const rowElev: number[] = [];
    const rowSlope: number[] = [];
    const rowSun: number[] = [];

    const y = (i - gridSize / 2) / (gridSize / 2); // -1 to 1

    for (let j = 0; j < gridSize; j++) {
      const x = (j - gridSize / 2) / (gridSize / 2); // -1 to 1
      const distFromCenter = Math.sqrt(x * x + y * y);

      // Crater / Ridge topography
      const ridge = Math.exp(-Math.pow(y * 2.5 - Math.sin(x * 3) * 0.4, 2)) * peakHeight;
      const crater = Math.exp(-Math.pow(distFromCenter * 3 - 1.2, 2)) * -600;
      const noise = Math.sin(x * 12) * Math.cos(y * 12) * 50;

      const elev = Math.round(ridge + crater + noise);
      const slope = Math.min(45, Math.max(1, Math.round(Math.abs(x * 15 + y * 12) + (elev > 400 ? 18 : 6))));
      const sun = isPolar
        ? Math.min(94, Math.max(0, Math.round(75 + (elev / peakHeight) * 20 - slope * 0.3)))
        : 50;

      rowElev.push(elev);
      rowSlope.push(slope);
      rowSun.push(sun);
    }

    elevations.push(rowElev);
    slopes_deg.push(rowSlope);
    avg_sunlight_pct.push(rowSun);
  }

  return {
    site_id: site.id,
    grid_size: gridSize,
    spacing_m: spacingM,
    elevations,
    slopes_deg,
    avg_sunlight_pct,
    center_lat: site.lat,
    center_lon: site.lon,
  };
}

/**
 * Generate 6×6 km Neighbourhood PGDA 69 Crop
 */
export function generateNeighbourhoodCrop(site: Site): NeighbourhoodCrop {
  const gridSize = 40;
  const grid: number[][] = [];
  const isPolar = Math.abs(site.lat) > 80;

  for (let r = 0; r < gridSize; r++) {
    const row: number[] = [];
    const y = (r - gridSize / 2) / (gridSize / 2);
    for (let c = 0; c < gridSize; c++) {
      const x = (c - gridSize / 2) / (gridSize / 2);
      if (isPolar) {
        // High sunlight on ridge, 0% in crater shadows
        const ridgeVal = Math.exp(-Math.pow(y * 1.8 + 0.3 * Math.sin(x * 4), 2)) * 40;
        const craterDark = Math.sqrt(x * x + (y - 0.5) * (y - 0.5)) < 0.4 ? -50 : 0;
        const val = Math.max(0, Math.min(96, Math.round(62 + ridgeVal + craterDark)));
        row.push(val);
      } else {
        row.push(50);
      }
    }
    grid.push(row);
  }

  return {
    site_id: site.id,
    site_name: site.name,
    width_km: 6.0,
    height_km: 6.0,
    grid_size: gridSize,
    grid,
    site_x_norm: 0.5,
    site_y_norm: 0.5,
  };
}
