import { useState } from "react";

import CompareHero from "../components/compare/CompareHero";
import CompareSiteCard from "../components/compare/CompareSiteCard";
import ComparisonTable from "../components/compare/ComparisonTable";
import SitePicker from "../components/compare/SitePicker";

import CustomSitePicker from "../components/plan/CustomSitePicker";
import SettingsPanel from "../components/plan/SettingsPanel";
import Timeline from "../components/plan/Timeline";
import SlipChart from "../components/plan/SlipChart";
import WindowFinder from "../components/plan/WindowFinder";

import {
  lunarSites,
  type LunarSite,
} from "../data/lunarSites";

import {
  DEFAULT_VIABILITY,
  type Viability,
} from "../engine";

import {
  useScenario,
  type ScenarioResult,
  type ScenarioState,
} from "../hooks/useScenario";

import { useCustomHorizon } from "../hooks/useCustomHorizon";

import {
  type ScenarioCard,
  newId,
} from "../lib/plan";

import { bestCards } from "../components/plan/metrics";

const AVAILABLE_SITES =
  lunarSites.filter(
    (site) =>
      site.latitude !== null &&
      site.longitude !== null,
  );

const INITIAL_SITES =
  AVAILABLE_SITES.slice(0, 4);

function makeCard(
  site: LunarSite,
  index: number,
): ScenarioCard {
  return {
    id: `compare-${index}-${site.id}`,
    site: {
      kind: "preset",
      siteId: site.id,
    },
    startUtc:
      "2026-12-01T00:00",
    missionDays: 14,
  };
}

function useCompareSlot(
  card: ScenarioCard | undefined,
): ScenarioState {
  const custom =
    useCustomHorizon(card ?? null);

  return useScenario(
    card ?? null,
    card?.site.kind === "custom"
      ? custom === undefined
        ? undefined
        : custom.mask
      : undefined,
  );
}

function useCompareBoard(
  cards: ScenarioCard[],
) {
  const s0 = useCompareSlot(cards[0]);
  const s1 = useCompareSlot(cards[1]);
  const s2 = useCompareSlot(cards[2]);
  const s3 = useCompareSlot(cards[3]);

  return [s0, s1, s2, s3].slice(
    0,
    cards.length,
  );
}

function siteFromCard(
  card: ScenarioCard,
): LunarSite | null {
  if (card.site.kind !== "preset") {
    return null;
  }

  return (
    lunarSites.find(
      (site) =>
        site.id === card.site.siteId,
    ) ?? null
  );
}

