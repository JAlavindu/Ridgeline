import { useState } from "react";

import { MAX_MISSION_DAYS } from "../../lib/plan";

const MIN_DAYS = 1;
const MAX_DAYS = MAX_MISSION_DAYS;

/**
 * Mission length. While typing, the box keeps whatever is typed (even empty), so "14" can be typed after
 * clearing "1". A whole number from 1 to 365 is saved at once; anything else is put back on leaving the box.
 */
export default function DaysInput({ value, onCommit, label = "Days" }: { value: number; onCommit: (days: number) => void; label?: string }) {
  const [draft, setDraft] = useState<{ value: number; text: string }>({ value, text: String(value) });
  // A new value from outside (Duplicate, a saved plan) replaces the draft.
  const text = draft.value === value ? draft.text : String(value);
  const valid = (t: string) => /^\d+$/.test(t) && Number(t) >= MIN_DAYS && Number(t) <= MAX_DAYS;

  return (
    <label className="block w-[84px] shrink-0 text-[12.5px] text-white/50">
      {label}
      <input
        type="text"
        inputMode="numeric"
        aria-label={`Mission length in days, 1 to ${MAX_DAYS}`}
        value={text}
        onChange={(e) => {
          const t = e.target.value.replace(/\D/g, "").slice(0, 3);
          if (valid(t)) {
            setDraft({ value: Number(t), text: t });
            onCommit(Number(t));
          } else {
            setDraft({ value, text: t });
          }
        }}
        onBlur={() => setDraft({ value, text: String(value) })}
        aria-invalid={!valid(text)}
        title={valid(text) ? undefined : `A whole number from ${MIN_DAYS} to ${MAX_DAYS}`}
        className={`mt-1 h-11 w-full min-w-0 rounded-md border bg-white/[0.03] px-3 text-[15px] tabular-nums text-white outline-none ${
          valid(text) ? "border-white/[0.12] focus:border-white/35" : "border-[#ff3b12]/80 focus:border-[#ff3b12]"
        }`}
      />
    </label>
  );
}
