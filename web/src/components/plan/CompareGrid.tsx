import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { timelineRows, type BodyOutlook, type Series, type Viability } from "../../engine";
import { lunarSites } from "../../data/lunarSites";
import type { ScenarioResult, ScenarioState } from "../../hooks/useScenario";
import { eventLabel, formatCountdown, formatDuration } from "../../lib/format";
import { MAX_CARDS, type ScenarioCard as Card } from "../../lib/plan";
import DaysInput from "./DaysInput";
import { BothIcon, EarthIcon, NightIcon, SunIcon } from "./icons";
import { METRICS, type Metric, type MetricIcon } from "./metrics";

const SITES = lunarSites.filter((s) => s.latitude !== null && s.longitude !== null);
const CUSTOM_VALUE = "__custom__";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SUN = "#f2c14e";
const EARTH = "#38bdf8";

const ICONS: Record<MetricIcon, () => ReactNode> = { sun: SunIcon, night: NightIcon, earth: EarthIcon, both: BothIcon };
const ICON_COLOR: Record<MetricIcon, string> = { sun: SUN, night: "#a5b4fc", earth: EARTH, both: "#ffffff" };

interface Props {
  cards: Card[];
  states: ScenarioState[];
  selectedId: string | undefined;
  best: Record<string, Set<string>>;
  viability: Viability;
  onUpdate: (id: string, patch: Partial<Omit<Card, "id">>) => void;
  onOwnDates: (id: string, on: boolean) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPickCustom: (id: string) => void;
  onAdd: () => void;
}

/** One slot per column: a scenario, or an empty column inviting the user to add one. */
type Slot = { card: Card; state: ScenarioState } | null;

function nextText(body: BodyOutlook): string {
  if (!body.next) return "No change in the next 60 days";
  const when = body.next.window_only ? "" : ` · ${body.next.formatted_target_utc}`;
  return `${eventLabel(body.next.event)} in ${formatCountdown(body.next)}${when}`;
}