export default function ComparePage() {
  const [cards, setCards] =
    useState<ScenarioCard[]>(
      INITIAL_SITES.map(
        (site, index) =>
          makeCard(site, index),
      ),
    );

  const [pickerOpen, setPickerOpen] =
    useState(false);

  const [customPickerFor, setCustomPickerFor] =
    useState<string | null>(null);

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [selectedCardId, setSelectedCardId] =
    useState<string | null>(
      INITIAL_SITES[0]
        ? `compare-0-${INITIAL_SITES[0].id}`
        : null,
    );

  const [viability, setViability] =
    useState<Viability>(
      DEFAULT_VIABILITY,
    );

  const states =
    useCompareBoard(cards);

  const results = cards
    .map((card, index) => ({
      id: card.id,
      result:
        states[index]?.status ===
        "ready"
          ? states[index].result
          : null,
    }))
    .filter(
      (
        item,
      ): item is {
        id: string;
        result: ScenarioResult;
      } =>
        item.result !== null,
    );

  const best =
    bestCards(results);

  const selectedSites =
    cards
      .map(siteFromCard)
      .filter(
        (
          site,
        ): site is LunarSite =>
          site !== null,
      );

  const selectedIndex =
    Math.max(
      0,
      cards.findIndex(
        (card) =>
          card.id ===
          selectedCardId,
      ),
    );

  const selectedCard =
    cards[selectedIndex];

  const selectedState =
    states[selectedIndex];

  const changeSite = (
    cardId: string,
    siteId: string,
  ) => {
    setCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              site: {
                kind: "preset",
                siteId,
              },
            }
          : card,
      ),
    );
  };

  const removeSite = (
    cardId: string,
  ) => {
    setCards((current) =>
      current.filter(
        (card) =>
          card.id !== cardId,
      ),
    );

    if (
      selectedCardId ===
      cardId
    ) {
      setSelectedCardId(null);
    }
  };

  const addSite = (
    siteId: string,
  ) => {
    const site =
      lunarSites.find(
        (item) =>
          item.id === siteId,
      );

    if (!site) return;

    setCards((current) => {
      if (current.length >= 4) {
        return current;
      }

      return [
        ...current,
        {
          ...makeCard(
            site,
            current.length,
          ),
          id: newId(),
        },
      ];
    });

    setPickerOpen(false);
  };

  const updateCard = (
    cardId: string,
    patch: Partial<
      Omit<ScenarioCard, "id">
    >,
  ) => {
    setCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              ...patch,
            }
          : card,
      ),
    );
  };

  const useCustomLocation = (
    lat: number,
    lon: number,
  ) => {
    if (!customPickerFor) {
      return;
    }

    const label = `${Math.abs(
      lat,
    ).toFixed(2)}° ${
      lat < 0 ? "S" : "N"
    }, ${(
      ((lon % 360) + 360) %
      360
    ).toFixed(2)}° E`;

    updateCard(
      customPickerFor,
      {
        site: {
          kind: "custom",
          lat,
          lon,
          label,
        },
      },
    );

    setSelectedCardId(
      customPickerFor,
    );

    setCustomPickerFor(null);
  };

  const updateStartDate = (
    startUtc: string,
  ) => {
    if (!selectedCard) return;

    updateCard(
      selectedCard.id,
      { startUtc },
    );
  };

  const updateMissionDays = (
    missionDays: number,
  ) => {
    if (!selectedCard) return;

    if (
      missionDays < 1 ||
      missionDays > 30
    ) {
      return;
    }

    updateCard(
      selectedCard.id,
      { missionDays },
    );
  };

  return (
    <main className="min-h-screen bg-[#020202] px-6 pb-32 pt-28 text-white sm:px-8 lg:px-[7.5vw]">
      <div className="mx-auto max-w-[1500px]">

        <CompareHero
          siteCount={cards.length}
          onSettings={() =>
            setSettingsOpen(true)
          }
        />

        {/* SITES */}
        <section className="mt-12">
          <div
            className={`grid gap-4 ${
              cards.length === 1
                ? "grid-cols-1"
                : cards.length === 2
                  ? "grid-cols-1 md:grid-cols-2"
                  : cards.length === 3
                    ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
            }`}
          >
            {cards.map(
              (card, index) => {
                const site =
                  siteFromCard(card);

                const custom =
                  card.site.kind ===
                  "custom"
                    ? card.site
                    : null;

                return (
                  <CompareSiteCard
                    key={card.id}
                    site={site}
                    index={index}
                    sites={selectedSites}
                    availableSites={
                      AVAILABLE_SITES
                    }
                    state={
                      states[index]
                    }
                    best={best}
                    cardId={card.id}
                    customLabel={
                      custom?.label
                    }
                    customLat={
                      custom?.lat
                    }
                    customLon={
                      custom?.lon
                    }
                    onSelect={() =>
                      setSelectedCardId(
                        card.id,
                      )
                    }
                    onRemove={() =>
                      removeSite(
                        card.id,
                      )
                    }
                    onChange={(
                      siteId,
                    ) =>
                      changeSite(
                        card.id,
                        siteId,
                      )
                    }
                    onCustom={() => {
                      setSelectedCardId(
                        card.id,
                      );
                      setCustomPickerFor(
                        card.id,
                      );
                    }}
                  />
                );
              },
            )}

            {cards.length < 4 && (
              <button
                type="button"
                onClick={() =>
                  setPickerOpen(true)
                }
                className="flex min-h-[680px] items-center justify-center rounded-[28px] border border-dashed border-white/[0.12] bg-white/[0.015] text-white/45 transition hover:border-white/25 hover:bg-white/[0.025] hover:text-white"
              >
                <span className="text-center">
                  <span className="block text-3xl font-light">
                    +
                  </span>

                  <span className="mt-3 block text-sm">
                    Add landing site
                  </span>

                  <span className="mt-1 block text-xs text-white/30">
                    Compare another
                    location
                  </span>
                </span>
              </button>
            )}
          </div>
        </section>

        {/* CUSTOM LOCATION */}
        {customPickerFor && (
          <section className="mt-10">
            <CustomSitePicker
              initial={(() => {
                const card =
                  cards.find(
                    (item) =>
                      item.id ===
                      customPickerFor,
                  );

                if (
                  card?.site.kind ===
                  "custom"
                ) {
                  return {
                    lat: card.site.lat,
                    lon: card.site.lon,
                  };
                }

                return null;
              })()}
              onCancel={() =>
                setCustomPickerFor(
                  null,
                )
              }
              onUse={
                useCustomLocation
              }
            />
          </section>
        )}

        {/* COMPARISON */}
        <section className="mt-20 border-t border-white/[0.08] pt-16">
          <ComparisonTable
            cards={cards}
            states={states}
            best={best}
          />
        </section>

        {/* MISSION DETAILS */}
        {selectedCard && (
          <section className="mt-20 border-t border-white/[0.08] pt-16">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[2px] text-[#E2791D]">
                  Mission analysis
                </p>

                <h2 className="mt-3 text-2xl font-medium tracking-[-0.5px]">
                  {selectedState?.status ===
                  "ready"
                    ? selectedState.result.name
                    : "Selected landing site"}
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  {selectedCard.startUtc.replace(
                    "T",
                    " ",
                  )}{" "}
                  UTC ·{" "}
                  {
                    selectedCard.missionDays
                  }{" "}
                  days
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.025] px-4 py-2.5">
                  <span className="text-[10px] uppercase tracking-[1px] text-white/30">
                    Start
                  </span>

                  <input
                    type="datetime-local"
                    value={
                      selectedCard.startUtc
                    }
                    min="2023-01-01T00:00"
                    max="2032-12-31T23:00"
                    onChange={(event) =>
                      event.target
                        .value &&
                      updateStartDate(
                        event.target
                          .value,
                      )
                    }
                    className="bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.025] px-4 py-2.5">
                  <span className="text-[10px] uppercase tracking-[1px] text-white/30">
                    Days
                  </span>

                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={
                      selectedCard.missionDays
                    }
                    onChange={(event) =>
                      updateMissionDays(
                        Number(
                          event.target
                            .value,
                        ),
                      )
                    }
                    className="w-14 bg-transparent text-sm text-white outline-none"
                  />
                </label>
              </div>
            </div>

            {selectedState?.status ===
            "ready" ? (
              <div className="mt-10 space-y-8">

                <div className="rounded-[24px] border border-white/[0.08] bg-[#080808] p-5 sm:p-7">
                  <Timeline
                    series={
                      selectedState
                        .result.series
                    }
                  />
                </div>

                <div className="rounded-[24px] border border-white/[0.08] bg-[#080808] p-5 sm:p-7">
                  <SlipChart
                    result={
                      selectedState.result
                    }
                    startUtc={
                      selectedCard.startUtc
                    }
                    missionDays={
                      selectedCard.missionDays
                    }
                    viability={
                      viability
                    }
                    onViability={
                      setViability
                    }
                    onUseDate={
                      updateStartDate
                    }
                  />
                </div>

                <div className="rounded-[24px] border border-white/[0.08] bg-[#080808] p-5 sm:p-7">
                  <WindowFinder
                    result={
                      selectedState.result
                    }
                    startUtc={
                      selectedCard.startUtc
                    }
                    missionDays={
                      selectedCard.missionDays
                    }
                    viability={
                      viability
                    }
                    onUseDate={
                      updateStartDate
                    }
                  />
                </div>

              </div>
            ) : (
              <p className="mt-8 text-sm text-white/40">
                {selectedState?.status ===
                "error"
                  ? selectedState.message
                  : "Working out the sky…"}
              </p>
            )}
          </section>
        )}

        {/* SETTINGS */}
        <section className="mt-20 border-t border-white/[0.08] pt-16">
          <button
            type="button"
            onClick={() =>
              setSettingsOpen(
                (value) => !value,
              )
            }
            className="flex w-full items-center justify-between rounded-[20px] border border-white/[0.08] bg-[#080808] px-6 py-5 text-left transition hover:border-white/[0.16]"
          >
            <div>
              <p className="text-[10px] uppercase tracking-[2px] text-[#E2791D]">
                Mission configuration
              </p>

              <h2 className="mt-2 text-lg font-medium">
                Mission rules
              </h2>

              <p className="mt-1 text-sm text-white/35">
                Control Earth visibility,
                solar-panel behaviour,
                efficiency and mast
                height.
              </p>
            </div>

            <span className="text-xl text-white/40">
              {settingsOpen
                ? "−"
                : "+"}
            </span>
          </button>

          {settingsOpen && (
            <div className="mt-4 rounded-[24px] border border-white/[0.08] bg-[#080808] p-6 sm:p-8">
              <SettingsPanel />
            </div>
          )}
        </section>
      </div>

      {pickerOpen && (
        <SitePicker
          sites={AVAILABLE_SITES}
          selectedSites={
            selectedSites
          }
          onSelect={addSite}
          onClose={() =>
            setPickerOpen(false)
          }
        />
      )}
    </main>
  );
}