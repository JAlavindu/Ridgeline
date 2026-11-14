import { useState, useEffect, useMemo, type ReactNode } from "react";
import type { LunarSite } from "../../data/lunarSites";
import type { Site, HorizonMask, TileData3D, SkyState } from "../../types";
import { computeSkyState, generateHorizonMask, generate3DTile } from "../../utils/mockData";
import { SiteExplorer3D } from "../../charts/SiteExplorer3D";
import { Panorama } from "../../charts/Panorama";
import SunEarthLive, { SkyNow } from "./SunEarthLive";


const tabs = [
  ["overview", "Overview"],
  ["sky", "Sun & Earth"],
  ["terrain", "Terrain"],
  ["horizon", "Horizon"],
  ["science", "Science"],
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

  const latText =
    siteObj.lat >= 0 ? `${siteObj.lat.toFixed(4)}° N` : `${Math.abs(siteObj.lat).toFixed(4)}° S`;
  const lonText =
    siteObj.lon > 180 ? `${(360 - siteObj.lon).toFixed(4)}° W` : `${siteObj.lon.toFixed(4)}° E`;
  const signed = (v: number) => `${v > 0 ? "+" : ""}${v}°`;

  // The play/pause control only drives the animated tabs (simplified model)
  const showAnimationToggle = tab === "terrain" || tab === "horizon" || tab === "science";

  return (
    <aside
      aria-label={`${site.name} details`}
      className="
        site-panel
        fixed
        inset-x-0
        bottom-0
        z-[100]
        flex
        h-[56dvh]
        flex-col
        overflow-hidden
        rounded-t-[20px]
        border-t
        border-white/[0.08]
        bg-[#0a0a0a]

        lg:inset-x-auto
        lg:bottom-3
        lg:right-3
        lg:top-[72px]
        lg:h-auto
        lg:w-[min(44vw,600px)]
        lg:rounded-[20px]
        lg:border
      "
    >
      {/* ================= HEADER ================= */}
      <header className="shrink-0 border-b border-white/[0.08] px-6 pt-5 sm:px-8 sm:pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[12px] text-white/45">
              {siteObj.program || "Mission site"} · {site.country} · {site.year}
            </p>
            <h2 className="mt-1.5 truncate font-['Michroma'] text-[20px] uppercase leading-tight text-white sm:text-[22px]">
              {site.name}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {showAnimationToggle && (
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                aria-pressed={isPlaying}
                title="Animate the simplified sky through one lunar day"
                className="flex h-8 items-center gap-2 rounded-md px-2.5 text-[12px] text-white/55 transition hover:bg-white/[0.06] hover:text-white"
              >
                <span aria-hidden="true" className="text-[10px]">
                  {isPlaying ? "❚❚" : "▶"}
                </span>
                {isPlaying ? "Pause" : "Play"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close site details"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[20px] leading-none text-white/55 transition hover:bg-white/[0.06] hover:text-white"
            >
              ×
            </button>
          </div>
        </div>

        <nav
          aria-label="Site information"
          className="-mb-px mt-5 flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
              className={`shrink-0 border-b-2 pb-3 text-[13px] transition-colors ${
                tab === id
                  ? "border-[#ff3b12] text-white"
                  : "border-transparent text-white/45 hover:text-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* ================= BODY ================= */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 sm:py-7">
        {tab === "overview" && (
          <div className="space-y-10">
            <SkyNow site={site} onOpenDetails={() => setTab("sky")} />

            <section aria-labelledby="site-about-heading">
              <SectionTitle id="site-about-heading">About this site</SectionTitle>
              <p className="mt-2 max-w-[62ch] text-[13px] leading-[1.75] text-white/65">
                {siteObj.notes ||
                  `This mission site is listed in ${site.country}'s lunar exploration history.`}
              </p>
            </section>

            <section aria-labelledby="site-location-heading">
              <SectionTitle id="site-location-heading">Location</SectionTitle>
              <FactGrid>
                <Fact label="Latitude" value={latText} />
                <Fact label="Longitude" value={lonText} />
                <Fact label="Elevation (LOLA)" value={elevationDisplay} />
              </FactGrid>
              <p className="mt-3 break-words text-[11px] leading-[1.6] text-white/35">
                Frame {siteObj.coord_frame || "MOON_ME"} · Source:{" "}
                {siteObj.coord_source || "NASA Planetary Data System / LROC"}
              </p>
            </section>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTab("terrain")}
                className="h-10 rounded-md bg-white px-4 text-[13px] font-medium text-black transition hover:bg-white/85"
              >
                Open 3D terrain
              </button>
              <button
                type="button"
                onClick={() => setTab("horizon")}
                className="h-10 rounded-md border border-white/[0.14] px-4 text-[13px] text-white/80 transition hover:border-white/30 hover:text-white"
              >
                View the horizon
              </button>
            </div>
          </div>
        )}

        {tab === "sky" && <SunEarthLive site={site} />}

        {tab === "terrain" && (
          <section aria-labelledby="terrain-heading" className="space-y-5">
            <TabIntro
              id="terrain-heading"
              title="Terrain around the site"
              meta="LOLA DEM · 501 × 501"
            />

            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#020202]">
              <SiteExplorer3D tileData={tileData} skyState={skyState} siteName={site.name} mode="explore" />
            </div>

            <FactGrid>
              <Fact label="Surface resolution" value="50–60 m" />
              <Fact label="Site elevation" value={elevationDisplay} />
              <Fact label="Dataset" value="LOLA PDS GDR" />
            </FactGrid>

            <p className="text-[12px] leading-[1.7] text-white/50">
              Drag to rotate around {site.name} and scroll to zoom. Switch between surface, elevation, slope and
              sunlight views, or use Fullscreen for a bigger view.
            </p>
          </section>
        )}

        {tab === "horizon" && (
          <section aria-labelledby="horizon-heading" className="space-y-5">
            <TabIntro
              id="horizon-heading"
              title="What you would see standing here"
              meta="360° horizon · 1,440 rays"
            />

            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#020202]">
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

            <FactGrid>
              <Fact label="Angular step" value="0.25°" />
              <Fact label="Observer height" value="2.0 m" />
              <Fact label="Ridge toward Sun" value={signed(skyState.terrain_elev_at_sun_az)} />
              <Fact label="Ridge toward Earth" value={signed(skyState.terrain_elev_at_earth_az)} />
            </FactGrid>

            <p className="text-[12px] leading-[1.7] text-white/50">
              The skyline is the real ridge and crater-rim profile around {site.name}. Hover a compass heading to
              read the ridge height, and drag the time slider to move through a lunar day.
            </p>
          </section>
        )}

        {tab === "science" && (
          <section aria-labelledby="science-heading" className="space-y-8">
            <TabIntro id="science-heading" title="The numbers behind it" />

            <FactGrid>
              <Fact label="Solar flux" value={`${skyState.solar_flux_w_m2} W/m²`} sub="Direct incident flux" />
              <Fact
                label="Sun disc visible"
                value={`${(skyState.sun_visible_fraction * 100).toFixed(1)}%`}
                sub={skyState.is_sun_visible ? "Unshaded" : "Behind terrain"}
              />
              <Fact
                label="Sun–Earth separation"
                value={`${skyState.sun_earth_sep_deg}°`}
                sub={skyState.is_eclipse ? "Eclipse" : "No eclipse"}
              />
              <Fact label="Sun elevation rate" value={`${skyState.sun_elevation_rate_deg_per_hr}°/h`} />
              <Fact label="Earth distance" value={`${Math.round(skyState.earth.dist_km).toLocaleString()} km`} />
              <Fact
                label="Model time"
                value={skyState.time_utc.slice(0, 10)}
                sub={`${skyState.time_utc.slice(11, 16)} UTC`}
              />
            </FactGrid>

            <p className="border-l-2 border-white/15 pl-3 text-[12px] leading-[1.6] text-white/45">
              These values come from a simplified sky model that drives the animation. For values from the JPL
              ephemeris, use the Sun &amp; Earth tab.
            </p>

            <section aria-labelledby="science-why-heading">
              <SectionTitle id="science-why-heading">Why these matter</SectionTitle>
              <div className="mt-3 space-y-4 text-[13px] leading-[1.75] text-white/60">
                <p>
                  <span className="text-white">Sunlight.</span> With no atmosphere to spread light around, shadowed
                  ground drops to about −180 °C while sunlit ground reaches +120 °C. Whether a ridge blocks the Sun
                  decides whether solar panels get power.
                </p>
                <p>
                  <span className="text-white">Line of sight to Earth.</span> High ridges can block radio contact
                  with ground stations. While Earth is above the local skyline (
                  {signed(skyState.terrain_elev_at_earth_az)} at this azimuth), a lander can talk to Earth directly.
                </p>
              </div>
            </section>
          </section>
        )}
      </div>
    </aside>
  );
}

/* =========================================================
   SMALL PIECES
   ========================================================= */

function SectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="text-[12px] font-medium text-white/50">
      {children}
    </h3>
  );
}

function TabIntro({ id, title, meta }: { id: string; title: string; meta?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h3 id={id} className="text-[15px] font-medium text-white">
        {title}
      </h3>
      {meta && <span className="text-[11px] tabular-nums text-white/40">{meta}</span>}
    </div>
  );
}

function FactGrid({ children }: { children: ReactNode }) {
  return <dl className="mt-2 grid grid-cols-2 border-t border-white/[0.08] sm:grid-cols-3">{children}</dl>;
}

function Fact({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="min-w-0 border-b border-white/[0.08] py-3 pr-4">
      <dt className="text-[11px] text-white/45">{label}</dt>
      <dd className="mt-1 truncate text-[15px] tabular-nums text-white">{value}</dd>
      {sub && <dd className="mt-0.5 truncate text-[11px] text-white/40">{sub}</dd>}
    </div>
  );
}
