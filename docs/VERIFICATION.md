# Unit 12 - actual verification and corrections

Verified November 9, 2026. All eight labs are running concurrently at their assigned ports. Launcher: http://127.0.0.1:5280.

## Checks completed

- 8/8 production builds passed concurrently (not a frontend performance benchmark).
- A fresh extraction of the distributable ZIP completed npm ci and rebuilt all eight projects successfully.
- 17/17 Node data/normalization/statistics tests passed.
- 38/38 Chromium browser tests passed using four workers; 0 failures.
- Initial and changed-control screenshots exist for each app. Baseline browser tests captured no page errors or console errors.
- All seven raw provider files have matching SHA-256 hashes; original browser downloads were checked against those hashes.
- HTTP failure and successful-empty-data cases were tested separately in every framework.
- The USGS histograms match between Vanilla and Svelte; the same World Bank population rows match between Vue and Solid.
- AI context, exact min/max/mean, real downloads, keyboard focus, mobile width, ordinary nonnegative rainfall axes, launcher links, PDF availability and the fixed API allowlist were checked.
- The stop script closed this workspace's nine ports; restarting restored all eight apps and the launcher without terminating unrelated applications.
- PDF: 25 pages, no empty pages and no text outside checked horizontal margins. Pages were rendered and visually inspected.

## Observed saved-data interactions

These are instructor verification fixtures, not student submissions or AI-generated claims. Live results can differ.

| Lab | Port | Records before → after | Changed selection | Actual live test mode |
| --- | --- | --- | --- | --- |
| 1 Vanilla JavaScript | 5281 | 193 → 20 | {"minimumMagnitude":5,"view":"scatter"} | live |
| 2 Vue | 5282 | 25 → 10 | {"lastYears":10,"metric":"population"} | live |
| 3 React | 5283 | 48 → 24 | {"first24Hours":true} | live |
| 4 Preact | 5284 | 12 → 5 | {"topN":5,"query":"data visualization"} | live |
| 5 Lit | 5285 | 4 → 1 | {"categories":1,"countMode":"all"} | live |
| 6 Svelte | 5286 | 193 → 20 | {"minimumMagnitude":5} | live |
| 7 Solid | 5287 | 25 → 10 | {"lastYears":10,"metric":"growth"} | live |
| 8 Qwik | 5288 | 48 → 12 | {"firstHours":12} | live |

Full metadata, timestamps, units, values and exact versions are in evidence/verification.json and data/snapshots/*.meta.json. The saved forecast is archived model output, not observed weather. NASA's 500-event cap and Open Library's returned sample are disclosed in the UI.

## Corrected runnable-code problems

The PDF's escaped URL substitutions/trailing backticks are replaced by valid centralized URLs. Incomplete CSS is replaced by a complete stylesheet. Svelte uses real bind:value and bind:this directives, a mount entry and abort cleanup. Lit has complete registration/reactive fields/lifecycle; the shared styles use deliberate light DOM. Qwik has its real entry/loader and compatible Vite 7.3.7 despite the current scaffold's Vite 8 choice. Every app has an interaction, source/error/empty states, exact units and reproducible metadata. Line charts preserve time gaps; zero rainfall uses a meaningful 0-based mm axis. The original PDF is unchanged.

## Precise limits

- Public provider responses change; archived source times are displayed explicitly.
- AI feature generates context-aware prompts and local numerical checks, not a claimed live LLM reply.
- Sampled Chromium/keyboard/mobile checks do not certify every browser or accessibility technology.
- Qwik uses the standalone CSR scaffold, not SSR/resumability benchmarking.
- npm audit reports three low-severity development dependency-chain entries; no fix is advertised for the pinned compatible plugin chain. No security certification is claimed.

Tests used real downloaded snapshots and live provider calls. Controlled malformed/empty/error inputs are clearly named test fixtures. No secret key or paid model request was used. New snapshots can be captured deliberately with npm run capture:data; keep old evidence first. No production deployment or gradebook integration was requested.
