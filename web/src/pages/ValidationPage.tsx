import { useEffect, useState } from "react";

import {
  GROUPS,
  STATUS_LABEL,
  formatResult,
  statusOf,
  type Status,
  type ValidationReport,
  type ValidationTest,
} from "../lib/validation";
import { EQUATIONS, MEASURE, type Equation } from "../lib/validationEquations";

const DATA_URL = import.meta.env.BASE_URL + "data/validation.json";
const REPO_URL = "https://github.com/JAlavindu/Ridgeline";

const DOT: Record<Status, string> = {
  pass: "bg-emerald-400",
  "failed-as-designed": "bg-sky-400",
  fail: "bg-red-500",
  pending: "bg-[#f2c14e]",
  info: "bg-white/40",
};

export default function ValidationPage() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`validation.json: ${res.status}`);
        return res.json() as Promise<ValidationReport>;
      })
      .then((data) => active && setReport(data))
      .catch((err: unknown) => active && setError(err instanceof Error ? err.message : String(err)));
    return () => {
      active = false;
    };
  }, []);

  const byId = new Map((report?.tests ?? []).map((t) => [t.id, t]));
  const claim = (id: string) => byId.get(id);
  const v1 = claim("V1");
  const v2 = claim("V2");
  const v10 = claim("V10");

  return (
    <main className="min-h-screen bg-[#020202] px-6 pb-24 pt-28 text-white sm:px-10">
      <div className="mx-auto max-w-[900px]">
        <p className="text-[12px] text-white/45">Validation</p>
        <h1 className="mt-1.5 font-['Michroma'] text-[24px] uppercase leading-tight sm:text-[30px]">
          Can you trust these numbers?
        </h1>
        <p className="mt-4 max-w-[62ch] text-[14px] leading-[1.75] text-white/65">
          Every test is listed with its pass rule, its result and the reason for any gap. Nothing is hidden: a test that
          fails is shown as a failure, and one that is built to fail is marked as such.
        </p>

        {error && <p className="mt-8 border-l-2 border-[#ff3b12]/70 pl-3 text-[13px] text-white/60">Could not load the results: {error}</p>}
        {!report && !error && <p className="mt-8 text-[13px] text-white/40">Loading results…</p>}

        {report && (
          <>
            <dl className="mt-8 grid border-t border-white/[0.08] sm:grid-cols-3">
              <Claim
                label="Sun and Earth positions vs JPL Horizons"
                value={v1?.result != null ? `within ${v1.result}°` : "not available"}
              />
              <Claim
                label="Browser engine vs Python (1,000 cases)"
                value={v2?.result != null ? `within ${v2.result}°` : "not available"}
              />
              <Claim
                label="Connecting Ridge average sunlight"
                value={v10?.result != null ? `${v10.result}% (published ~88%)` : "not available"}
              />
            </dl>

            <section className="mt-12" aria-label="How we compare two answers">
              <h2 className="text-[15px] font-medium text-white">How we compare two answers</h2>
              <p className="mt-1 text-[12px] text-white/45">
                Most tests compare a sky position with a reference. Open any test below to see the equations it uses.
              </p>
              <Equations items={MEASURE} />
            </section>

            {GROUPS.map((group) => {
              const tests = group.ids.map((id) => byId.get(id)).filter((t): t is ValidationTest => t !== undefined);
              if (tests.length === 0) return null;
              return (
                <section key={group.title} className="mt-12" aria-label={group.title}>
                  <h2 className="text-[15px] font-medium text-white">{group.title}</h2>
                  {group.note && <p className="mt-1 text-[12px] text-white/45">{group.note}</p>}
                  <div className="mt-3 border-t border-white/[0.08]">
                    {tests.map((t) => (
                      <Row key={t.id} test={t} />
                    ))}
                  </div>
                </section>
              );
            })}

            <section id="sources" className="mt-16 border-t border-white/[0.08] pt-8">
              <h2 className="text-[15px] font-medium text-white">Data and credits</h2>
              <p className="mt-2 max-w-[62ch] text-[13px] leading-[1.75] text-white/60">
                Sun and Earth positions: NASA JPL DE440 through NAIF SPICE, checked against NASA JPL Horizons. Terrain:
                NASA LRO LOLA polar elevation maps. Average sunlight reference: NASA PGDA product 69. The full list, with
                licences, is in REFERENCES.md.
              </p>
              <ul className="mt-3 space-y-1.5 text-[13px] text-white/60">
                <li><a className="underline hover:text-white" href="https://naif.jpl.nasa.gov/naif/" target="_blank" rel="noreferrer">NASA NAIF SPICE</a></li>
                <li><a className="underline hover:text-white" href="https://ssd.jpl.nasa.gov/horizons/" target="_blank" rel="noreferrer">NASA JPL Horizons</a></li>
                <li><a className="underline hover:text-white" href="https://pgda.gsfc.nasa.gov/products/69" target="_blank" rel="noreferrer">NASA PGDA 69</a></li>
                <li><a className="underline hover:text-white" href="https://lola.gsfc.nasa.gov/" target="_blank" rel="noreferrer">LRO LOLA</a></li>
              </ul>
            </section>

            <section className="mt-12 text-[12px] leading-[1.7] text-white/40">
              <p>
                Results generated {report.generated_utc.replace("T", " ").replace("Z", " UTC")} by {report.generator}.
              </p>
              <p className="mt-1">
                To reproduce: <span className="tabular-nums text-white/60">python pipeline/validate.py</span> and{" "}
                <span className="tabular-nums text-white/60">npm test</span> in web/. Code and method:{" "}
                <a className="underline hover:text-white/70" href={REPO_URL} target="_blank" rel="noreferrer">
                  {REPO_URL.replace("https://", "")}
                </a>
                .
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Claim({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/[0.08] py-4 pr-4">
      <dt className="text-[11px] text-white/45">{label}</dt>
      <dd className="mt-1 text-[17px] tabular-nums text-white">{value}</dd>
    </div>
  );
}

function Row({ test }: { test: ValidationTest }) {
  const status = statusOf(test);
  return (
    <details className="group border-b border-white/[0.08]">
      <summary className="flex cursor-pointer list-none items-start gap-3 py-4 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${DOT[status]}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] text-white">
            <span className="mr-2 tabular-nums text-white/40">{test.id}</span>
            {test.name}
          </p>
          <p className="mt-1 text-[12px] text-white/45">Pass rule: {test.tolerance}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[13px] tabular-nums text-white">{formatResult(test)}</p>
          <p className="mt-1 text-[11px] text-white/50">{STATUS_LABEL[status]}</p>
        </div>
      </summary>
      <div className="pb-5 pl-5 pr-2 text-[12px] leading-[1.75] text-white/60">
        <p>{test.what}</p>
        <p className="mt-2">{test.explanation}</p>
        {EQUATIONS[test.id] && <Equations items={EQUATIONS[test.id]} />}
      </div>
    </details>
  );
}

/** A list of equations, each with a label, the equation and an optional note. */
function Equations({ items }: { items: Equation[] }) {
  return (
    <div className="mt-4 space-y-3">
      {items.map((eq) => (
        <div key={eq.label}>
          <p className="text-[11px] uppercase tracking-wide text-white/40">{eq.label}</p>
          <p className="mt-1 overflow-x-auto whitespace-pre border-l-2 border-white/15 bg-white/[0.03] px-3 py-2 font-['Cambria_Math',Cambria,'Times_New_Roman',serif] text-[14px] leading-[1.7] text-white/85">
            {withSubscripts(eq.expr)}
          </p>
          {eq.note && <p className="mt-1 text-[12px] text-white/50">{eq.note}</p>}
        </div>
      ))}
    </div>
  );
}

/** Turns "r_{site}" into r with "site" drawn as a subscript. */
function withSubscripts(text: string) {
  return text.split(/_\{([^}]*)\}/).map((part, i) =>
    i % 2 === 1 ? <sub key={i} className="text-[0.7em]">{part}</sub> : part,
  );
}
