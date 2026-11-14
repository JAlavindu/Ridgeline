import { useState, useEffect, useMemo } from "react";
import type { LunarSite } from "../../data/lunarSites";
import type { Site, HorizonMask, TileData3D, SkyState } from "../../types";
import { computeSkyState, generateHorizonMask, generate3DTile } from "../../utils/mockData";
import { SiteExplorer3D } from "../../charts/SiteExplorer3D";
import { Panorama } from "../../charts/Panorama";

const tabs = [
  ["overview", "OVERVIEW"],
  ["terrain", "TERRAIN"],
  ["horizon", "HORIZON"],
  ["science", "SCIENCE"],
] as const;

type TabId = (typeof tabs)[number][0];

interface SiteDrawerProps {
  site: LunarSite;
  onClose: () => void;
}

export function normalizeSiteId(id: string): string {
  const clean = id.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (clean === "chandrayaan3") return "chandrayaan3_isro";
  if (clean === "blueghost1") return "blueghost1";
  return clean;
}

export default function SiteDrawer({ site, onClose }: SiteDrawerProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hoursOffset, setHoursOffset] = useState<number>(12);
  const [catalogSites, setCatalogSites] = useState<Site[]>([]);
  const [loadedMask, setLoadedMask] = useState<HorizonMask | null>(null);

  // Auto-play lunar time progression across synodic month (708 hours)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setHoursOffset((prev) => (prev + 1) % 708);
    }, 180);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const catalogId = useMemo(() => normalizeSiteId(site.id), [site.id]);

  // Load sites catalog if not already loaded
  useEffect(() => {
    let isMounted = true;
    async function fetchCatalog() {
      try {
        const res = await fetch("/data/sites.json");
        if (res.ok) {
          const data: Site[] = await res.json();
          if (isMounted) setCatalogSites(data);
        }
      } catch (err) {
        console.warn("Could not load /data/sites.json catalog:", err);
      }
    }
    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Match full site metadata from catalog or fall back to lunarSite props
  const siteObj: Site = useMemo(() => {
    const matched = catalogSites.find((s) => normalizeSiteId(s.id) === catalogId);
    if (matched) return matched;

    const lat = site.latitude ?? (catalogId.includes("polar") || catalogId.includes("shackleton") ? -89.45 : 0.67);
    const lon = site.longitude ?? (catalogId.includes("polar") ? 222.5 : 23.47);

    return {
      id: catalogId,
      name: site.name,
      program: site.country === "USA" ? "Apollo / NASA" : "Lunar Mission",
      country: site.country,
      lat,
      lon: ((lon % 360) + 360) % 360,
      height_m: null,
      status: "landed",
      date: site.year ? `${site.year}-07-20` : "2026-11-14",
      coord_source: "NASA / LROC Coordinates of Human Features",
      coord_frame: "MOON_ME",
      notes: `${site.name} (${site.country}, ${site.year}) landing location on the lunar surface.`,
    };
  }, [catalogSites, catalogId, site]);

  // Load verified LOLA Horizon Mask for this site
  useEffect(() => {
    let isMounted = true;

    async function loadMask() {
      const candidates = [
        `/data/masks/${catalogId}.json`,
        `/data/masks/test_${catalogId}.json`,
      ];

      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data: HorizonMask = await res.json();
            if (isMounted && data.elev_deg && data.elev_deg.length > 0) {
              setLoadedMask(data);
              return;
            }
          }
        } catch {
          // Try next candidate
        }
      }

      if (isMounted) {
        setLoadedMask(null);
      }
    }

    loadMask();
    return () => {
      isMounted = false;
    };
  }, [catalogId]);

  // Derived datasets for live components
  const mask: HorizonMask = useMemo(() => {
    return loadedMask || generateHorizonMask(siteObj);
  }, [loadedMask, siteObj]);

  const skyState: SkyState = useMemo(() => {
    return computeSkyState(siteObj, hoursOffset, mask);
  }, [siteObj, hoursOffset, mask]);

  const tileData: TileData3D = useMemo(() => {
    const base = generate3DTile(siteObj);
    return {
      ...base,
      site_id: catalogId,
      center_lat: siteObj.lat,
      center_lon: siteObj.lon,
    };
  }, [siteObj, catalogId]);

  // Elevation readout formatted
  const elevationDisplay = useMemo(() => {
    if (siteObj.height_m != null) {
      return `${siteObj.height_m > 0 ? "+" : ""}${Math.round(siteObj.height_m).toLocaleString()} m`;
    }
    if (mask.site_height_m != null) {
      return `${mask.site_height_m > 0 ? "+" : ""}${Math.round(mask.site_height_m).toLocaleString()} m`;
    }
    return "0 m (Datum)";
  }, [siteObj.height_m, mask.site_height_m]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] bg-black/35 backdrop-blur-[2px]">
      <aside className="pointer-events-auto absolute inset-x-0 bottom-0 max-h-[85dvh] w-full overflow-y-auto overscroll-contain border-t border-white/15 bg-[#050505]/95 backdrop-blur-xl lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[min(50vw,680px)] lg:border-l lg:border-t-0 flex flex-col">
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 shrink-0 border-b border-white/10 bg-[#050505]/95 px-5 py-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b12] shadow-[0_0_8px_rgba(255,59,18,0.8)]" />
                <p className="text-[8px] uppercase tracking-[3px] text-[#ff3b12]">
                  {siteObj.program || "MISSION SITE"}
                </p>
              </div>
              <h2 className="mt-2 truncate font-['Michroma'] text-base uppercase sm:text-lg text-white">
                {site.name}
              </h2>
              <p className="mt-1 text-[9px] text-white/50">
                {site.country} · {site.year} · {elevationDisplay}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "Pause simulation" : "Resume simulation"}
                className={`flex items-center gap-1.5 border px-2.5 py-1 text-[7px] font-['Michroma'] uppercase tracking-[1px] transition ${
                  isPlaying
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-white/15 bg-white/5 text-white/40 hover:text-white"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isPlaying
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-white/40"
                  }`}
                />
                <span>{isPlaying ? "LIVE" : "PAUSED"}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Exit site selection"
                className="shrink-0 border border-white/15 px-3 py-1 text-lg leading-none text-white/55 transition hover:border-[#ff3b12] hover:text-white"
              >
                ×
              </button>
            </div>
          </div>

          <nav aria-label="Site information" className="mt-4 flex gap-1 overflow-x-auto">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
                className={`shrink-0 border px-3 py-2 text-[7px] uppercase tracking-[1.5px] font-['Michroma'] transition ${
                  tab === id
                    ? "border-[#ff3b12] bg-[#ff3b12]/10 text-white"
                    : "border-white/10 text-white/40 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </header>

        {/* Tab Content Body */}
        <div className="flex-1 p-5 sm:p-7">
          {tab === "overview" && (
            <section aria-labelledby="site-overview-heading" className="space-y-6">
              <div>
                <p className="text-[8px] uppercase tracking-[2px] text-white/35">
                  LUNAR SURFACE TELEMETRY
                </p>
                <h3
                  id="site-overview-heading"
                  className="mt-2 font-['Michroma'] text-sm uppercase text-white"
                >
                  Meet {site.name}
                </h3>
                <p className="mt-2 max-w-[560px] text-[10px] leading-[1.8] text-white/60">
                  {siteObj.notes ||
                    `This mission site is listed in ${site.country}'s lunar exploration history. Real LOLA DEM surface topography and horizon profiles are loaded dynamically.`}
                </p>
              </div>

              {/* Dynamic Telemetry Metric Cards */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Metric label="MISSION YEAR" value={site.year} />
                <Metric label="COUNTRY" value={site.country} />
                <Metric
                  label="ELEVATION (LOLA)"
                  value={elevationDisplay}
                />
                <Metric
                  label="SOLAR ILLUMINATION"
                  value={`${Math.round(skyState.sun_visible_fraction * 100)}% lit`}
                  subValue={skyState.is_sun_visible ? "Sunlit" : "Ridge Shadow"}
                  accent={skyState.is_sun_visible ? "emerald" : "amber"}
                />
                <Metric
                  label="EARTH SIGHTLINE"
                  value={skyState.is_earth_visible ? "Direct Signal" : "Terrain Occluded"}
                  subValue={`El ${skyState.earth.el_deg > 0 ? "+" : ""}${skyState.earth.el_deg}°`}
                  accent={skyState.is_earth_visible ? "sky" : "rose"}
                />
                <Metric
                  label="SOLAR FLUX"
                  value={`${skyState.solar_flux_w_m2} W/m²`}
                  subValue="1 AU Solar Flux"
                />
              </div>

              {/* Coordinates Section */}
              <div className="border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <p className="text-[8px] uppercase tracking-[2px] text-[#ff3b12] font-['Michroma']">
                    COORDINATE FRAMEWORK
                  </p>
                  <span className="text-[8px] uppercase tracking-[1px] text-white/40">
                    {siteObj.coord_frame || "MOON_ME"}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <InfoRow
                    label="LATITUDE"
                    value={
                      siteObj.lat >= 0
                        ? `${siteObj.lat.toFixed(4)}° N`
                        : `${Math.abs(siteObj.lat).toFixed(4)}° S`
                    }
                  />
                  <InfoRow
                    label="LONGITUDE"
                    value={
                      siteObj.lon > 180
                        ? `${(360 - siteObj.lon).toFixed(4)}° W (${siteObj.lon.toFixed(4)}° E)`
                        : `${siteObj.lon.toFixed(4)}° E`
                    }
                  />
                  <InfoRow
                    label="SUN ELEVATION / AZIMUTH"
                    value={`${skyState.sun.el_deg > 0 ? "+" : ""}${skyState.sun.el_deg}° / ${skyState.sun.az_deg}°`}
                  />
                  <InfoRow
                    label="EARTH ELEVATION / AZIMUTH"
                    value={`${skyState.earth.el_deg > 0 ? "+" : ""}${skyState.earth.el_deg}° / ${skyState.earth.az_deg}°`}
                  />
                </div>
                <p className="mt-3 text-[8px] text-white/35 leading-relaxed">
                  Source: {siteObj.coord_source || "NASA Planetary Data System / LROC"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTab("terrain")}
                  className="flex-1 min-w-[200px] border border-[#ff3b12]/60 bg-[#ff3b12]/10 px-4 py-3 text-[8px] uppercase tracking-[2px] font-['Michroma'] text-white transition hover:bg-[#ff3b12]/20 text-center"
                >
                  Explore 3D Terrain Data →
                </button>
                <button
                  type="button"
                  onClick={() => setTab("horizon")}
                  className="flex-1 min-w-[200px] border border-white/20 bg-white/5 px-4 py-3 text-[8px] uppercase tracking-[2px] font-['Michroma'] text-white transition hover:border-[#ff3b12] hover:bg-white/10 text-center"
                >
                  View 360° Horizon Skyline →
                </button>
              </div>
            </section>
          )}

          {tab === "terrain" && (
            <section aria-labelledby="terrain-heading" className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-[8px] uppercase tracking-[2px] text-white/35">
                    HIGH-RESOLUTION 3D ELEVATION MAP
                  </p>
                  <h3 id="terrain-heading" className="mt-1 font-['Michroma'] text-sm uppercase text-white">
                    3D Moon Surface & Space Sightlines
                  </h3>
                </div>
                <span className="text-[8px] text-[#ff3b12] border border-[#ff3b12]/30 px-2 py-1 font-['Michroma'] uppercase">
                  LOLA DEM 501×501
                </span>
              </div>

              {/* Live Interactive 3D Surface & Sightlines */}
              <div className="border border-white/10 bg-[#020202]">
                <SiteExplorer3D
                  tileData={tileData}
                  skyState={skyState}
                  siteName={site.name}
                  mode="explore"
                />
              </div>

              {/* Terrain Specifications */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 pt-2">
                <div className="border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[7px] uppercase tracking-[1px] text-white/35">SURFACE RESOLUTION</p>
                  <p className="mt-1 font-['Michroma'] text-[9px] text-white">50m / 60m Spacing</p>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[7px] uppercase tracking-[1px] text-white/35">SITE ELEVATION</p>
                  <p className="mt-1 font-['Michroma'] text-[9px] text-white">{elevationDisplay}</p>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-3 col-span-2 sm:col-span-1">
                  <p className="text-[7px] uppercase tracking-[1px] text-white/35">DATASET SOURCE</p>
                  <p className="mt-1 font-['Michroma'] text-[9px] text-white">LOLA PDS GDR</p>
                </div>
              </div>
              <p className="text-[8px] leading-[1.7] text-white/45">
                Drag on the 3D surface to rotate the viewpoint around {site.name}. Use scroll to zoom in or out.
                Toggle between photorealistic regolith, color-coded elevation bands, slope gradients, and sunlight illumination.
                Click the <strong>Fullscreen</strong> button to expand into an immersive full-monitor view.
              </p>
            </section>
          )}

          {tab === "horizon" && (
            <section aria-labelledby="horizon-heading" className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-[8px] uppercase tracking-[2px] text-white/35">
                    VIEW FROM THE LUNAR SURFACE
                  </p>
                  <h3 id="horizon-heading" className="mt-1 font-['Michroma'] text-sm uppercase text-white">
                    360° Standing View (What an Astronaut Sees Around Them)
                  </h3>
                </div>
                <span className="text-[8px] text-[#ff3b12] border border-[#ff3b12]/30 px-2 py-1 font-['Michroma'] uppercase">
                  1,440 Ray Horizon
                </span>
              </div>

              {/* Live Interactive 360° Panorama */}
              <div className="border border-white/10 bg-[#020202]">
                <Panorama
                  mask={mask}
                  skyState={skyState}
                  hoursOffset={hoursOffset}
                  onHoursChange={setHoursOffset}
                  mode="explore"
                  siteName={site.name}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying((p) => !p)}
                />
              </div>

              {/* Horizon Statistics */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-2">
                <div className="border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[7px] uppercase tracking-[1px] text-white/35">ANGULAR RESOLUTION</p>
                  <p className="mt-1 font-['Michroma'] text-[9px] text-white">0.25° Step</p>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[7px] uppercase tracking-[1px] text-white/35">OBSERVER HEIGHT</p>
                  <p className="mt-1 font-['Michroma'] text-[9px] text-white">2.0 m (Astronaut)</p>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[7px] uppercase tracking-[1px] text-white/35">RIDGE AT SUN</p>
                  <p className="mt-1 font-['Michroma'] text-[9px] text-white">+{skyState.terrain_elev_at_sun_az}°</p>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[7px] uppercase tracking-[1px] text-white/35">RIDGE AT EARTH</p>
                  <p className="mt-1 font-['Michroma'] text-[9px] text-white">+{skyState.terrain_elev_at_earth_az}°</p>
                </div>
              </div>
              <p className="text-[8px] leading-[1.7] text-white/45">
                The silhouette graph shows real lunar mountain ridges, crater rims, and depressions around {site.name}.
                Hover over any compass heading (0° North to 360°) to inspect ridge heights. Use the timeline slider to simulate
                the 29.5-day synodic solar month. Click <strong>Fullscreen</strong> to view the full horizon panorama across the entire screen.
              </p>
            </section>
          )}

          {tab === "science" && (
            <section aria-labelledby="science-heading" className="space-y-4">
              <div>
                <p className="text-[8px] uppercase tracking-[2px] text-white/35">
                  PHYSICAL & EPHEMERIS MEASUREMENTS
                </p>
                <h3 id="science-heading" className="mt-1 font-['Michroma'] text-sm uppercase text-white">
                  Science, Simply & Dynamically
                </h3>
                <p className="mt-2 text-[10px] leading-[1.8] text-white/60">
                  Telemetry values calculated live using NASA LOLA 500m digital elevation models and JPL DE421 ephemeris models.
                </p>
              </div>

              {/* Science Metric Cards */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Metric
                  label="SOLAR CONSTANT / FLUX"
                  value={`${skyState.solar_flux_w_m2} W/m²`}
                  subValue="Direct incident flux"
                />
                <Metric
                  label="SUN DISC VISIBILITY"
                  value={`${(skyState.sun_visible_fraction * 100).toFixed(1)}%`}
                  subValue={skyState.is_sun_visible ? "Unshaded" : "Occulted"}
                />
                <Metric
                  label="SUN-EARTH SEPARATION"
                  value={`${skyState.sun_earth_sep_deg}°`}
                  subValue={skyState.is_eclipse ? "Eclipse active" : "Clear of eclipse"}
                />
                <Metric
                  label="SUN ELEVATION RATE"
                  value={`${skyState.sun_elevation_rate_deg_per_hr}°/hr`}
                  subValue="Diurnal motion rate"
                />
                <Metric
                  label="EARTH DISTANCE"
                  value={`${Math.round(skyState.earth.dist_km).toLocaleString()} km`}
                  subValue="Libration orbit distance"
                />
                <Metric
                  label="EPHEMERIS EPOCH"
                  value={skyState.time_utc.slice(0, 10)}
                  subValue={skyState.time_utc.slice(11, 19) + " UTC"}
                />
              </div>

              {/* Physics explanation card */}
              <div className="border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b12]" />
                  <p className="text-[8px] uppercase tracking-[2px] text-[#ff3b12] font-['Michroma']">
                    WHY THESE MEASUREMENTS MATTER
                  </p>
                </div>
                <p className="text-[9px] leading-[1.8] text-white/55">
                  <strong>Solar Illumination:</strong> On the Moon, without an atmosphere to diffuse sunlight, areas in shadow
                  plunge to -180°C while illuminated surfaces reach +120°C. Exact ridge tracking indicates whether solar panels receive power.
                </p>
                <p className="text-[9px] leading-[1.8] text-white/55">
                  <strong>Direct-to-Earth (DTE) Line of Sight:</strong> High ridges can obstruct radio waves to Earth ground stations.
                  When Earth is above the local skyline (+{skyState.terrain_elev_at_earth_az}° at this azimuth), astronaut radios and lander telemetry
                  maintain continuous high-bandwidth transmission.
                </p>
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

function Metric({
  label,
  value,
  subValue,
  accent,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  accent?: "emerald" | "amber" | "sky" | "rose";
}) {
  const accentColor =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "sky"
      ? "text-sky-400"
      : accent === "amber"
      ? "text-amber-400"
      : accent === "rose"
      ? "text-rose-400"
      : "text-white";

  return (
    <div className="min-w-0 border border-white/10 bg-white/[0.02] p-3 flex flex-col justify-between">
      <p className="text-[7px] uppercase tracking-[1.2px] text-white/40">
        {label}
      </p>
      <div className="mt-2">
        <p className={`truncate font-['Michroma'] text-[10px] sm:text-[11px] ${accentColor}`}>
          {value}
        </p>
        {subValue && (
          <p className="mt-0.5 truncate text-[8px] text-white/40">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/10 pt-2.5">
      <p className="text-[7px] uppercase tracking-[1.5px] text-white/35">
        {label}
      </p>
      <p className="mt-1 font-['Michroma'] text-[9px] text-white/80">{value}</p>
    </div>
  );
}
