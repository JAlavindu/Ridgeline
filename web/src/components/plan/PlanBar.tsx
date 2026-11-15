import { useState } from "react";

import { PANEL_LABEL, type Viability } from "../../engine";
import type { Mission } from "../../lib/plan";
import { useSettings } from "../../lib/settings";
import DaysInput from "./DaysInput";
import SettingsPanel from "./SettingsPanel";

interface Props {
  mission: Mission;
  onMission: (patch: Partial<Mission>) => void;
  viability: Viability;
}

/**
 * The top of the Plan page: the one mission every site is compared on, then the rules that shape every number.
 * Both sit above the comparison because they change all of it.
 */
export default function PlanBar({ mission, onMission, viability }: Props) {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);

  const chips = [
    settings.earthRule === "centre" ? "Earth counts when its centre is up" : "Earth counts when any part is up",
    ...(settings.earthMarginDeg > 0 ? [`plus ${settings.earthMarginDeg.toFixed(1)}° margin`] : []),
    `Panel: ${PANEL_LABEL[settings.panel]}${settings.panel === "vertical-fixed" ? `, faces ${settings.panelFacingAzDeg}°` : ""}`,
    `${settings.efficiencyPct.toFixed(1)}% efficient (example)`,
    `Mast ${settings.mastM.toFixed(1)} m`,
  ];

  return (
    <section aria-label="Mission and rules" className="rounded-[14px] border border-white/[0.08] bg-[#0a0a0a]">
      {/* the shared mission */}
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3 px-5 pb-4 pt-4">
        <div className="mr-2">
          <h2 className="text-[16px] font-medium text-white">Your mission</h2>
          <p className="mt-0.5 text-[13px] text-white/50">Every site below is compared on these dates.</p>
        </div>
        <label className="block w-[230px] text-[12.5px] text-white/50">
          Lands on (UTC)
          <input
            type="datetime-local"
            value={mission.startUtc}
            min="2023-01-01T00:00"
            max="2032-12-31T23:00"
            onChange={(e) => e.target.value && onMission({ startUtc: e.target.value })}
            className="mt-1 h-11 w-full rounded-md border border-white/[0.12] bg-white/[0.03] px-3 text-[15px] tabular-nums text-white outline-none [color-scheme:dark] focus:border-white/35"
          />
        </label>
        <DaysInput label="Days" value={mission.missionDays} onCommit={(missionDays) => onMission({ missionDays })} />
        <p className="pb-3 text-[13.5px] text-white/55">
          Your rule: Sun up at least <span className="text-white/85">{viability.min_sunlight_percent}%</span>, no dark spell over{" "}
          <span className="text-white/85">{viability.max_night_hours} h</span>
          <span className="text-white/35"> · change it under “If the launch slips”</span>
        </p>
      </div>

      {/* the rules, at a glance */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/[0.08] px-5 py-3">
        <span className="mr-auto text-[13.5px] text-white/50 sm:mr-0">Mission rules</span>
        <ul className="order-last flex min-w-0 basis-full flex-wrap gap-2 sm:order-none sm:flex-1 sm:basis-auto">
          {chips.map((c) => (
            <li key={c} className="whitespace-nowrap rounded-full border border-white/[0.1] px-3 py-1 text-[13px] text-white/70">
              {c}
            </li>
          ))}
        </ul>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="rules-drawer"
          onClick={() => setOpen((v) => !v)}
          className="h-10 rounded-md border border-white/[0.16] px-4 text-[14px] text-white/80 transition hover:border-white/40 hover:text-white"
        >
          {open ? "Done" : "Edit rules"}
        </button>
      </div>
      {open && (
        <div id="rules-drawer" className="border-t border-white/[0.08] px-5 pb-3 pt-1">
          <SettingsPanel wide />
        </div>
      )}
    </section>
  );
}
