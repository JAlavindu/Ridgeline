# References

Every dataset, service, paper, library, font and media file Ridgeline uses, with its licence or terms. Items marked **TO CONFIRM** have not been checked by a person yet and must be filled in before submission (see `docs/submission_checklist.md`).

## NASA and other data

| Data | Used for | Link | Terms |
|---|---|---|---|
| NAIF SPICE generic kernels: `naif0012.tls`, `pck00011.tpc`, `de440s.bsp`, `moon_pa_de440_200625.bpc`, `moon_de440_250416.tf` | Sun and Earth positions, Moon orientation (including libration), leap seconds, Moon radii | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/ | NASA/JPL public data |
| NAIF extra kernels for DSN mode: `earthstns_itrf93_260814.bsp`, `earth_topo_260814.tf`, `earth_1962_260806_2126_combined.bpc` | Positions of the Goldstone, Madrid and Canberra stations and Earth's orientation | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/ | NASA/JPL public data |
| JPL Horizons API | Independent check of Sun, Earth and Moon directions (tests V1, V3, V15) | https://ssd.jpl.nasa.gov/api/horizons.api | NASA/JPL public service |
| LRO LOLA polar elevation maps (`LDEM_80S_20MPP_ADJ`, `LDEM_80S_80MPP_ADJ`, `LDEM_60S_240MPP_ADJ`) | Horizon masks and 3D terrain tiles for the five polar sites | https://pgda.gsfc.nasa.gov/products/90 (**product page TO CONFIRM by the terrain owner**) | NASA public data |
| NASA PGDA product 69, `AVGVISIB_85S_060M_201608.TIF` and `…_EARTH.TIF` | Average Sun and Earth visibility reference, neighbourhood crops (test V9, pending) | https://pgda.gsfc.nasa.gov/products/69 | NASA public data |
| LROC QuickMap | Cross-check of site heights (`docs/validation_quickmap.md`) | https://quickmap.lroc.asu.edu/ | NASA/ASU |
| NASA NSSDC Moon Fact Sheet | Moon diameter, gravity, density, equator tilt, distances | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html | NASA public data |
| DSN Telecommunications Link Design Handbook, 810-005, module 301, Rev. O | Station elevation limits 6°, 10.1°, 13.6° | https://deepspace.jpl.nasa.gov/dsndocs/810-005/ | NASA/JPL public document |

Not used, although the plan listed them: PGDA 78 (5 m site terrain) and the USGS 118 m global elevation map. Sites outside the polar maps use a smooth-Moon horizon.

## Papers

- Mazarico, E. et al. (2011). Illumination conditions of the lunar polar regions using LOLA topography. *Icarus* 211. (PGDA 69.)
- Gläser, P. et al. (2018). Illumination conditions at the lunar south pole using high resolution Digital Terrain Models from LOLA. (V10: about 88% at Connecting Ridge.) Journal and volume **TO CONFIRM**.
- Gläser, P. et al. (2014). Illumination conditions at the lunar poles. (Longest darkness 4.58 d at Connecting Ridge.) Journal and volume **TO CONFIRM**.
- Bryant, W. (2009). JPL IPN Progress Report 42-176. (Sun height near the pole.)
- Liu, J. et al. (2019). Chang'e-4 landing site. *Nature Communications*, https://www.nature.com/articles/s41467-019-12278-3.

The Gläser and Bryant entries are cited from the team plan and must be checked against the originals (**TO CONFIRM**).

## Site coordinates

One source per site, generated from `web/public/data/sites.json` (`coord_source`). The frame is "not stated" for most sources; see the `notes` field there.

| Site | Source |
|---|---|
| Apollo 11, 12, 14, 15, 16 | https://www.lroc.asu.edu/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf |
| Apollo 17 | https://www.lroc.asu.edu/images/938 |
| Chang'e-4 | https://www.nature.com/articles/s41467-019-12278-3 |
| SLIM | https://www.lroc.asu.edu/images/1358 |
| IM-1 | https://www.nasa.gov/?p=620655 |
| IM-2 | https://en.wikipedia.org/wiki/Mons_Mouton (a primary NASA or LROC source is still wanted) |
| Blue Ghost M1 | https://www.physics.umd.edu/nglr |
| Connecting Ridge | https://elib.dlr.de/94242 |
| Shackleton rim, Site 004 | https://doi.org/10.3847/PSJ/aca590 |
| Malapert Massif | https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2024JE008905 |
| Chandrayaan-3 (ISRO coordinates) | https://en.wikipedia.org/wiki/Statio_Shiv_Shakti (confirm in the ISRO brochure) |
| Chandrayaan-3 (LROC coordinates) | https://www.lroc.asu.edu/images/1314 |

