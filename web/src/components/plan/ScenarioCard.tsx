import type { BodyOutlook } from "../../engine";
import { lunarSites } from "../../data/lunarSites";
import type { ScenarioState } from "../../hooks/useScenario";
import { eventLabel, formatCountdown } from "../../lib/format";
import type { ScenarioCard as Card } from "../../lib/plan";
import { METRICS } from "./metrics";

const SITES = lunarSites.filter((s) => s.latitude !== null && s.longitude !== null);
const CUSTOM_VALUE = "__custom__";

interface Props {
  card: Card;
  state: ScenarioState;
  selected: boolean;
  best: Record<string, Set<string>>;
  canRemove: boolean;
  canDuplicate: boolean;
  onUpdate: (patch: Partial<Omit<Card, "id">>) => void;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onPickCustom: () => void;
}

function nextText(body: BodyOutlook): string {
  if (!body.next) return "No change in the next 60 days";
  const when = body.next.window_only ? "" : ` · ${body.next.formatted_target_utc}`;
  return `${eventLabel(body.next.event)} in ${formatCountdown(body.next)}${when}`;
}

export default function ScenarioCard({
  card, state, selected, best, canRemove, canDuplicate, onUpdate, onSelect, onRemove, onDuplicate, onPickCustom,
}: Props) {
  const siteValue = card.site.kind === "preset" ? card.site.siteId : CUSTOM_VALUE;

  return (
    <article
      aria-label="Scenario"
      onClick={onSelect}
      className={`flex min-w-0 cursor-pointer flex-col rounded-[14px] border bg-[#0a0a0a] p-4 transition ${
        selected ? "border-[#ff3b12]/70" : "border-white/[0.08] hover:border-white/20"
      }`}
    >
      {/* inputs: clicks here must not re-select, so stop them at the form */}
      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
        <label className="block text-[11px] text-white/45">
          Site
          <select
            value={siteValue}
            onChange={(e) => {
              if (e.target.value === CUSTOM_VALUE) onPickCustom();
              else onUpdate({ site: { kind: "preset", siteId: e.target.value } });
            }}
            className="mt-1 h-9 w-full rounded-md border border-white/[0.12] bg-[#0a0a0a] px-2 text-[13px] text-white outline-none [color-scheme:dark] focus:border-white/35"
          >
            {SITES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
            <option value={CUSTOM_VALUE}>{card.site.kind === "custom" ? card.site.label : "Custom coordinates…"}</option>
          </select>
        </label>
        <div className="grid grid-cols-[1fr_76px] gap-2">
          <label className="block text-[11px] text-white/45">
            Start (UTC)
            <input
              type="datetime-local"
              value={card.startUtc}
              min="2023-01-01T00:00"
              max="2032-12-31T23:00"
              onChange={(e) => e.target.value && onUpdate({ startUtc: e.target.value })}
              className="mt-1 h-9 w-full rounded-md border border-white/[0.12] bg-white/[0.03] px-2 text-[12px] tabular-nums text-white outline-none [color-scheme:dark] focus:border-white/35"
            />
          </label>
          <label className="block text-[11px] text-white/45">
            Days
            <input
              type="number"
              min={1}
              max={30}
              value={card.missionDays}
              onChange={(e) => {
                const v = Math.round(Number(e.target.value));
                if (v >= 1 && v <= 30) onUpdate({ missionDays: v });
              }}
              className="mt-1 h-9 w-full rounded-md border border-white/[0.12] bg-white/[0.03] px-2 text-[12px] tabular-nums text-white outline-none focus:border-white/35"
            />
          </label>
        </div>
      </div>

      {state.status === "loading" && <p className="mt-4 text-[12px] text-white/40">Working out the sky…</p>}
      {state.status === "error" && (
        <p className="mt-4 border-l-2 border-[#ff3b12]/70 pl-3 text-[12px] leading-[1.6] text-white/60">{state.message}</p>
      )}
      {state.status === "ready" && (
        <>
          <dl className="mt-4 border-t border-white/[0.08]">
            {METRICS.map((m) => {
              const isBest = best[m.key]?.has(card.id) ?? false;
              const v = m.value(state.result);
              return (
                <div key={m.key} className="flex items-baseline justify-between gap-3 border-b border-white/[0.08] py-2">
                  <dt className="text-[11px] text-white/50">{m.label}</dt>
                  <dd className={`text-right text-[13px] tabular-nums ${isBest || !best[m.key] ? "text-white" : "text-white/55"}`}>
                    {m.format(v, state.result)}
                  </dd>
                </div>
              );
            })}
          </dl>
          <div className="mt-3 space-y-1 text-[11px] leading-[1.6] text-white/55">
            <p><span className="text-white/35">Sun: </span>{nextText(state.result.look.sun)}</p>
            <p><span className="text-white/35">Earth: </span>{nextText(state.result.look.earth)}</p>
          </div>
          <p className="mt-3 text-[11px] text-white/35">
            Horizon: {state.result.horizonKind}
            {state.result.horizonKind.startsWith("approximate") && " (may be off by several degrees, test V14)"} · {Math.abs(state.result.lat).toFixed(2)}° {state.result.lat < 0 ? "S" : "N"},{" "}
            {(((state.result.lon % 360) + 360) % 360).toFixed(2)}° E
          </p>
        </>
      )}

      <div className="mt-auto flex gap-4 pt-4 text-[12px]" onClick={(e) => e.stopPropagation()}>
        <button type="button" disabled={!canDuplicate} onClick={onDuplicate} className="text-white/60 hover:text-white disabled:text-white/20">
          Duplicate
        </button>
        <button type="button" disabled={!canRemove} onClick={onRemove} className="text-white/60 hover:text-white disabled:text-white/20">
          Remove
        </button>
        {card.site.kind === "custom" && (
          <button type="button" onClick={onPickCustom} className="text-white/60 hover:text-white">
            Edit point
          </button>
        )}
        {!selected && (
          <button type="button" onClick={onSelect} className="ml-auto text-white/60 hover:text-white">
            Details ↓
          </button>
        )}
      </div>
    </article>
  );
}
