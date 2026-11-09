import './shared/style.css';
import { watchLive } from './shared/sources.js';
import { installShell, draw, setStatus } from './shared/lab.js';
installShell(1);
document.querySelector('#app').innerHTML =
  `<div class="controls"><label>Minimum magnitude <output id="threshold-value">3.0</output><input id="primary-control" aria-label="Minimum magnitude" type="range" min="2.5" max="9" step=".5" value="3"></label><label>Experience <select id="view"><option value="globe">Depth globe</option><option value="bins">Particle sculpture</option></select></label></div><p id="status" role="status">Fetching USGS…</p><section class="chart-card"><div id="chart" class="chart"></div></section>`;
const slider = document.querySelector('#primary-control'),
  view = document.querySelector('#view'),
  message = document.querySelector('#status');
let packet;
function redraw() {
  if (!packet) return;
  const min = +slider.value,
    shown = packet.rows.filter((d) => d.x >= min);
  document.querySelector('#threshold-value').textContent = min.toFixed(1);
  setStatus(
    message,
    `${shown.length} of ${packet.rows.length} live-requested earthquakes selected`,
  );
  draw(document.querySelector('#chart'), packet, shown, {
    bins: view.value === 'bins',
    unit: 'magnitude',
    filters: { minimumMagnitude: min },
    limitation:
      'Earthquake timestamps describe actual past events. Moving locator rings are not measured seismic waves.',
  });
}
const stop = watchLive(
  'earthquakes',
  (p) => {
    packet = p;
    redraw();
  },
  (e) => {
    packet = null;
    setStatus(message, e.message, true);
  },
);
slider.addEventListener('input', redraw);
view.addEventListener('change', redraw);
window.addEventListener('pagehide', stop, { once: true });
