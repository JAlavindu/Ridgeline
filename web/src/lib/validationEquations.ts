/**
 * The equations behind each validation test, shown on the /validation page.
 * Formula IDs (F1–F18, E1–E7) match docs/Ridgeline_formula_guide.pdf.
 *
 * Writing subscripts: "x_{SUN}" is drawn as x with a small "SUN" below the line.
 */
export interface Equation {
  /** What the equation is for, in a few words. */
  label: string;
  /** The equation itself. A "\n" starts a new line. */
  expr: string;
  /** Optional plain-words note under the equation. */
  note?: string;
}

/** How two answers are compared. Used by most tests, so it is shown once at the top of the page. */
export const MEASURE: Equation[] = [
  {
    label: "A direction as an arrow",
    expr: "u = ( cos e · sin Az,  cos e · cos Az,  sin e )",
    note: "Azimuth Az and elevation e become an arrow of length 1 pointing east, north and up.",
  },
  {
    label: "The gap between two answers",
    expr: "gap = atan2( |u_{1} × u_{2}|,  u_{1} · u_{2} )",
    note: "The true angle on the sky between the two arrows. atan2 stays accurate for tiny gaps, where acos would round them to zero.",
  },
  {
    label: "An azimuth gap on its own",
    expr: "Δaz = | ((Az_{1} − Az_{2} + 540) mod 360) − 180 | × cos e",
    note: "Wraps the difference so 359° and 1° count as 2° apart. × cos e turns it into a real distance on the sky.",
  },
];

