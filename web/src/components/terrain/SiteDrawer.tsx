import { useState } from "react";

import type { LunarSite } from "../../data/lunarSites";
import SunEarthLive from "./SunEarthLive";


const tabs = [
  ["overview", "OVERVIEW"],
  ["sky", "SUN & EARTH"],
  ["terrain", "TERRAIN"],
  ["horizon", "HORIZON"],
  ["science", "SCIENCE"],
] as const;


type TabId = (typeof tabs)[number][0];

interface SiteDrawerProps {
  site: LunarSite;
  onClose: () => void;
}

export default function SiteDrawer({ site, onClose }: SiteDrawerProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const hasCoordinates =
    site.latitude !== null && site.longitude !== null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] bg-black/25">
      <aside className="pointer-events-auto absolute inset-x-0 bottom-0 max-h-[40dvh] w-full overflow-y-auto overscroll-contain border-t border-white/15 bg-[#050505]/95 backdrop-blur-xl lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[min(38vw,520px)] lg:border-l lg:border-t-0">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050505]/95 px-5 py-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[8px] uppercase tracking-[3px] text-[#ff3b12]">
                MISSION SITE
              </p>
              <h2 className="mt-2 truncate font-['Michroma'] text-base uppercase sm:text-lg">
                {site.name}
              </h2>
              <p className="mt-1 text-[9px] text-white/40">
                {site.country} · {site.year}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Exit site selection"
              className="shrink-0 border border-white/15 px-3 py-1 text-lg leading-none text-white/55 transition hover:border-[#ff3b12] hover:text-white"
            >
              ×
            </button>
          </div>

          <nav aria-label="Site information" className="mt-4 flex gap-1 overflow-x-auto">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
                className={`shrink-0 border px-3 py-2 text-[7px] uppercase tracking-[1.5px] transition ${
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

        <div className="p-5 sm:p-7">
          {tab === "overview" && (
            <section aria-labelledby="site-overview-heading">
              <p className="text-[8px] uppercase tracking-[2px] text-white/35">
                A PLACE ON THE MOON
              </p>
              <h3
                id="site-overview-heading"
                className="mt-2 font-['Michroma'] text-sm"
              >
                Meet {site.name}
              </h3>
              <p className="mt-3 max-w-[440px] text-[10px] leading-[1.8] text-white/55">
                This mission site is listed in {site.country}&apos;s lunar
                exploration history. Choose another tab to learn what terrain
                and horizon data would show.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Metric label="MISSION YEAR" value={site.year} />
                <Metric label="COUNTRY" value={site.country} />
                <Metric
                  label="COORDINATES"
                  value={hasCoordinates ? "Available" : "Not listed"}
                />
              </div>

              {hasCoordinates ? (
                <div className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
                  <InfoRow label="LATITUDE" value={`${site.latitude}°`} />
                  <InfoRow label="LONGITUDE" value={`${site.longitude}°`} />
                </div>
              ) : (
                <p className="mt-5 border-l border-[#ff3b12] pl-3 text-[9px] leading-[1.7] text-white/45">
                  Coordinates are not included in the current site dataset, so
                  this mission has no globe marker.
                </p>
              )}

              <button
                type="button"
                onClick={() => setTab("terrain")}
                className="mt-7 border border-[#ff3b12]/60 bg-[#ff3b12]/10 px-4 py-3 text-[8px] uppercase tracking-[2px] text-white transition hover:bg-[#ff3b12]/20"
              >
                Explore terrain data
              </button>
            </section>
          )}

          {tab === "sky" && <SunEarthLive site={site} />}
          {tab === "terrain" && (
            <section aria-labelledby="terrain-heading">
              <p className="text-[8px] uppercase tracking-[2px] text-white/35">
                SURFACE VIEW
              </p>
              <h3 id="terrain-heading" className="mt-2 font-['Michroma'] text-sm">
                Terrain overview
              </h3>
              <DataPlaceholder
                title="Terrain map not connected"
                description="A verified elevation or shaded-relief map is not available in the current web assets."
              />
              <p className="mt-4 text-[9px] leading-[1.7] text-white/40">
                Elevation maps show how high or low the ground is. No height or
                slope measurements are shown here because site-specific terrain
                data has not been loaded.
              </p>
            </section>
          )}

          {tab === "horizon" && (
            <section aria-labelledby="horizon-heading">
              <p className="text-[8px] uppercase tracking-[2px] text-white/35">
                VIEW FROM THE SURFACE
              </p>
              <h3 id="horizon-heading" className="mt-2 font-['Michroma'] text-sm">
                Horizon view
              </h3>
              <DataPlaceholder
                title="Horizon data not connected"
                description="This preview is intentionally empty until a verified horizon profile is available."
              />
              <p className="mt-4 text-[9px] leading-[1.7] text-white/40">
                A horizon profile shows the hills and ridges that would appear
                around the sky from this location.
              </p>
            </section>
          )}

          {tab === "science" && (
            <section aria-labelledby="science-heading">
              <p className="text-[8px] uppercase tracking-[2px] text-white/35">
                WHAT THE DATA CAN TELL US
              </p>
              <h3 id="science-heading" className="mt-2 font-['Michroma'] text-sm">
                Science, simply
              </h3>
              <p className="mt-3 text-[10px] leading-[1.8] text-white/55">
                Coordinates locate a site on the Moon. Terrain measurements
                can describe the nearby ground, while horizon measurements
                show which parts of the sky are blocked by ridges.
              </p>
              <div className="mt-5 border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[8px] uppercase tracking-[2px] text-[#ff3b12]">
                  SITE-SPECIFIC MEASUREMENTS
                </p>
                <p className="mt-2 text-[9px] leading-[1.7] text-white/45">
                  Elevation, slope, sunlight, and horizon values are not
                  currently loaded for this site. No estimates are displayed.
                </p>
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 border border-white/10 p-3">
      <p className="text-[7px] uppercase tracking-[1.5px] text-white/35">
        {label}
      </p>
      <p className="mt-3 truncate font-['Michroma'] text-[10px]">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/10 pt-3">
      <p className="text-[7px] uppercase tracking-[2px] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-[10px] text-white/70">{value}</p>
    </div>
  );
}

function DataPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="relative mt-5 flex min-h-44 items-end overflow-hidden border border-white/10 bg-[radial-gradient(ellipse_at_50%_90%,rgba(255,59,18,0.12),transparent_55%),linear-gradient(180deg,#0b0b0b,#030303)] p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:32px_32px]"
      />
      <div className="relative max-w-[340px]">
        <p className="font-['Michroma'] text-[10px]">{title}</p>
        <p className="mt-2 text-[9px] leading-[1.7] text-white/45">
          {description}
        </p>
      </div>
    </div>
  );
}
