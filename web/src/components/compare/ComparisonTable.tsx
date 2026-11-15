import type { ScenarioState } from "../../hooks/useScenario";
import type { ScenarioCard } from "../../lib/plan";
import { METRICS } from "../plan/metrics";
import MetricIcon from "./MetricIcon";

interface Props {
  cards: ScenarioCard[];
  states: ScenarioState[];
  best: Record<string, Set<string>>;
}

const ICONS: Record<string, "sun" | "earth" | "power" | "comms" | "night"> = {
  sun_up: "sun",
  avg_sun: "sun",
  panel: "power",
  earth: "earth",
  both: "power",
  night: "night",
  gap: "comms",
  eclipse: "earth",
};

export default function ComparisonTable({
  cards,
  states,
  best,
}: Props) {
  return (
    <section>
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          Detailed comparison
        </p>

        <h2 className="mt-2 text-[28px] font-medium tracking-tight">
          Every location, side by side.
        </h2>

        <p className="mt-2 max-w-xl text-[13px] leading-6 text-white/40">
          These values are calculated from the same ephemeris,
          terrain horizon and mission settings used by the planning
          system.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div
          className="min-w-[760px]"
          style={{
            display: "grid",
            gridTemplateColumns: `240px repeat(${cards.length}, minmax(160px, 1fr))`,
          }}
        >
          <div className="border-b border-white/[0.08] p-4" />

          {cards.map((card, index) => (
            <div
              key={card.id}
              className="border-b border-white/[0.08] p-4"
            >
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/25">
                Site {String.fromCharCode(65 + index)}
              </p>

              <p className="mt-2 text-sm text-white/80">
                {states[index]?.status === "ready"
                  ? states[index].result.name
                  : "Calculating…"}
              </p>
            </div>
          ))}

          {METRICS.map((metric) => (
            <MetricRow
              key={metric.key}
              metric={metric}
              cards={cards}
              states={states}
              best={best}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricRow({
  metric,
  cards,
  states,
  best,
}: {
  metric: (typeof METRICS)[number];
  cards: ScenarioCard[];
  states: ScenarioState[];
  best: Record<string, Set<string>>;
}) {
  const icon = ICONS[metric.key] ?? "sun";

  return (
    <>
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <MetricIcon type={icon} />

          <div>
            <p className="text-[12px] text-white/70">
              {metric.label}
            </p>

            <p className="mt-1 text-[10px] leading-4 text-white/25">
              {metric.better === "high"
                ? "Higher is better"
                : "Lower is better"}
            </p>
          </div>
        </div>
      </div>

      {cards.map((card, index) => {
        const state = states[index];

        let value = "—";

        if (state?.status === "ready") {
          value = metric.format(
            metric.value(state.result),
            state.result,
          );
        }

        const winning =
          best[metric.key]?.has(card.id) ?? false;

        return (
          <div
            key={`${card.id}-${metric.key}`}
            className={`border-b border-white/[0.06] p-4 text-sm ${
              winning ? "text-[#E2791D]" : "text-white/65"
            }`}
          >
            {value}

            {winning && (
              <span className="ml-2 text-[8px] uppercase tracking-wider text-[#E2791D]/60">
                Best
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}