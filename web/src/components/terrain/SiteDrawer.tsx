import { useState, useEffect, useMemo, type ReactNode } from "react";
import type { LunarSite } from "../../data/lunarSites";
import type { Site, HorizonMask, TileData3D, SkyState } from "../../types";
import { generate3DTile } from "../../utils/mockData";
import { flatMask, makeObserver, skyState as computeSkyState, unixMsToTdb } from "../../engine";
import { useEphemeris, useMask } from "../../hooks/useEngine";
import { SiteExplorer3D } from "../../charts/SiteExplorer3D";
import { Panorama } from "../../charts/Panorama";
import { useNavigate } from "react-router-dom";
import { MAX_CARDS, thisUtcHour, usePlan } from "../../lib/plan";
import { normalizeSiteId } from "../../lib/siteIds";
import MissionReplay from "./MissionReplay";
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


export default function SiteDrawer({ site, onClose }: SiteDrawerProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const navigate = useNavigate();
  const { state: plan, dispatch } = usePlan();
  const addToPlan = () => {
    if (plan.cards.length < MAX_CARDS) {
      dispatch({ type: "add", card: { site: { kind: "preset", siteId: site.id }, startUtc: thisUtcHour(), missionDays: 14 } });
    }
    navigate("/plan");
  };
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hoursOffset, setHoursOffset] = useState<number>(12);
  const [catalogSites, setCatalogSites] = useState<Site[]>([]);
  // Time-lapse starts at the top of the current hour; the sky is computed by the real engine
  const [startMs] = useState(() => Math.floor(Date.now() / 3_600_000) * 3_600_000);

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

  // Real terrain horizon, or null: placeholder and missing masks mean a smooth Moon
  const { mask: terrainMask } = useMask(site.id);
  const { eph } = useEphemeris();

  const observer = useMemo(
    () => makeObserver(siteObj.lat, siteObj.lon, terrainMask ? (terrainMask.site_height_m ?? 0) : (siteObj.height_m ?? 0)),
    [siteObj.lat, siteObj.lon, siteObj.height_m, terrainMask],
  );

  const mask: HorizonMask = useMemo(() => {
    const engineMask = terrainMask ?? flatMask(observer);
    return { ...engineMask, radius_km: engineMask.radius_km ?? 0, dems_used: engineMask.dems_used ?? ["smooth Moon"] };
  }, [terrainMask, observer]);

  const skyState: SkyState | null = useMemo(() => {
    if (!eph) return null;
    try {
      return computeSkyState(eph, observer, mask, unixMsToTdb(startMs + hoursOffset * 3_600_000));
    } catch {
      return null; // time outside the 2023-2032 ephemeris
    }
  }, [eph, observer, mask, startMs, hoursOffset]);

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
    const height = terrainMask?.site_height_m ?? siteObj.height_m;
    if (height == null) return "Not available";
    return `${height > 0 ? "+" : ""}${Math.round(height).toLocaleString()} m`;
  }, [siteObj.height_m, terrainMask]);

  const latText =
    siteObj.lat >= 0 ? `${siteObj.lat.toFixed(4)}° N` : `${Math.abs(siteObj.lat).toFixed(4)}° S`;
  const lonText =
    siteObj.lon > 180 ? `${(360 - siteObj.lon).toFixed(4)}° W` : `${siteObj.lon.toFixed(4)}° E`;
  const signed = (v: number) => `${v > 0 ? "+" : ""}${v}°`;

  // The play/pause control only drives the time-lapse tabs
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
                title="Animate the sky through one lunar day"
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

            <MissionReplay siteId={site.id} />

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
                <Fact label="Elevation" value={elevationDisplay} />
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
              {site.latitude !== null && (
                <button
                  type="button"
                  onClick={addToPlan}
                  className="h-10 rounded-md border border-white/[0.14] px-4 text-[13px] text-white/80 transition hover:border-white/30 hover:text-white"
                >
                  {plan.cards.length < MAX_CARDS ? "Add to plan" : "Open plan (board full)"}
                </button>
              )}
            </div>
          </div>
        )}

        {tab === "sky" && <SunEarthLive site={site} />}

        {tab === "terrain" && (
          <section aria-labelledby="terrain-heading" className="space-y-5">
            <TabIntro
              id="terrain-heading"
              title="Terrain around the site"
              meta="501 × 501 grid · 60 m"
            />

            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#020202]">
              {skyState ? (
                <SiteExplorer3D tileData={tileData} skyState={skyState} siteName={site.name} mode="explore" />
              ) : (
                <p className="p-6 text-[12px] text-white/40">Loading the ephemeris…</p>
              )}
            </div>

            <FactGrid>
              <Fact label="Grid spacing" value="60 m" sub="30 × 30 km tile" />
              <Fact label="Site elevation" value={elevationDisplay} />
              <Fact label="Horizon" value={terrainMask ? "LOLA terrain" : "Smooth Moon"} />
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
              meta={terrainMask ? `360° horizon · ${mask.elev_deg.length.toLocaleString()} rays` : "No terrain data yet"}
            />

            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#020202]">
              {skyState ? (
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
              ) : (
                <p className="p-6 text-[12px] text-white/40">Loading the ephemeris…</p>
              )}
            </div>

            <FactGrid>
              <Fact label="Angular step" value={`${mask.az_step_deg}°`} />
              <Fact label="Observer height" value={`${mask.observer_height_m} m`} />
              <Fact label="Horizon toward Sun" value={skyState ? signed(skyState.terrain_elev_at_sun_az) : "…"} />
              <Fact label="Horizon toward Earth" value={skyState ? signed(skyState.terrain_elev_at_earth_az) : "…"} />
            </FactGrid>

            <p className="text-[12px] leading-[1.7] text-white/50">
              {terrainMask
                ? `The skyline is built from NASA LOLA terrain around ${site.name}.`
                : `No terrain data for ${site.name} yet, so the horizon is a smooth Moon: hills are not included.`}{" "}
              Sun and Earth positions come from the JPL ephemeris. Drag the time slider to move through a lunar day
              from {new Date(startMs).toISOString().slice(0, 16).replace("T", " ")} UTC.
            </p>
          </section>
        )}

        {tab === "science" && (
          <section aria-labelledby="science-heading" className="space-y-8">
            <TabIntro id="science-heading" title="The numbers behind it" />

            {!skyState ? (
              <p className="text-[12px] text-white/40">Loading the ephemeris…</p>
            ) : (
            <>
            <FactGrid>
              <Fact label="Solar flux" value={`${Math.round(skyState.solar_flux_w_m2)} W/m²`} sub="Sun strength × visible fraction (F13)" />
              <Fact
                label="Sun disc visible"
                value={`${(skyState.sun_visible_fraction * 100).toFixed(1)}%`}
                sub={skyState.is_sun_visible ? "Unshaded" : "Behind terrain"}
              />
              <Fact
                label="Sun–Earth separation"
                value={`${skyState.sun_earth_sep_deg.toFixed(2)}°`}
                sub={skyState.is_eclipse ? "Eclipse" : "No eclipse"}
              />
              <Fact label="Sun height change" value={`${skyState.sun_elevation_rate_deg_per_hr.toFixed(3)}°/h`} />
              <Fact label="Earth distance" value={`${Math.round(skyState.earth.dist_km).toLocaleString()} km`} />
              <Fact
                label="Time shown"
                value={skyState.time_utc.slice(0, 10)}
                sub={`${skyState.time_utc.slice(11, 16)} UTC`}
              />
            </FactGrid>

            <p className="border-l-2 border-white/15 pl-3 text-[12px] leading-[1.6] text-white/45">
              Computed by the same engine as the Sun &amp; Earth tab (JPL ephemeris,{" "}
              {terrainMask ? "NASA LOLA terrain" : "smooth Moon, no terrain data for this site yet"}).
            </p>
            </>
            )}

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
                  {skyState ? signed(skyState.terrain_elev_at_earth_az) : "…"} at this azimuth), a lander can talk to Earth directly.
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