/** "2026-12-01T00:00" -> "1 Dec 2026, 00:00 UTC" */
function startText(startUtc: string): string {
  const [date, time] = startUtc.split("T");
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}, ${time} UTC`;
}

/** Does the column meet the user's rule (the same rule the window finder uses)? Says why not, in words. */
function verdict(r: ScenarioResult, rule: Viability): { ok: boolean; text: string } {
  const why: string[] = [];
  if (r.summary.percent_sunlit < rule.min_sunlight_percent) {
    why.push(`sunlight ${r.summary.percent_sunlit.toFixed(0)}% (rule ${rule.min_sunlight_percent}%)`);
  }
  if (r.summary.longest_night_hours > rule.max_night_hours) {
    why.push(`dark spell ${formatDuration(r.summary.longest_night_hours)} (rule ${rule.max_night_hours} h)`);
  }
  return why.length === 0 ? { ok: true, text: "Meets your rule" } : { ok: false, text: why.join(" · ") };
}

/**
 * Side-by-side comparison, in the style of a product compare page. Every column answers the same questions
 * first (sunlight, the longest dark spell, contact with Earth); the rest waits under "More numbers".
 */
export default function CompareGrid(props: Props) {
  const { cards, states, selectedId, best, onSelect } = props;
  const [more, setMore] = useState(false);
  const slots: Slot[] = Array.from({ length: MAX_CARDS }, (_, i) => (cards[i] ? { card: cards[i], state: states[i] ?? { status: "loading" } } : null));
  const anyOwnDates = cards.some((c) => c.ownDates);

  // a column "wins" a row only when it beats at least one other ready column (not when all tie)
  const readyCount = slots.filter((s) => s?.state.status === "ready").length;
  const wins = (key: string, id: string) => (best[key]?.has(id) ?? false) && (best[key]?.size ?? 0) < readyCount;

  const isSelected = (slot: Slot) => slot !== null && slot.card.id === selectedId;
  const tint = (slot: Slot) => (isSelected(slot) ? "bg-white/[0.035]" : "");
  const selectable = (slot: Slot) => (slot ? { onClick: () => onSelect(slot.card.id) } : {});

  const valueCell = (slot: Slot, key: string, content: ReactNode, extra = "") => (
    <div key={key} role="cell" {...selectable(slot)} className={`min-w-0 border-b border-white/[0.07] px-4 py-4 ${slot ? "cursor-pointer" : ""} ${tint(slot)} ${extra}`}>
      {content}
    </div>
  );

  const labelCell = (content: ReactNode, key: string) => (
    <div
      key={key}
      role="rowheader"
      className="sticky left-0 z-[5] flex min-w-0 items-start gap-2 border-b border-white/[0.07] bg-[#020202] py-4 pr-3 text-[15px] leading-[1.35] text-white/75 xl:static xl:bg-transparent"
    >
      {content}
    </div>
  );

  const rowLabel = (m: Metric) => (
    <>
      {m.icon && <span className="mt-[1px] shrink-0" style={{ color: ICON_COLOR[m.icon] }}>{ICONS[m.icon]()}</span>}
      <span className="min-w-0">{m.label}</span>
      <Help text={m.help} />
    </>
  );

  const metricRow = (m: Metric) => (
    <div key={m.key} role="row" className="contents">
      {labelCell(rowLabel(m), `${m.key}-label`)}
      {slots.map((slot, i) => {
        if (!slot) return valueCell(null, `${m.key}-${i}`, null);
        if (slot.state.status !== "ready") return valueCell(slot, `${m.key}-${i}`, <span className="text-[16px] text-white/25">—</span>);
        const r = slot.state.result;
        const v = m.value(r);
        const win = wins(m.key, slot.card.id);
        return valueCell(
          slot,
          `${m.key}-${i}`,
          <>
            <p className={`text-[17px] tabular-nums leading-[1.3] ${win ? "font-medium text-white" : "text-white/75"}`}>{m.format(v, r)}</p>
            {m.bar && (
              <div className="mt-2 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-white/[0.08]" aria-hidden="true">
                <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: m.icon ? ICON_COLOR[m.icon] : "#fff", opacity: 0.85 }} />
              </div>
            )}
            {m.sub && <p className="mt-1.5 text-[13px] tabular-nums text-white/50">{m.sub(v, r)}</p>}
          </>,
        );
      })}
    </div>
  );

  return (
    <div className="overflow-x-auto xl:overflow-visible">
      <div
        role="table"
        aria-label="Site comparison"
        className="grid min-w-[984px] grid-cols-[150px_repeat(4,minmax(208px,1fr))] xl:min-w-0 xl:grid-cols-[220px_repeat(4,minmax(0,1fr))]"
      >
        {/* names, actions and the verdict: pinned under the navigation while scrolling (wide screens) */}
        <div role="row" className="contents">
          <div className="sticky left-0 z-20 border-b border-white/[0.12] bg-[#020202] xl:top-[60px]" />
          {slots.map((slot, i) => (
            <div
              key={slot?.card.id ?? `empty-${i}`}
              role="columnheader"
              {...selectable(slot)}
              className={`relative z-10 min-w-0 border-b border-t-2 border-b-white/[0.12] px-4 pb-3 pt-3 xl:sticky xl:top-[60px] ${
                isSelected(slot) ? "border-t-[#ff3b12] bg-[#0b0b0b]" : "border-t-white/[0.08] bg-[#020202]"
              } ${slot ? "cursor-pointer" : ""}`}
            >
              {slot ? (
                <ColumnHead slot={slot} {...props} />
              ) : i === cards.length ? (
                <button
                  type="button"
                  onClick={props.onAdd}
                  className="flex h-full min-h-[64px] w-full items-center justify-center rounded-[10px] border border-dashed border-white/[0.18] text-[15px] text-white/60 transition hover:border-white/40 hover:text-white"
                >
                  + Add a site
                </button>
              ) : (
                <p className="pt-2 text-[14px] text-white/25">Empty</p>
              )}
            </div>
          ))}
        </div>

        {/* only when a column has its own dates: edit them here */}
        {anyOwnDates && (
          <div role="row" className="contents">
            {labelCell(<span className="text-[14px] text-white/55">Dates</span>, "dates-label")}
            {slots.map((slot, i) =>
              valueCell(
                slot,
                `dates-${i}`,
                slot?.card.ownDates ? (
                  <div className="flex flex-wrap items-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <label className="block min-w-[150px] flex-1 text-[12.5px] text-white/50">
                      Start (UTC)
                      <input
                        type="datetime-local"
                        value={slot.card.startUtc}
                        min="2023-01-01T00:00"
                        max="2032-12-31T23:00"
                        onChange={(e) => e.target.value && props.onUpdate(slot.card.id, { startUtc: e.target.value })}
                        className="mt-1 h-11 w-full min-w-0 rounded-md border border-white/[0.12] bg-white/[0.03] px-2 text-[14px] tabular-nums text-white outline-none [color-scheme:dark] focus:border-white/35"
                      />
                    </label>
                    <DaysInput value={slot.card.missionDays} onCommit={(missionDays) => props.onUpdate(slot.card.id, { missionDays })} />
                  </div>
                ) : slot ? (
                  <p className="pt-1 text-[13.5px] text-white/40">Shared mission</p>
                ) : null,
              ),
            )}
          </div>
        )}

        {/* the answers that matter most */}
        {METRICS.filter((m) => m.tier === "headline").map(metricRow)}

        {/* a glance at the whole mission */}
        <div role="row" className="contents">
          {labelCell(
            <>
              <span className="min-w-0">Over the mission</span>
              <Help text="Each strip runs from the start of the mission to the end. Yellow: the Sun is up. Blue: Earth is in view." />
            </>,
            "strip-label",
          )}
          {slots.map((slot, i) =>
            valueCell(slot, `strip-${i}`, slot?.state.status === "ready" ? <MissionStrip series={slot.state.result.series} /> : null),
          )}
        </div>

        {/* everything else, on request */}
        <div role="row" className="contents">
          <div role="cell" className="col-span-5 border-b border-white/[0.07] py-1">
            <button
              type="button"
              aria-expanded={more}
              onClick={() => setMore((v) => !v)}
              className="sticky left-0 py-3 text-[14.5px] text-white/65 transition hover:text-white"
            >
              {more ? "Fewer numbers ▴" : "More numbers ▾"}
            </button>
          </div>
        </div>
        {more && (
          <>
            {METRICS.filter((m) => m.tier === "more").map(metricRow)}
            {(["sun", "earth"] as const).map((body) => (
              <div key={body} role="row" className="contents">
                {labelCell(
                  <>
                    <span className="min-w-0">{body === "sun" ? "Next sunrise or sunset" : "Next Earthrise or Earthset"}</span>
                    <Help text="Counted from the start of the mission. Near the pole it is a time window, because a small error in hill height moves the time a lot." />
                  </>,
                  `${body}-label`,
                )}
                {slots.map((slot, i) =>
                  valueCell(
                    slot,
                    `${body}-${i}`,
                    slot?.state.status === "ready" ? <p className="text-[14.5px] leading-[1.5] text-white/80">{nextText(slot.state.result.look[body])}</p> : null,
                  ),
                )}
              </div>
            ))}
            <div role="row" className="contents">
              {labelCell(
                <>
                  <span className="min-w-0">Hills around the site</span>
                  <Help text="LOLA terrain: real NASA height data. Smooth Moon: no hill data, so hills are ignored. Approximate: built from coarser terrain." />
                </>,
                "horizon-label",
              )}
              {slots.map((slot, i) =>
                valueCell(
                  slot,
                  `horizon-${i}`,
                  slot?.state.status === "ready" ? (
                    <p className="text-[13.5px] leading-[1.55] text-white/55">
                      <span className="text-white/80">{slot.state.result.horizonKind}</span>
                      <br />
                      {Math.abs(slot.state.result.lat).toFixed(2)}° {slot.state.result.lat < 0 ? "S" : "N"},{" "}
                      {(((slot.state.result.lon % 360) + 360) % 360).toFixed(2)}° E
                    </p>
                  ) : null,
                ),
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** The top of a column: the site (a dropdown styled as a heading), a menu of actions, and the verdict. */
function ColumnHead(props: Props & { slot: NonNullable<Slot> }) {
  const { slot, viability, onUpdate, onPickCustom } = props;
  const { card, state } = slot;
  const siteValue = card.site.kind === "preset" ? card.site.siteId : CUSTOM_VALUE;

  return (
    <div>
      <div className="flex items-start gap-1">
        <div className="relative min-w-0 flex-1">
          <select
            aria-label="Site"
            value={siteValue}
            onChange={(e) => {
              if (e.target.value === CUSTOM_VALUE) onPickCustom(card.id);
              else onUpdate(card.id, { site: { kind: "preset", siteId: e.target.value } });
            }}
            className="w-full cursor-pointer appearance-none truncate rounded-md bg-transparent py-1 pr-7 text-[18px] font-medium text-white outline-none [color-scheme:dark] hover:bg-white/[0.05] focus-visible:bg-white/[0.06]"
          >
            {SITES.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#0a0a0a] text-[15px]">{s.name}</option>
            ))}
            <option value={CUSTOM_VALUE} className="bg-[#0a0a0a] text-[15px]">
              {card.site.kind === "custom" ? card.site.label : "Pick a point on the Moon…"}
            </option>
          </select>
          <span aria-hidden="true" className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[12px] text-white/50">▼</span>
        </div>
        <ColumnMenu {...props} />
      </div>
      {card.ownDates && <p className="mt-0.5 truncate text-[13px] text-white/50">Own dates: {startText(card.startUtc)} · {card.missionDays} d</p>}
      {state.status === "ready" ? (
        (() => {
          const v = verdict(state.result, viability);
          return (
            <p
              className={`mt-1.5 text-[13.5px] leading-[1.45] ${v.ok ? "text-emerald-300/90" : "text-amber-300/90"}`}
              title={`Your rule: Sun up at least ${viability.min_sunlight_percent}% and no dark spell longer than ${viability.max_night_hours} h. You can change it under "If the launch slips".`}
            >
              {v.ok ? "✓ " : "✗ "}
              {v.text}
            </p>
          );
        })()
      ) : state.status === "error" ? (
        <p className="mt-1.5 border-l-2 border-[#ff3b12]/70 pl-2 text-[13px] leading-[1.45] text-white/65">{state.message}</p>
      ) : (
        <p className="mt-1.5 text-[13px] text-white/40">{state.message ?? "Working out the sky…"}</p>
      )}
    </div>
  );
}

/** "⋯": the column's actions, out of the way until needed. */
function ColumnMenu({ slot, cards, onSelect, onDuplicate, onOwnDates, onPickCustom, onRemove }: Props & { slot: NonNullable<Slot> }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const { card } = slot;
  const count = cards.length;

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item = (label: string, action: () => void, disabled = false) => (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        setOpen(false);
        action();
      }}
      className="block w-full px-4 py-2.5 text-left text-[14px] text-white/80 hover:bg-white/[0.06] hover:text-white disabled:text-white/25 disabled:hover:bg-transparent"
    >
      {label}
    </button>
  );

  return (
    <div ref={box} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={`Actions for this column`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-md text-[18px] leading-none text-white/55 hover:bg-white/[0.06] hover:text-white"
      >
        ⋯
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-10 z-30 w-[230px] overflow-hidden rounded-[10px] border border-white/[0.12] bg-[#0d0d0d] py-1 shadow-2xl">
          {item("Show details below", () => onSelect(card.id))}
          {item("Duplicate", () => onDuplicate(card.id), count >= MAX_CARDS)}
          {item(card.ownDates ? "Use the shared dates" : "Give it its own dates", () => onOwnDates(card.id, !card.ownDates))}
          {card.site.kind === "custom" && item("Move the point", () => onPickCustom(card.id))}
          {item("Remove", () => onRemove(card.id), count <= 1)}
        </div>
      )}
    </div>
  );
}

/** A small "?" that explains a row in one sentence, on hover or keyboard focus. */
function Help({ text }: { text: string }) {
  return (
    <span className="group relative mt-[1px] inline-flex shrink-0">
      <button
        type="button"
        aria-label={text}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white/25 text-[11px] leading-none text-white/55 hover:border-white/60 hover:text-white focus-visible:border-white/60"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-6 z-40 hidden w-[240px] rounded-md border border-white/[0.12] bg-[#111] px-3 py-2 text-[13px] leading-[1.5] text-white/80 shadow-xl group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}

/** A thin picture of the whole mission: when the Sun is up (yellow) and when Earth is in view (blue). */
function MissionStrip({ series }: { series: Series }) {
  const rows = useMemo(() => timelineRows(series, Math.max(1, Math.ceil(series.tdb.length / 160))), [series]);
  if (rows.length === 0) return null;
  const n = rows.length;
  return (
    <svg viewBox={`0 0 ${n} 13`} preserveAspectRatio="none" className="block h-[26px] w-full max-w-[260px]" aria-hidden="true">
      <rect x="0" y="0" width={n} height="5" fill="#fff" fillOpacity="0.06" />
      <rect x="0" y="8" width={n} height="5" fill="#fff" fillOpacity="0.06" />
      {rows.map((r, i) =>
        r.sun_fraction > 0 ? <rect key={`s${i}`} x={i} y="0" width="1.05" height="5" fill={SUN} fillOpacity={0.3 + 0.7 * r.sun_fraction} /> : null,
      )}
      {rows.map((r, i) => (r.is_earth_visible ? <rect key={`e${i}`} x={i} y="8" width="1.05" height="5" fill={EARTH} fillOpacity="0.85" /> : null))}
    </svg>
  );
}
