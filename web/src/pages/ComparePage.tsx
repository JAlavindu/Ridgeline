import { useState } from "react";

import CompareHero from "../components/compare/CompareHero";
import CompareSiteCard from "../components/compare/CompareSiteCard";
import ComparisonTable from "../components/compare/ComparisonTable";
import SitePicker from "../components/compare/SitePicker";

import { lunarSites, type LunarSite } from "../data/lunarSites";
import {
  useScenario,
  type ScenarioResult,
  type ScenarioState,
} from "../hooks/useScenario";
import { useCustomHorizon } from "../hooks/useCustomHorizon";
import type { ScenarioCard } from "../lib/plan";
import { bestCards } from "../components/plan/metrics";

const AVAILABLE_SITES = lunarSites.filter(
  (site) => site.latitude !== null && site.longitude !== null,
);

const INITIAL_SITES = AVAILABLE_SITES.slice(0, 4);

function makeCard(site: LunarSite, index: number): ScenarioCard {
  return {
    id: `compare-${index}-${site.id}`,
    site: {
      kind: "preset",
      siteId: site.id,
    },
    startUtc: "2026-12-01T00:00",
    missionDays: 14,
  };
}

function useCompareSlot(
  card: ScenarioCard | undefined,
): ScenarioState {
  const custom = useCustomHorizon(card ?? null);

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
): ScenarioState[] {
  const s0 = useCompareSlot(cards[0]);
  const s1 = useCompareSlot(cards[1]);
  const s2 = useCompareSlot(cards[2]);
  const s3 = useCompareSlot(cards[3]);

  return [s0, s1, s2, s3].slice(0, cards.length);
}

function siteFromCard(
  card: ScenarioCard,
): LunarSite | null {
  if (card.site.kind !== "preset") return null;

  const siteId = (
    card.site as { kind: "preset"; siteId: string }
  ).siteId;

  return (
    lunarSites.find((site) => site.id === siteId) ?? null
  );
}

export default function ComparePage() {
  const [cards, setCards] = useState<ScenarioCard[]>(
    INITIAL_SITES.map((site, index) =>
      makeCard(site, index),
    ),
  );

  const [pickerOpen, setPickerOpen] = useState(false);

  const states = useCompareBoard(cards);

  const results = cards
    .map((card, index) => ({
      id: card.id,
      result:
        states[index]?.status === "ready"
          ? states[index].result
          : null,
    }))
    .filter(
      (
        item,
      ): item is {
        id: string;
        result: ScenarioResult;
      } => item.result !== null,
    );

  const best = bestCards(results);

  const selectedSites = cards
    .map(siteFromCard)
    .filter(
      (site): site is LunarSite => site !== null,
    );

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

  const removeSite = (cardId: string) => {
    setCards((current) =>
      current.filter((card) => card.id !== cardId),
    );
  };

  const addSite = (siteId: string) => {
    const site = lunarSites.find(
      (item) => item.id === siteId,
    );

    if (!site) return;

    setCards((current) => {
      if (current.length >= 4) return current;

      return [
        ...current,
        makeCard(site, current.length),
      ];
    });

    setPickerOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#020202] px-6 pb-24 pt-28 text-white sm:px-8 lg:px-[7.5vw]">
      <div className="mx-auto max-w-[1500px]">
        <CompareHero
          siteCount={cards.length}
          onSettings={() => {}}
        />

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
            {cards.map((card, index) => {
              const site = siteFromCard(card);

              if (!site) return null;

              return (
                <CompareSiteCard
                  key={card.id}
                  site={site}
                  index={index}
                  sites={selectedSites}
                  availableSites={AVAILABLE_SITES}
                  state={states[index] ?? { status: "loading" }}
                  best={best}
                  cardId={card.id}
                  onRemove={() =>
                    removeSite(card.id)
                  }
                  onChange={(siteId) =>
                    changeSite(card.id, siteId)
                  }
                />
              );
            })}

            {cards.length < 4 && (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
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
                    Compare another location
                  </span>
                </span>
              </button>
            )}
          </div>
        </section>

        <section className="mt-20 border-t border-white/[0.08] pt-16">
          <ComparisonTable
            cards={cards}
            states={states}
            best={best}
          />
        </section>
      </div>

      {pickerOpen && (
        <SitePicker
          sites={AVAILABLE_SITES}
          selectedSites={selectedSites}
          onSelect={addSite}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </main>
  );
}