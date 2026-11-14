import { type ReactNode } from "react";

import ScenarioCard from "../components/plan/ScenarioCard";
import SettingsPanel from "../components/plan/SettingsPanel";
import { bestCards } from "../components/plan/metrics";
import { lunarSites } from "../data/lunarSites";
import { useScenario, type ScenarioResult, type ScenarioState } from "../hooks/useScenario";
import { MAX_CARDS, usePlan, type ScenarioCard as Card } from "../lib/plan";

/** Hooks need a fixed count: one slot per possible card. Custom horizons arrive in a later step. */
function useBoard(cards: Card[]): ScenarioState[] {
  const s0 = useScenario(cards[0] ?? null, cards[0]?.site.kind === "custom" ? null : undefined);
  const s1 = useScenario(cards[1] ?? null, cards[1]?.site.kind === "custom" ? null : undefined);
  const s2 = useScenario(cards[2] ?? null, cards[2]?.site.kind === "custom" ? null : undefined);
  const s3 = useScenario(cards[3] ?? null, cards[3]?.site.kind === "custom" ? null : undefined);
  return [s0, s1, s2, s3].slice(0, cards.length);
}

export default function PlanPage() {
  const { state, dispatch } = usePlan();
  const { cards, selectedId } = state;
  const states = useBoard(cards);

  const ready = cards
    .map((card, i) => ({ id: card.id, s: states[i] }))
    .filter((x): x is { id: string; s: { status: "ready"; result: ScenarioResult } } => x.s?.status === "ready")
    .map((x) => ({ id: x.id, result: x.s.result }));
  const best = bestCards(ready);

  const selectedIndex = Math.max(0, cards.findIndex((c) => c.id === selectedId));
  const selected = cards[selectedIndex];
  const selectedState = states[selectedIndex];

  const addScenario = () => {
    const used = new Set(cards.map((c) => (c.site.kind === "preset" ? c.site.siteId : "")));
    const next = lunarSites.find((s) => s.latitude !== null && !used.has(s.id)) ?? lunarSites[0];
    dispatch({
      type: "add",
      card: { site: { kind: "preset", siteId: next.id }, startUtc: selected?.startUtc ?? "2026-12-01T00:00", missionDays: selected?.missionDays ?? 14 },
    });
  };

  return (
    <main className="min-h-screen bg-[#020202] px-4 pb-24 pt-24 text-white sm:px-8 sm:pt-28">
      <div className="mx-auto max-w-[1440px]">
        <p className="text-[12px] text-white/45">Plan</p>
        <h1 className="mt-1.5 font-['Michroma'] text-[22px] uppercase leading-tight sm:text-[28px]">Plan a landing</h1>
        <p className="mt-3 max-w-[70ch] text-[14px] leading-[1.75] text-white/65">
          Compare up to four sites and dates side by side. Every number comes from the JPL ephemeris and the terrain
          horizon for each site, and changes as soon as you edit a card or the mission rules.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <section aria-label="Scenario board" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {cards.map((card, i) => (
                <ScenarioCard
                  key={card.id}
                  card={card}
                  state={states[i] ?? { status: "loading" }}
                  selected={card.id === selected?.id}
                  best={best}
                  canRemove={cards.length > 1}
                  canDuplicate={cards.length < MAX_CARDS}
                  onUpdate={(patch) => dispatch({ type: "update", id: card.id, patch })}
                  onSelect={() => dispatch({ type: "select", id: card.id })}
                  onRemove={() => dispatch({ type: "remove", id: card.id })}
                  onDuplicate={() => dispatch({ type: "duplicate", id: card.id })}
                  onPickCustom={() => dispatch({ type: "select", id: card.id })}
                />
              ))}
              {cards.length < MAX_CARDS && (
                <button
                  type="button"
                  onClick={addScenario}
                  className="flex min-h-[160px] items-center justify-center rounded-[14px] border border-dashed border-white/[0.14] text-[13px] text-white/55 transition hover:border-white/30 hover:text-white"
                >
                  + Add scenario
                </button>
              )}
            </section>

            {selected && (
              <section aria-label="Selected scenario" className="mt-12">
                <h2 className="text-[15px] font-medium">
                  {selectedState?.status === "ready" ? selectedState.result.name : "Selected scenario"}
                  <span className="ml-2 text-[12px] font-normal text-white/45">
                    from {selected.startUtc.replace("T", " ")} UTC · {selected.missionDays} days
                  </span>
                </h2>
                <Details state={selectedState} card={selected} />
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <details className="group rounded-[14px] border border-white/[0.08] bg-[#0a0a0a] p-4 lg:open:pb-2" open>
              <summary className="cursor-pointer list-none text-[12px] text-white/50 lg:hidden [&::-webkit-details-marker]:hidden">
                Mission rules ▾
              </summary>
              <SettingsPanel />
            </details>
          </aside>
        </div>
      </div>
    </main>
  );
}

/** The selected card's deeper views. Filled in by the slip chart, timeline and window finder. */
function Details({ state, card }: { state: ScenarioState | undefined; card: Card }): ReactNode {
  if (!state || state.status !== "ready") {
    return <p className="mt-3 text-[12px] text-white/40">{state?.status === "error" ? state.message : "Working out the sky…"}</p>;
  }
  return <DetailsReady result={state.result} card={card} />;
}

function DetailsReady({ result }: { result: ScenarioResult; card: Card }) {
  return (
    <p className="mt-3 text-[12px] text-white/40">
      {result.series.tdb.length} samples every 10 minutes over the mission.
    </p>
  );
}
