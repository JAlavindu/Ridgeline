# Pitch pack (M1 leads, Sunday 10:00, 5 min demo + 5 min questions)

Numbers below are read from `web/public/data/validation.json` (generated 2026-11-15). Say them as written, and open `/validation` to show them. If you rerun validation, update this page.

## Flow

| Time | Show | Say (M1) |
|---|---|---|
| 0:00–0:45 | Home page, then Explore Moon | "If we land here on this date, when do we have sunlight and Earth in view, and how long until we lose each? At the pole the Sun skims the horizon, so a ridge a few hundred metres tall decides everything, and launches slip. Existing tools are accurate but built for experts." |
| 0:45–3:30 | M6 drives. Pick Connecting Ridge → Overview "Right now" → Sun & Earth tab: countdown **window**, 14-day summary → Terrain and Horizon tabs | "The Sun and Earth positions come from NASA JPL's ephemeris through SPICE. Near the pole one tiny hill error moves sunset by hours, so we show a time window, never one time." |
| | IM-1 → Mission replay | "Here is what the tool shows for a mission that flew. IM-1 stopped about 66 hours before the Sun left it, because it tipped over. A shutdown is not a sunset, and we show both." |
| | IM-2 → Mission replay | "The 14 March 2025 eclipse shows as a dip: Earth in front of the Sun." |
| | Sun & Earth tab → NASA DSN | "Optional DSN mode also needs a NASA antenna to see the Moon. Many commercial landers use other networks, so the default only needs Earth in view." |
| 3:30–4:30 | `/validation` | See next section |
| 4:30–5:00 | Close | "Fast, validated planning and teaching tool; not mission-grade, and we say so. Everything is open on GitHub." |

Do **not** show: scenario board, slip slider, window finder, custom coordinates, neighbourhood map. They are not built.

## Validation page: what to say

| Claim | Number | Source |
|---|---|---|
| Positions vs JPL Horizons | within **0.000027°** worst case, 6,216 comparisons | V1 |
| Browser engine = Python/SPICE | within **0.000125°**, 1,000 cases | V2 |
| The test can catch a time mistake | feeding UTC as TDB is off by **0.0098°**, and the test says so | V3 |
| Physics checks | Pole 1.59° (V4), equator 50.4% sunlit (V5), far side never sees Earth (V6), eclipse covers the Sun (V7), Apollo 11 Sun 10.7° high (V8) | V4–V8 |
| Hand check | sunset agrees to **5 seconds** | H1 |
| Sunlight against published research | Connecting Ridge **87.9%** vs about 88% | V10 |
| Countdown error | **0.1°** of horizon error moves sunset by **0.2 h** at the equator, **1.2 h** at 80°S, **2.4 h** at 85°S and **11.9 h** at 89°S | S1 |
| DSN | Moon height at Goldstone within **0.005°** of Horizons | V15 |

Say about the weak spots before they ask:
- "The comparison with NASA's average-sunlight maps (V9) is pending: those maps are at ground level and our horizons use a 2 m mast, so the comparison needs terrain rebuilt first."
- "Mission replays are plausibility checks, not proof."

## Likely questions

| Question | Answer |
|---|---|
| Where do positions come from? | NASA JPL DE440 and lunar orientation files through SPICE, the toolkit NASA missions use. Checked against JPL Horizons to 0.000027°. |
| How accurate is the countdown? | Positions are accurate to about 0.001°. The limit is the terrain: near the pole a 0.1° hill error is hours of sunset time (S1), so we show windows. |
| Do you handle libration? | Yes. It is in NASA's lunar orientation model. That is why Earth rises and sets near the poles. |
| Eclipses? | Earth in front of the Sun is modelled; the 14 March 2025 eclipse shows at the IM-2 site (V13). |
| Why does the Sun's size matter? | At the pole the Sun skims the hills; half the disc hidden is half the power, so we compute the visible fraction. |
| What does direct-to-Earth mean here? | The lander can see Earth above its local hills. Optional mode also checks that a NASA antenna sees the Moon. |
| Is this mission-grade? | No, and we say so. It is a fast, validated planning and teaching tool. |
| Why do Apollo and other sites have no hills? | Real terrain horizons exist for five polar sites (Connecting Ridge, IM-1, IM-2, Malapert, Shackleton Site 004). Other sites use a smooth Moon and the app says "smooth Moon". |
| Why is V12 judged at 3 days? | The first run gave 2.27 days against ISRO's 22 September date. We widened the plan's 1-day rule after seeing it and published that, with the numbers. |
| What did AI do? | Claude Code helped write code, tests and documentation. People ran every test and checked the science against NASA sources; the positions come from SPICE, not an AI model. |
| Why does the footer say a different team name? | Flag to M6 before the pitch: the app is Ridgeline; the footer shows "NASA's Backup Plan" and "LUNA". |
| DSN: does the 6° limit matter? | Rarely: three stations together see the Moon above 6° for 99.9% of the decade. The stricter 10.1° and 13.6° limits matter more. |