/** Equations for each test, by test ID. */
export const EQUATIONS: Record<string, Equation[]> = {
  V1: [
    {
      label: "Where the site is (F1) and which way to look (F3)",
      expr: "r_{site} = (R + H + h_{mast}) · ( cos φ cos λ,  cos φ sin λ,  sin φ )\nv = r_{body} − r_{site}",
      note: "R = 1737.4 km. The body position comes from SPICE (DE440, frame MOON_ME, light-time CN+S).",
    },
    {
      label: "Azimuth and elevation (F4)",
      expr: "Az = atan2( east · v,  north · v )\nEl = asin( up · v / |v| )",
    },
    {
      label: "Pass rule",
      expr: "worst = max gap over 6 sites × 2 bodies × 518 times = 6,216 comparisons\npass if worst ≤ 0.002°",
      note: "Each gap is measured with the arrow method at the top of this page.",
    },
  ],
  V2: [
    {
      label: "Blending between hourly records (E1)",
      expr: "d = (1 − f) · d_{0} + f · d_{1}      d̂ = d / |d|",
      note: "f is how far through the hour we are. Arrows are blended, never angles, because azimuth jumps from 359° to 0°.",
    },
    {
      label: "The browser's clock (F17)",
      expr: "t_{TDB} = unix_ms / 1000 − 946,727,930.816 s",
    },
    {
      label: "Pass rule",
      expr: "every case:  |gap| ≤ 0.001°  for Sun and Earth azimuth, elevation, separation and disc size\n|t_{TDB, browser} − t_{TDB, SPICE}| ≤ 0.002 s",
    },
  ],
  V3: [
    {
      label: "How fast the Sun crosses the lunar sky",
      expr: "rate = 360° / (29.53 days × 1,440 min/day) ≈ 0.00847° per minute",
    },
    {
      label: "The error from treating UTC as TDB",
      expr: "TDB − UTC = 69.184 s = 1.153 min\nerror ≈ 0.00847 × 1.153 ≈ 0.0098°",
      note: "The test must find a gap this big. If it did not, V1 would be too blunt to catch a time bug.",
    },
  ],
  V4: [
    {
      label: "Sun height at the south pole (F6)",
      expr: "e = −b",
      note: "b is the sub-solar latitude: where on the Moon the Sun is straight overhead.",
    },
    {
      label: "Expected highest Sun",
      expr: "max |e| ≈ 1.543° (tilt of the Moon's equator) + physical libration ≈ 1.59°",
    },
  ],
  V5: [
    {
      label: "Length of a day at the equator (F18)",
      expr: "day ≈ 29.53 days / 2 ≈ 14.77 days",
    },
    {
      label: "Extra minutes at each end",
      expr: "dip = acos( R / (R + h_{mast}) ) = 0.087°  (2 m mast)\nextra = (ρ_{SUN} + dip) / ω = (0.267° + 0.087°) / 0.508° per h ≈ 0.7 h",
      note: "Any part of the Sun counts as up, and the mast sees slightly over the curve, so each day is about 1.4 h longer.",
    },
  ],
  V6: [
    {
      label: "Distance from the point under Earth",
      expr: "angle = acos( cos φ · cos λ ) = acos( cos 45.44° · cos 177.60° ) ≈ 134.5°",
      note: "Earth hangs roughly above (0°, 0°).",
    },
    {
      label: "Earth's expected height",
      expr: "e_{EARTH} ≈ 90° − 134.5° ≈ −44.5°   (rocked about ±7° by libration)",
    },
  ],
  V7: [
    {
      label: "Disc sizes (F15) and the angle between them (E2)",
      expr: "ρ = asin( R_{body} / D )\nδ = atan2( |a × b|,  a · b )",
    },
    {
      label: "Earth covering the Sun (F12)",
      expr:
        "Sun fully hidden if  δ ≤ ρ_{E} − ρ_{S}\n" +
        "overlap = ρ_{S}² acos((δ² + ρ_{S}² − ρ_{E}²) / 2δρ_{S}) + ρ_{E}² acos((δ² + ρ_{E}² − ρ_{S}²) / 2δρ_{E})\n" +
        "          − ½ √((−δ+ρ_{S}+ρ_{E})(δ+ρ_{S}−ρ_{E})(δ−ρ_{S}+ρ_{E})(δ+ρ_{S}+ρ_{E}))\n" +
        "f_{E} = 1 − overlap / (π ρ_{S}²)",
      note: "Pass if f_E = 0 for every minute of totality.",
    },
  ],
  V8: [
    {
      label: "Sun and Earth position (F1–F4)",
      expr: "v = r_{body} − r_{site}\nAz = atan2( east · v,  north · v )      El = asin( up · v / |v| )",
      note: "Computed in Python with SPICE, because the app's data starts in 2023.",
    },
  ],
  H1: [
    {
      label: "Sun height by hand (F5)",
      expr: "sin e = sin φ sin b + cos φ cos b cos( λ − l )",
      note: "b, l: latitude and longitude of the point where the Sun is straight overhead.",
    },
    {
      label: "When the Sun has fully set",
      expr: "e = −( dip + ρ_{SUN} )      dip = acos( R / (R + h_{mast}) ) = 0.0869°",
    },
  ],
  V9: [
    {
      label: "Our averages",
      expr: "Sun % = 100 × mean( f )\nEarth % = 100 × share of hours with  e_{E} + ρ_{E} − h(Az_{E}) > 0",
      note: "f is the visible part of the Sun's disc (F11, F12). Earth uses the any-part rule, as PGDA 69 does.",
    },
    {
      label: "Pass rule",
      expr: "gap = ours − PGDA 69   (in points)\npass if  median |gap| ≤ 5  and  90th percentile |gap| ≤ 10",
    },
  ],
  V10: [
    {
      label: "Visible part of the Sun behind a ridge (F11)",
      expr: "d = ( e − h(Az) ) / √(1 + m²)\nhidden = ρ² acos(d/ρ) − d √(ρ² − d²)\nf = 1 − hidden / (π ρ²)",
      note: "h(Az): horizon height under the Sun. m: how steeply the skyline slopes sideways.",
    },
    {
      label: "Average sunlight",
      expr: "average = 100 × (1/N) Σ f_{i}   (every hour, 2023–2032)",
    },
  ],
  V11: [
    {
      label: "When the terrain hides the Sun (E5)",
      expr: "Sun margin = d + ρ_{SUN}      Sun lost when the margin changes sign from + to −",
      note: "Found by stepping hourly, then halving the hour until under 30 s.",
    },
  ],
  V12: [
    {
      label: "Sunset and sunrise (E5)",
      expr: "Sun margin = d + ρ_{SUN}      sunset: + to −      sunrise: − to +",
    },
    {
      label: "Pass rule",
      expr: "| sunrise − 22 Sep 2023 | ≤ 3 days",
    },
  ],
  V13: [
    {
      label: "Sunlight with hills and Earth together (F12)",
      expr: "f = min( f_{terrain}, f_{E} )",
      note: "Pass if f falls below 0.05 on 14 March 2025.",
    },
  ],
  V14: [
    {
      label: "How far apart two horizons are",
      expr: "diff(Az) = h_{custom}(Az) − h_{precise}(Az)\nRMS = √( mean diff² )      p95 = 95th percentile of |diff|",
    },
  ],
  V15: [
    {
      label: "The Moon's height above a DSN dish",
      expr: "v = r_{MOON} − r_{station}      El = asin( up · v / |v| )\ngap = | El_{ours} − El_{Horizons} |   pass if ≤ 0.05°",
    },
  ],
  S1: [
    {
      label: "Countdown uncertainty (F8)",
      expr: "Δt ≈ Δh / | de/dt |      de/dt ≈ ω cos φ   (near the horizon)",
      note: "Δh = 0.1° of horizon error. Example at 89°S: 0.1° / 0.0081° per h ≈ 12.3 h.",
    },
    {
      label: "Pass rule",
      expr: "| measured shift − predicted shift | / predicted shift ≤ 10%",
    },
  ],
  S2: [
    {
      label: "Two rules for Earth in view (F16)",
      expr: "centre rule:    e_{E} − h(Az_{E}) > 0\nany-part rule:  e_{E} + ρ_{E} − h(Az_{E}) > 0",
      note: "Any-part can never be lower than centre, so that is the sanity check.",
    },
  ],
  S3: [
    {
      label: "Average with two sample steps",
      expr: "mean = (1/N) Σ f_{i}\npass if | mean_{60 min} − mean_{10 min} | < 0.2 points",
    },
  ],
};
