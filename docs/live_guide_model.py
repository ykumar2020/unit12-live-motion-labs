blocks=[]
def h(s): blocks.append(('h',s))
def p(s): blocks.append(('p',s))
def ul(*s): blocks.append(('ul',list(s)))
def code(s): blocks.append(('code',s))
h('CPS 5745 Unit 12: Live Motion Labs')
p('Version 2 | November 9, 2026. Eight custom D3 experiences, native UI frameworks and free public APIs. This replaces the basic-chart edition. The supplied original assignment is unchanged.')
h('1. Begin with Node.js')
p('Install Node.js 22.12 or newer. Node runs JavaScript outside the browser. npm installs libraries; package-lock.json records dependency versions. Open a terminal in the extracted unit12-real-data-labs root, where package.json lives. Do not double-click index.html: these apps need their API server.')
code('node --version\nnpm.cmd --version\nnpm.cmd ci\nnpm.cmd run dev')
p('On macOS/Linux use npm instead of npm.cmd. Keep the terminal running and open http://127.0.0.1:5280. Eight servers run concurrently at ports 5281-5288. Stop with Ctrl+C or npm.cmd run stop. Windows launch/stop shortcuts are included. If a port is occupied, stop the conflicting process.')
h('2. Honest live data, free APIs')
p('Every load and refresh fetches the external provider. There is no saved-response fallback or local response cache. Weather and earthquakes refresh every two minutes while visible; other sources every five minutes. Fetch fresh data requests immediately. Providers can serve unchanged observations: fresh retrieval does not mean newly measured data.')
p('USGS provides reported earthquakes; World Bank historical annual statistics; Open Library catalog metadata; NASA EONET curated natural events; Open-Meteo model forecasts. Annual playback is not a real-time population counter. Forecasts are not station observations. Animation changes layouts, never scientific values.')
p('No key or paid subscription is required for these noncommercial classroom labs. Open-Meteo free access is noncommercial and quota-limited: https://open-meteo.com/en/pricing . Open Library requests low-volume access: https://openlibrary.org/developers/api . Do not load-test public services. Hidden tabs do not poll.')
p('Inspect the data drawer for source URL, time, units, count and checksum. An explicit Download exports the response; it is never reused as fallback. Failure clears the scene and displays an error. EONET requests cap at 500 events and the radial scene displays up to 150; this is not a complete global hazard census.')
h('3. JavaScript and D3 foundations')
ul('const declares a binding; let allows reassignment. Objects group fields and arrays hold records.', 'map transforms records; filter selects records. Missing null is not zero.', 'async functions return promises; await waits without blocking the UI. try/catch exposes errors.', 'SVG has selectable shapes. Canvas paints pixels efficiently for particle systems. D3 binds record IDs to marks.', 'Scales map data units to coordinates. Forces calculate layouts, not new measurements. Projections map geographic coordinates.', 'Stop timers and remove listeners on unmount. Reduced-motion starts static; Play is an explicit override.')
code('const values = [0, null, 2.5];\nconst valid = values.filter(v => typeof v === "number" && Number.isFinite(v));\nconsole.log(valid); // [0, 2.5]')
h('4. Follow the code pipeline')
ul('scripts/providers.mjs: allowlisted URLs. scripts/vite-common.mjs: fresh requests through /api/data/:key.', 'shared/sources.js: validation, normalization, polling and abort cleanup.', 'shared/lab.js: UI/provenance. shared/experiences/index.js: scene selection. core.js: artboard, timer, controls and disposal.', 'apps/NN-framework/src: native state/lifecycle. Edit canonical root shared files, then npm run sync to copy into all eight apps.')
code('npm.cmd run sync\nnpm.cmd run audit:live\nnpm.cmd run build\nnpm.cmd test\nnpx playwright install chromium\nnpm.cmd run test:browser')
p('Start servers before browser tests. audit:live requests upstream data and saves metadata/checksums only. Browser tests cover requests, downloads, controls, mobile panning, reduced motion and controlled failures. Public API availability is not guaranteed.')
h('5. Interaction contract')
p('Inspect records, change geometry and scrub/select to complete exploration missions. These track interaction, not mastery. Pause freezes motion while controls still update. On phones use Explore canvas to pan the legible artboard. Accessible source tables remain below the scene.')
lessons=[
('Vanilla JavaScript','globe.js','USGS','Drag the globe, switch surface/depth needles and scrub time. Magnitude controls size; depth controls needles/color. Pulses are decorative, not measured seismic waves.','Compare similar-magnitude events at different depths. Explain projection occlusion.','DOM listeners, cleanup and geographic projection'),
('Vue','population.js','World Bank','Animate reported years, drag/pin country bubbles and compare history. Area encodes population. Missing annual values are not invented.','Compare two country trajectories using actual years and values.','refs, computed values, watchers and unmount cleanup'),
('React','weather.js','Open-Meteo','Brush forecast windows and scrub temperature, wind and humidity. Canvas particles illustrate wind, not geographic fluid simulation.','Report a warmer interval and its associated wind, including units.','useState, useMemo, useEffect and Canvas outside React renders'),
('Preact','books.js','Open Library','Drag/pin/zoom authors and works; switch layouts. Editions size works; links represent actual returned authors. Results are sampled.','Pin a work and identify its authors; distinguish layout from metadata.','hooks, forceLink identity and drag cleanup'),
('Lit','events.js','NASA EONET','Switch category petals/time orbits and isolate memberships. Membership counts can exceed distinct event counts.','Compare all-category and first-category counting; disclose event caps.','reactive properties, updated lifecycle and radial grouping'),
('Svelte','swarm.js','USGS','Morph real event particles between beeswarm, stacked bins and depth cloud. Brush real IDs and pin particles. Layout changes; magnitudes do not.','Select a subset and find it in another layout.','state, effects, onMount and separating physics/source fields'),
('Solid','economy.js','World Bank','Time travel through annual real GDP growth. Each point compares previous-year and current-year growth. Pin country traces.','Find a quadrant crossing and quote its years; explain why this is not prediction.','signals, effects, onCleanup and adjacent-year pairing'),
('Qwik','rain.js','Open-Meteo','Select cities, scrub forecast hours, orbit or find the wettest interval. Height scales linearly with mm; zero rain emits zero particles.','Compare dry/wet intervals and verify source values.','signals, visible tasks, multi-city arrays and Canvas cleanup')]
for i,(framework,engine,source,interaction,task,concept) in enumerate(lessons,1):
 h('6. Mini-lab '+str(i)+': '+framework)
 p('Open http://127.0.0.1:'+str(5280+i)+'. Source: '+source+'. Read shared/experiences/'+engine+' and the matching apps/ folder native entry.')
 p(interaction)
 p('Framework focus: '+concept+'.')
 ul('Run the lab, inspect provenance and match a raw record to a mark.', 'Find the source field driving a visual property. Explain the scale or projection.', 'Change one visual parameter without changing source measurements. Sync shared edits and rebuild.', 'Investigation: '+task, 'Submit a screenshot, source URL/time, edited diff and data-versus-animation explanation. Test phone layout and unavailable-source behavior.')
h('7. Diagnose failures')
ul('npm not recognized: install Node and reopen the terminal. Windows execution-policy issue: use npm.cmd.', 'HTTP 502: read the provider error, inspect Network and retry later. Never invent a replacement record.', 'Identical refresh: compare request times/checksums. Provider publication or caching can leave values unchanged.', 'Build fails after dependency edits: restore the lockfile, npm ci, sync, build. Keep compatible dependency pins.', 'Drag events update geometry, not network requests. Respect free API quotas.', 'Submit all eight apps with custom interactions, attribution, units, responsive controls and honest failure behavior.')
p('The HTML assignment includes complete copyable app and custom-scene source. Use Copy buttons or actual files instead of copying wrapped PDF code. Optional AI critique prompts require no paid API integration.')