## Mission facts used in the replays

The landing and shutdown dates in `web/public/data/replays.json` come from the team plan and are marked "not yet checked against a primary source" in the app. **TO CONFIRM** each against NASA, Intuitive Machines or ISRO before the video.

## Software

Licences below were read from the installed packages on 2026-11-15.

**Web app (npm)**

| Package | Version | Licence |
|---|---|---|
| react, react-dom | 19.3.1 | MIT |
| react-router-dom | 7.18.5 | MIT |
| three | 0.187.0 | MIT |
| @react-three/fiber | 9.8.2 | MIT |
| @react-three/drei | 10.7.9 | MIT |
| tailwindcss, @tailwindcss/vite | 4.3.5 | MIT |
| motion | 14.13.0 | MIT |
| lenis | 1.3.27 | MIT |
| lucide-react | 1.73.0 | ISC |
| gsap | 3.15.1 | GSAP "Standard no-charge licence", https://gsap.com/standard-license (**TO CONFIRM** that our use is allowed) |
| vite, @vitejs/plugin-react, vitest | 8.3.8 / 6.3.0 / 5.1.0 | MIT |
| typescript | 6.0.3 | Apache-2.0 |
| eslint, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @eslint/js, globals, @types/* | see `web/package.json` | MIT |

**Science pipeline (Python)**

| Package | Version | Licence |
|---|---|---|
| spiceypy | 8.3.0 | MIT |
| numpy | 2.5.4 | BSD-3-Clause and others (see the package) |
| scipy | 1.18.1 | BSD |
| requests | 2.34.2 | Apache-2.0 |
| pytest | 9.2.0 | MIT |
| rasterio | 1.5.2 | BSD-3-Clause |
| pyproj | 3.8.0 | MIT |
| matplotlib | 3.11.2 | Matplotlib (PSF-style) licence |
| plotly | 7.1.0 | MIT |

## Fonts

Michroma and Space Grotesk, loaded from Google Fonts. Google Fonts hosts them under open font licences; **TO CONFIRM** the exact licence of each family on https://fonts.google.com before submission.

## Images and 3D model

None of these have a recorded source. Each needs an owner to fill in **where it came from, its licence, and whether it was made with AI**. Any AI-made image or video needs a visible watermark, and no NASA logo may appear in AI-made content.

| File | Used in | Source | Licence | AI-generated? | Owner |
|---|---|---|---|---|---|
| `web/public/images/home-hero.avif` | Home | TO CONFIRM | TO CONFIRM | TO CONFIRM | TO CONFIRM |
| `web/public/images/footer.png` | Footer | TO CONFIRM | TO CONFIRM | TO CONFIRM | TO CONFIRM |
| `web/public/images/team.webp` | Team page (shows people: no one under 18) | TO CONFIRM | TO CONFIRM | TO CONFIRM | TO CONFIRM |
| `web/public/images/1.avif` | TO CONFIRM | TO CONFIRM | TO CONFIRM | TO CONFIRM | TO CONFIRM |
| `web/public/images/images.jpeg` | TO CONFIRM | TO CONFIRM | TO CONFIRM | TO CONFIRM | TO CONFIRM |
| `web/public/images/photo-1505506874110-6a7a69069a08.avif` | TO CONFIRM (file name looks like an Unsplash photo id) | TO CONFIRM | TO CONFIRM | TO CONFIRM | TO CONFIRM |
| `web/public/images/photo-1616712134411-6b6ae89bc3ba.avif` | TO CONFIRM (file name looks like an Unsplash photo id) | TO CONFIRM | TO CONFIRM | TO CONFIRM | TO CONFIRM |
| `web/public/model/moon.glb` | 3D Moon | TO CONFIRM | TO CONFIRM | TO CONFIRM | TO CONFIRM |
| `web/src/assets/hero.png` | (not referenced by a page) | TO CONFIRM | TO CONFIRM | TO CONFIRM | TO CONFIRM |
| `web/public/data/tiles/*_albedo.png`, `*_normal.png`, `lunar_micro_bump.png` | 3D terrain textures | Generated by the terrain owner; **TO CONFIRM** how | TO CONFIRM | TO CONFIRM | terrain owner |
