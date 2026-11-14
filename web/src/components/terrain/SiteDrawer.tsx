import { useState } from "react";

import type { NavigateSite } from "../../pages/TerrainPage";

const tabs = [
  ["story", "STORY & NOW"],
  ["terrain", "3D TERRAIN"],
  ["horizon", "HORIZON MAP"],
  ["neighbourhood", "NEIGHBOURHOOD"],
  ["data", "TIMELINES & NASA"],
] as const;

type TabId =
  (typeof tabs)[number][0];

interface SiteDrawerProps {
  site: NavigateSite;
  onClose: () => void;
}

export default function SiteDrawer({
  site,
  onClose,
}: SiteDrawerProps) {
  const [tab, setTab] =
    useState<TabId>("story");

  return (
    <div
      className="
        pointer-events-none
        fixed
        inset-0
        z-[100]
        bg-black/25
      "
    >

      {/* =====================================================
          DRAWER
      ===================================================== */}

      <aside
        className="
          absolute
          inset-x-0
          bottom-0
          max-h-[55dvh]
          w-full
          overflow-y-auto
          border-l
          border-white/15
          bg-[#050505]/95
          pointer-events-auto
          backdrop-blur-xl
          lg:inset-y-0
          lg:left-auto
          lg:right-0
          lg:max-h-none
          lg:w-[min(36vw,460px)]
        "
      >

        {/* ===================================================
            HEADER
        =================================================== */}

        <header
          className="
            sticky
            top-0
            z-20
            border-b
            border-white/10
            bg-[#050505]/95
            px-6
            py-5
            backdrop-blur-xl
            md:px-8
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
            "
          >

            <div>

              <p
                className="
                  text-[8px]
                  uppercase
                  tracking-[3px]
                  text-[#ff3b12]
                "
              >
                SELECTED SITE
              </p>

              <h2
                className="
                  mt-2
                  font-['Michroma']
                  text-lg
                  uppercase
                "
              >
                {site.name ??
                  "Lunar Landing Site"}
              </h2>

              <p
                className="
                  mt-2
                  text-[9px]
                  text-white/35
                "
              >
                {site.mission ??
                  "Mission information"}

                {" · "}

                {site.year ??
                  "Year unavailable"}
              </p>

            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close site information"
              className="
                text-xl
                text-white/45
                transition
                hover:text-white
              "
            >
              ×
            </button>

          </div>

          {/* =================================================
              TABS
          ================================================= */}

          <div
            className="
              mt-5
              flex
              gap-1
              overflow-x-auto
            "
          >

            {tabs.map(
              ([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setTab(id)
                  }
                  className={`
                    whitespace-nowrap
                    border
                    px-3
                    py-2
                    text-[7px]
                    uppercase
                    tracking-[1.5px]
                    transition
                    ${
                      tab === id
                        ? `
                          border-[#ff3b12]
                          bg-[#ff3b12]/5
                          text-white
                        `
                        : `
                          border-white/10
                          text-white/35
                          hover:text-white
                        `
                    }
                  `}
                >
                  {label}
                </button>
              )
            )}

          </div>
        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="p-6 md:p-8">

          {/* =================================================
              TAB 1 — STORY & NOW
          ================================================= */}

          {tab === "story" && (
            <section>

              <div
                className="
                  grid
                  gap-3
                  sm:grid-cols-3
                "
              >

                <Metric
                  label="SUNLIGHT"
                  value="—"
                />

                <Metric
                  label="EARTH SIGNAL"
                  value="—"
                />

                <Metric
                  label="STATUS"
                  value={
                    site.status ??
                    "—"
                  }
                />

              </div>

              <h3
                className="
                  mt-9
                  font-['Michroma']
                  text-base
                "
              >
                Why this site matters
              </h3>

              <p
                className="
                  mt-4
                  max-w-[560px]
                  text-[10px]
                  leading-[1.8]
                  text-white/45
                "
              >
                {site.description ??
                  "Use the mission dataset to provide a short, kid-friendly explanation of why this location matters."}
              </p>

              {/* KID FRIENDLY EXPLANATION */}

              <div
                className="
                  mt-8
                  border-l
                  border-[#ff3b12]
                  pl-4
                  text-[10px]
                  leading-[1.7]
                  text-white/50
                "
              >
                This location can be explored
                using terrain, sunlight,
                horizon and mission data.
                The scientific values shown
                here should come directly
                from the validated mission
                datasets.
              </div>

              {/* LOCATION DATA */}

              <div
                className="
                  mt-8
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >

                <InfoRow
                  label="LATITUDE"
                  value={
                    site.latitude ??
                    "—"
                  }
                />

                <InfoRow
                  label="LONGITUDE"
                  value={
                    site.longitude ??
                    "—"
                  }
                />

                <InfoRow
                  label="COUNTRY"
                  value={
                    site.country ??
                    "—"
                  }
                />

                <InfoRow
                  label="MISSION"
                  value={
                    site.mission ??
                    "—"
                  }
                />

              </div>

            </section>
          )}

          {/* =================================================
              TAB 2 — TERRAIN
          ================================================= */}

          {tab === "terrain" && (
            <section>

              <VisualPlaceholder
                title="30 × 30 KM TERRAIN"
                subtitle="
                  Elevation · slope · sunlight · live shadows
                "
              />

              <div
                className="
                  mt-5
                  grid
                  grid-cols-2
                  gap-2
                  sm:grid-cols-4
                "
              >

                <LayerButton
                  label="HEIGHT"
                  active
                />

                <LayerButton
                  label="SLOPE"
                />

                <LayerButton
                  label="SUNLIGHT"
                />

                <LayerButton
                  label="SHADOW"
                />

              </div>

            </section>
          )}

          {/* =================================================
              TAB 3 — HORIZON
          ================================================= */}

          {tab === "horizon" && (
            <section>

              <VisualPlaceholder
                title="360° HORIZON"
                subtitle="
                  720-ray terrain mask · Sun · Earth
                "
              />

              <div
                className="
                  mt-5
                  border
                  border-white/10
                  p-5
                "
              >

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >

                  <span
                    className="
                      text-[8px]
                      uppercase
                      tracking-[2px]
                      text-white/35
                    "
                  >
                    HORIZON COVERAGE
                  </span>

                  <span
                    className="
                      font-['Michroma']
                      text-sm
                      text-[#ff3b12]
                    "
                  >
                    360°
                  </span>

                </div>

                <div
                  className="
                    mt-5
                    h-px
                    w-full
                    bg-white/10
                  "
                />

                <p
                  className="
                    mt-4
                    text-[9px]
                    leading-[1.7]
                    text-white/35
                  "
                >
                  The final horizon
                  visualization should use the
                  validated terrain horizon-mask
                  product.
                </p>

              </div>

            </section>
          )}

          {/* =================================================
              TAB 4 — NEIGHBOURHOOD
          ================================================= */}

          {tab === "neighbourhood" && (
            <section>

              <VisualPlaceholder
                title="6 × 6 KM NEIGHBOURHOOD"
                subtitle="
                  Average illumination · traversable region
                "
              />

              <div
                className="
                  mt-5
                  grid
                  gap-3
                  sm:grid-cols-3
                "
              >

                <Metric
                  label="ILLUMINATION"
                  value="—"
                />

                <Metric
                  label="RIDGES"
                  value="—"
                />

                <Metric
                  label="TRAVERSE"
                  value="—"
                />

              </div>

            </section>
          )}

          {/* =================================================
              TAB 5 — NASA DATA
          ================================================= */}

          {tab === "data" && (
            <section>

              <div
                className="
                  grid
                  gap-2
                  sm:grid-cols-2
                "
              >

                <DataCard
                  label="MOON_ME COORDINATES"
                  value="—"
                />

                <DataCard
                  label="SOLAR POWER FLUX"
                  value="—"
                />

                <DataCard
                  label="DEM UNCERTAINTY"
                  value="—"
                />

                <DataCard
                  label="JPL HORIZONS"
                  value="NOT CONNECTED"
                />

              </div>

              <div
                className="
                  mt-6
                  border
                  border-[#ff3b12]/20
                  bg-[#ff3b12]/5
                  p-5
                "
              >

                <div
                  className="
                    text-[8px]
                    uppercase
                    tracking-[2px]
                    text-[#ff3b12]
                  "
                >
                  NASA VALIDATION
                </div>

                <p
                  className="
                    mt-3
                    text-[9px]
                    leading-[1.7]
                    text-white/40
                  "
                >
                  Scientific measurements
                  should only be populated once
                  the corresponding validated
                  ephemeris, terrain and
                  verification products are
                  connected.
                </p>

              </div>

            </section>
          )}

        </div>
      </aside>
    </div>
  );
}

/* ===========================================================
   METRIC
=========================================================== */

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="
        border
        border-white/10
        p-4
      "
    >

      <div
        className="
          text-[7px]
          uppercase
          tracking-[2px]
          text-white/30
        "
      >
        {label}
      </div>

      <div
        className="
          mt-4
          font-['Michroma']
          text-sm
        "
      >
        {value}
      </div>

    </div>
  );
}

/* ===========================================================
   INFO ROW
=========================================================== */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="
        border-t
        border-white/10
        pt-3
      "
    >

      <div
        className="
          text-[7px]
          uppercase
          tracking-[2px]
          text-white/30
        "
      >
        {label}
      </div>

      <div
        className="
          mt-2
          text-[10px]
          text-white/70
        "
      >
        {value}
      </div>

    </div>
  );
}

/* ===========================================================
   DATA CARD
=========================================================== */

function DataCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        border
        border-white/10
        p-4
      "
    >

      <div
        className="
          text-[7px]
          uppercase
          tracking-[2px]
          text-white/30
        "
      >
        {label}
      </div>

      <div
        className="
          mt-3
          font-['Michroma']
          text-[11px]
        "
      >
        {value}
      </div>

    </div>
  );
}

/* ===========================================================
   LAYER BUTTON
=========================================================== */

function LayerButton({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`
        border
        px-3
        py-3
        text-[7px]
        uppercase
        tracking-[2px]
        transition
        ${
          active
            ? `
              border-[#ff3b12]
              bg-[#ff3b12]/10
              text-white
            `
            : `
              border-white/10
              text-white/35
              hover:border-white/30
              hover:text-white
            `
        }
      `}
    >
      {label}
    </button>
  );
}

/* ===========================================================
   VISUAL PLACEHOLDER
=========================================================== */

function VisualPlaceholder({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>

      <div
        className="
          relative
          h-[340px]
          overflow-hidden
          border
          border-white/10
          bg-[#090909]
        "
      >

        {/* GRID */}

        <div
          className="
            absolute
            inset-0
            opacity-20
            bg-[linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)]
            bg-[size:35px_35px]
          "
        />

        {/* CENTRAL OBJECT */}

        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-44
            w-44
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            border
            border-[#ff3b12]/30
            shadow-[0_0_60px_rgba(255,59,18,0.08)]
          "
        />

        {/* TARGET */}

        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-2
            w-2
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-[#ff3b12]
            shadow-[0_0_15px_rgba(255,59,18,0.8)]
          "
        />

        {/* LABEL */}

        <div
          className="
            absolute
            bottom-5
            left-5
          "
        >

          <div
            className="
              font-['Michroma']
              text-sm
            "
          >
            {title}
          </div>

          <div
            className="
              mt-2
              text-[8px]
              text-white/35
            "
          >
            {subtitle}
          </div>

        </div>

      </div>

      <p
        className="
          mt-4
          text-[9px]
          leading-[1.7]
          text-white/35
        "
      >
        Visualization shell. Connect
        the validated terrain and
        rendering products here.
      </p>

    </div>
  );
}