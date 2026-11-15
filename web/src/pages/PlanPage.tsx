import { useCallback, useState, type ReactNode } from "react";

import { DEFAULT_VIABILITY, type Viability } from "../engine";

import CompareGrid from "../components/plan/CompareGrid";
import CustomSitePicker from "../components/plan/CustomSitePicker";
import PlanBar from "../components/plan/PlanBar";
import SlipChart from "../components/plan/SlipChart";
import Timeline from "../components/plan/Timeline";
import WindowFinder from "../components/plan/WindowFinder";
import { bestCards } from "../components/plan/metrics";
import { lunarSites } from "../data/lunarSites";
import { useCustomHorizon } from "../hooks/useCustomHorizon";
import { useScenario, type ScenarioResult, type ScenarioState } from "../hooks/useScenario";
import { usePlan, type ScenarioCard as Card } from "../lib/plan";
import { formatPoint } from "../lib/terrainZone";

/** Hooks need a fixed count: one slot per possible card. */
function useSlot(card: Card | undefined): ScenarioState {
  const custom = useCustomHorizon(card ?? null);
  // custom cards: undefined while the worker builds the horizon, null outside the polar map
  return useScenario(card ?? null, card?.site.kind === "custom" ? (custom === undefined ? undefined : custom.mask) : undefined);
}

function useBoard(cards: Card[]): ScenarioState[] {
  const s0 = useSlot(cards[0]);
  const s1 = useSlot(cards[1]);
  const s2 = useSlot(cards[2]);
  const s3 = useSlot(cards[3]);
  return [s0, s1, s2, s3].slice(0, cards.length);
}

export default function PlanPage() {
  const { state, dispatch } = usePlan();
  const { cards, selectedId } = state;
  const states = useBoard(cards);
  const [viability, setViability] = useState<Viability>(DEFAULT_VIABILITY);
  const [pickingFor, setPickingFor] = useState<string | null>(null);
  // stable, so the modal's Escape listener is not re-attached on every render
  const closePicker = useCallback(() => setPickingFor(null), []);

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
      <div className="mx-auto max-w-[1520px]">
        <p className="text-[13px] text-white/45">Plan</p>
        <h1 className="mt-1.5 font-['Michroma'] text-[28px] uppercase leading-[36px] sm:text-[36px] sm:leading-[44px]">Plan a landing</h1>
        <p className="mt-3 max-w-[70ch] text-[16px] leading-[1.75] text-white/65">
          Pick up to four landing sites and see which one gets the most sunlight, the shortest dark spell and the most
          time to talk to Earth during your mission.
        </p>

        <div className="mt-8">
          <PlanBar mission={state.mission} onMission={(patch) => dispatch({ type: "mission", patch })} viability={viability} />
        </div>

        <div className="mt-6">
          <CompareGrid
            cards={cards}
            states={states}
            selectedId={selected?.id}
            best={best}
            viability={viability}
            onUpdate={(id, patch) => dispatch({ type: "update", id, patch })}
            onOwnDates={(id, on) => dispatch({ type: "ownDates", id, on })}
            onSelect={(id) => dispatch({ type: "select", id })}
            onRemove={(id) => dispatch({ type: "remove", id })}
            onDuplicate={(id) => dispatch({ type: "duplicate", id })}
            onPickCustom={(id) => {
              dispatch({ type: "select", id });
              setPickingFor(id);
            }}
            onAdd={addScenario}
          />
          <p className="mt-2 text-[13px] text-white/40">
            Click a column to see its details below.<span className="xl:hidden"> Swipe the table sideways to see all four columns →</span>
          </p>
        </div>

        {pickingFor && cards.some((c) => c.id === pickingFor) && (
          <CustomSitePicker
            initial={(() => {
              const c = cards.find((x) => x.id === pickingFor)!;
              return c.site.kind === "custom" ? { lat: c.site.lat, lon: c.site.lon } : null;
            })()}
            onCancel={closePicker}
            onUse={(lat, lon) => {
              dispatch({ type: "update", id: pickingFor, patch: { site: { kind: "custom", lat, lon, label: formatPoint(lat, lon) } } });
              setPickingFor(null);
            }}
          />
        )}

        {selected && (
          <section aria-label="Selected scenario" className="mt-14">
            <h2 className="text-[18px] font-medium">
              {selectedState?.status === "ready" ? selectedState.result.name : "Selected scenario"}
              <span className="ml-2 text-[14px] font-normal text-white/45">
                from {selected.startUtc.replace("T", " ")} UTC · {selected.missionDays} days
              </span>
            </h2>
            <Details
              state={selectedState}
              card={selected}
              viability={viability}
              onViability={setViability}
              onUseDate={(startUtc) =>
                // a column on the shared mission moves the whole mission; one with its own dates moves alone
                selected.ownDates
                  ? dispatch({ type: "update", id: selected.id, patch: { startUtc } })
                  : dispatch({ type: "mission", patch: { startUtc } })
              }
            />
          </section>
        )}
      </div>
    </main>
  );
}

interface DetailsProps {
  state: ScenarioState | undefined;
  card: Card;
  viability: Viability;
  onViability: (v: Viability) => void;
  onUseDate: (startUtc: string) => void;
}

/** The selected card's deeper views: launch slip and the mission timeline. */
function Details({ state, card, viability, onViability, onUseDate }: DetailsProps): ReactNode {
  if (!state || state.status !== "ready") {
    return <p className="mt-3 text-[14px] text-white/45">{state?.status === "error" ? state.message : "Working out the sky…"}</p>;
  }
  return (
    <div className="mt-5 space-y-6">
      {/* side by side on wide screens, stacked below that */}
      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <div className="min-w-0 rounded-[14px] border border-white/[0.08] bg-[#0a0a0a] p-5 sm:p-6">
          <Timeline series={state.result.series} />
        </div>
        <div className="min-w-0 rounded-[14px] border border-white/[0.08] bg-[#0a0a0a] p-5 sm:p-6">
          <SlipChart
            result={state.result}
            startUtc={card.startUtc}
            missionDays={card.missionDays}
            viability={viability}
            onViability={onViability}
            onUseDate={onUseDate}
          />
        </div>
      </div>
      <div className="rounded-[14px] border border-white/[0.08] bg-[#0a0a0a] p-5 sm:p-6">
        <WindowFinder
          result={state.result}
          startUtc={card.startUtc}
          missionDays={card.missionDays}
          viability={viability}
          onUseDate={onUseDate}
        />
      </div>
    </div>
  );
}
