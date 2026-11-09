# Live Motion Labs ? CPS 5745 Unit 12

Eight custom animated D3 experiences using real, freshly fetched public data. No runtime snapshots, generated measurements or saved-response fallback. All API endpoints are free and require no key for these noncommercial classroom labs. Open-Meteo free service is noncommercial and quota-limited: https://open-meteo.com/en/pricing .

## Share with students

Live site: https://unit12-live-motion-labs.vercel.app

Public source: https://github.com/ykumar2020/unit12-live-motion-labs

The public site hosts all eight labs under /labs/1/ through /labs/8/. Live data is fetched by an allowlisted Vercel server function with no API keys and no response fallback.

## Run

Install Node.js 22.12+. In this folder:

```powershell
npm.cmd ci
npm.cmd run dev
```

Use `npm` on macOS/Linux. Open http://127.0.0.1:5280 for live previews and the complete beginner assignment. All eight apps run concurrently, ports 5281?5288. Stop with Ctrl+C or `npm.cmd run stop`.

1. Vanilla: rotating USGS earthquake globe, depth needles and time filtering.
2. Vue: World Bank population choreography, bubble physics and linked history.
3. React: Open-Meteo forecast wind particles, thermal ribbons and brush.
4. Preact: Open Library author?work force constellation.
5. Lit: NASA EONET radial memberships and event orbits.
6. Svelte: USGS morphing particle sculpture, bins and depth cloud.
7. Solid: World Bank GDP growth phase-space trajectories.
8. Qwik: five-city isometric precipitation and interactive rain particles.

World Bank values are historical annual data. Open-Meteo values are forecasts. Motion describes encodings, not additional observations. Failure clears scenes and displays the upstream error.

## Verify and edit

`npm.cmd run audit:live` checks all seven upstream endpoints and writes metadata/checksums only. `npm.cmd test` validates normalization. `npm.cmd run build` builds all eight. With servers running, `npx playwright install chromium` then `npm.cmd run test:browser` verifies actual data, checksum exports, motion, controls, mobile layouts and no-fallback failures.

Edit root `shared/` then `npm.cmd run sync`. Native framework entry files are in `apps/*/src`. The complete HTML assignment includes copyable actual source for every custom scene. Current evidence is in `evidence/v2`; `evidence/verification.json` summarizes the latest run.

## Deploy updates

Run `npm run build:public` to assemble all lab routes, then `vercel deploy --prod` in the linked checkout. Initial publication was deployed through Vercel CLI. Automatic GitHub-triggered deployment is not enabled: Vercel could not connect its GitHub integration to this repository. This does not affect the public site or cloning/running the source.

The hosted smoke check in `evidence/public-deployment-check.json` confirms all eight public lab pages loaded fresh provider data with no JavaScript page errors.
