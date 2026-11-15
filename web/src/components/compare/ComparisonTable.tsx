import type { ScenarioCard } from "../../lib/plan";
import type { ScenarioState } from "../../hooks/useScenario";
import { METRICS } from "../plan/metrics";

interface Props {
  cards: ScenarioCard[];
  states: ScenarioState[];
  best: Record<string, Set<string>>;
}

export default function ComparisonTable({
  cards,
  states,
  best,
}: Props) {
  return (
    <section>
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[2px] text-[#E2791D]">
          At a glance
        </p>

        <h2 className="mt-2 text-2xl font-medium tracking-[-0.5px]">
          Compare the numbers.
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-white/35">
          Every value is calculated from the same mission
          rules and the JPL ephemeris.
        </p>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-white/[0.08] bg-[#080808]">
        <div
          className="min-w-[760px]"
          style={{
            display: "grid",
            gridTemplateColumns: `minmax(220px, 1.4fr) repeat(${cards.length}, minmax(150px, 1fr))`,
          }}
        >
          <div className="border-b border-white/[0.08] p-5 text-[11px] uppercase tracking-[1.5px] text-white/25">
            Metric
          </div>

          {cards.map((card, index) => {
            const state = states[index];

            return (
              <div
                key={card.id}
                className="border-b border-l border-white/[0.08] p-5"
              >
                <p className="text-[10px] uppercase tracking-[1.5px] text-white/25">
                  Site{" "}
                  {String.fromCharCode(
                    65 + index,
                  )}
                </p>

                <p className="mt-2 truncate text-sm font-medium text-white">
                  {state?.status === "ready"
                    ? state.result.name
                    : "Calculating…"}
                </p>
              </div>
            );
          })}

          {METRICS.map((metric) => (
            <div
              key={metric.key}
              className="contents"
            >
              <div className="border-b border-white/[0.08] p-5">
                <p className="text-sm text-white/65">
                  {metric.label}
                </p>

                <p className="mt-1 text-xs leading-5 text-white/25">
                  {description(metric.key)}
                </p>
              </div>

              {cards.map((card, index) => {
                const state = states[index];

                const ready =
                  state?.status === "ready";

                if (!ready) {
                  return (
                    <div
                      key={`${card.id}-${metric.key}`}
                      className="border-b border-l border-white/[0.08] p-5 text-sm text-white/25"
                    >
                      —
                    </div>
                  );
                }

                const value = metric.value(
                  state.result,
                );

                const isBest =
                  best[metric.key]?.has(
                    card.id,
                  ) ?? false;

                return (
                  <div
                    key={`${card.id}-${metric.key}`}
                    className="border-b border-l border-white/[0.08] p-5"
                  >
                    <span
                      className={
                        isBest
                          ? "text-[#E2791D]"
                          : "text-white/75"
                      }
                    >
                      {metric.format(
                        value,
                        state.result,
                      )}
                    </span>

                    {isBest && (
                      <span className="ml-2 text-[9px] uppercase tracking-[1px] text-[#E2791D]/70">
                        Best
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="p-5">
            <p className="text-sm text-white/65">
              Earth in front of Sun
            </p>

            <p className="mt-1 text-xs text-white/25">
              Time when Earth crosses the Sun's apparent disc.
            </p>
          </div>

          {cards.map((card, index) => {
            const state = states[index];

            return (
              <div
                key={`eclipse-${card.id}`}
                className="border-l border-white/[0.08] p-5"
              >
                {state?.status === "ready"
                  ? state.result.summary
                      .eclipse_hours > 0
                    ? `${state.result.summary.eclipse_hours.toFixed(
                        1,
                      )} h`
                    : "None"
                  : "—"}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function description(key: string) {
  switch (key) {
    case "sun_up":
      return "How often some sunlight reaches the site.";

    case "avg_sun":
      return "Average fraction of the Sun visible.";

    case "panel":
      return "Available solar energy at the panel.";

    case "earth":
      return "How often Earth is visible above the horizon.";

    case "both":
      return "Time with sunlight and Earth contact together.";

    case "night":
      return "Longest continuous period without sunlight.";

    case "gap":
      return "Longest continuous communication gap.";

    default:
      return "";
  }
}