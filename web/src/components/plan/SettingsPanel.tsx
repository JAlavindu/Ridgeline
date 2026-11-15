import type { ReactNode } from "react";
import { PANEL_LABEL, type PanelType } from "../../engine";
import { MASK_MAST_M, useSettings } from "../../lib/settings";

const PANELS: PanelType[] = ["tracking", "vertical-rotating", "vertical-fixed", "flat"];

/** Mission rules shared by every page. Compact controls in the site-panel style. */
export default function SettingsPanel() {
  const { settings, update, reset } = useSettings();

  return (
    <section aria-labelledby="settings-heading" className="text-white">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="settings-heading" className="text-[15px] font-medium">Mission rules</h2>
        <button type="button" onClick={reset} className="text-[11px] text-white/45 underline-offset-4 hover:text-white hover:underline">
          Reset
        </button>
      </div>

      <Control
        label="Earth counts as visible when"
        help="Centre is the default. Any part matches NASA PGDA 69. Near the pole the choice moves Earthset by hours (test S2)."
      >
        <Choice
          value={settings.earthRule}
          options={[
            ["centre", "Its centre is up"],
            ["any_part", "Any part is up"],
          ]}
          onChange={(v) => update({ earthRule: v })}
        />
      </Control>

      <Control label={`Extra Earth margin: ${settings.earthMarginDeg.toFixed(1)}°`} help="Earth must clear the hills by this much as well.">
        <Range min={0} max={1} step={0.1} value={settings.earthMarginDeg} onChange={(v) => update({ earthMarginDeg: v })} label="Extra Earth margin" />
      </Control>

      <Control label="Solar panel" help="Changes the panel power only. Sunlight at the site (W/m²) does not depend on it.">
        <Choice value={settings.panel} options={PANELS.map((p) => [p, PANEL_LABEL[p]] as [PanelType, string])} onChange={(v) => update({ panel: v })} />
      </Control>

      {settings.panel === "vertical-fixed" && (
        <Control label={`Panel faces ${settings.panelFacingAzDeg}° (0 = north, 90 = east)`}>
          <Range min={0} max={359} step={1} value={settings.panelFacingAzDeg} onChange={(v) => update({ panelFacingAzDeg: v })} label="Panel direction" />
        </Control>
      )}

      <Control label={`Panel efficiency: ${settings.efficiencyPct.toFixed(1)}% (example)`} help="An example value (a space-grade cell at beginning of life), not a real lander's panel.">
        <Range min={10} max={40} step={0.1} value={settings.efficiencyPct} onChange={(v) => update({ efficiencyPct: v })} label="Panel efficiency" />
      </Control>

      <Control
        label={`Mast height: ${settings.mastM.toFixed(1)} m`}
        help={`Used for smooth-Moon and custom sites. Sites with NASA terrain stay at ${MASK_MAST_M} m, the height their horizons were built for.`}
      >
        <Range min={0} max={10} step={0.5} value={settings.mastM} onChange={(v) => update({ mastM: v })} label="Mast height" />
      </Control>
    </section>
  );
}

function Control({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/[0.08] py-4 first-of-type:mt-3">
      <p className="text-[12px] text-white/70">{label}</p>
      <div className="mt-2">{children}</div>
      {help && <p className="mt-2 text-[11px] leading-[1.6] text-white/40">{help}</p>}
    </div>
  );
}

function Choice<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2" role="group">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`border-b-2 pb-1 text-[12px] transition ${
            value === v ? "border-[#ff3b12] text-white" : "border-transparent text-white/45 hover:text-white/75"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function Range({ min, max, step, value, onChange, label }: { min: number; max: number; step: number; value: number; onChange: (v: number) => void; label: string }) {
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-white"
    />
  );
}
