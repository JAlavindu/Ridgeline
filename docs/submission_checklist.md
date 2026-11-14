# Submission checklist (M1 confirms, M6 runs it)

From the plan, section 16. Deadline: submitted by 22:30 Sunday, hard limit 23:59. "Done" means I checked it in the repo or by request; "Needs a person" means it cannot be checked from the code.

| # | Item | Status | Owner | Note |
|---|---|---|---|---|
| 1 | Project title and one-line summary | Needs a person | M6 | README has a one-line question; confirm the title to submit ("Ridgeline — Lunar Landing Site Navigator") |
| 2 | Public demo link: video ≤ 30 s with English subtitles, or ≤ 7 slides | Needs a person | M6, M1 checks length | Going over the limit removes us from Global Judging. Video script is in the plan; fact-check every number against `/validation` |
| 3 | Public app link works on a phone, no login | **Done**: https://ridgeline-lavindu-pereras-projects.vercel.app/ opens without a login (checked 2026-11-15 after turning off Vercel Authentication); `/plan` and `/validation` load directly; checked on a phone by M5 | M5, M1 | Do not submit the `ridgeline-foip4hoqm-…` link: it is pinned to one deploy |
| 4 | Public GitHub repo link | **Done**: https://github.com/JAlavindu/Ridgeline is public (checked 2026-11-15) | M1 | Make sure `main` has the final work |
| 5 | Detailed description: problem, what it does, how it works, benefits, limits | Draft ready | M6 | Use the README sections "Why this is hard", "What the app does" (built vs not built), "How it works" and "Limits" |
| 6 | NASA data used, each linked: PGDA 90, 78, 69; USGS LOLA 118 m; NAIF kernels; JPL Horizons | **Needs a correction** | M1 | We use LOLA polar maps, PGDA 69, NAIF and Horizons. We did **not** use PGDA 78 or the USGS 118 m map. List only what we used (see `REFERENCES.md`); the product page for the LOLA polar maps still needs confirming by the terrain owner |
| 7 | Every other dataset and library, with its licence (`REFERENCES.md`) | Written; items to confirm | M1 | Open items: image sources, GSAP licence, font licences, mission-fact sources, paper details |
| 8 | AI-use disclosure; visible watermark on any AI-made image or video; no NASA logos in AI-made content | Disclosure written (README); image status **unknown** | M6 | Each image and `moon.glb` needs "AI-generated? yes/no" in `REFERENCES.md`. If yes: watermark |
| 9 | No names, voices or faces of anyone under 18 | Needs a person | M6 | Check `team.webp`, the Team page and the video |
| 10 | All six members confirmed at the same Local Event | Needs a person | M1 | |
| 11 | Submitted by 22:30; confirmation screenshot saved | Needs a person | M6, M1 | |

## Honesty checks before submitting (M1)

- [ ] Every number in the video and description is on `/validation` or in `docs/number_audit.md`.
- [ ] Nothing says Apollo, Chandrayaan-3, Chang'e-4, SLIM or Blue Ghost horizons use NASA terrain: they use a smooth Moon.
- [ ] V9 is described as pending (unless 0 m masks were built and the test now passes).
- [ ] No claim of mission-grade accuracy, single sunset times near the pole, or exact power in watts.
- [ ] Mission replay facts are checked against a primary source, or described as "from our plan".
- [ ] The neighbourhood map and CSV export are not shown or promised (not built), and custom coordinates are called approximate.
- [ ] The team name on the site footer ("NASA's Backup Plan", "LUNA") matches what is submitted; the app itself is called Ridgeline.
