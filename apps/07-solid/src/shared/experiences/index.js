import { globe } from './globe.js';
import { population } from './population.js';
import { weather } from './weather.js';
import { books } from './books.js';
import { events } from './events.js';
import { swarm } from './swarm.js';
import { economy } from './economy.js';
import { rain } from './rain.js';
const scenes = new WeakMap();
export function stopExperience(node) {
  scenes.get(node)?.dispose();
  scenes.delete(node);
}
export function renderExperience(node, packet, rows, options) {
  stopExperience(node);
  if (packet.invalid || packet.meta.mode !== 'live')
    throw Error('Only a valid live response may be visualized');
  if (!rows.length) {
    node.textContent =
      'No live observations match this filter. Adjust the selection; no data is invented.';
    return;
  }
  const id = Number(document.body.dataset.lab),
    engines = [globe, population, weather, books, events, swarm, economy, rain];
  const engine = id === 1 && options.bins ? swarm : engines[id - 1];
  const scene = engine(node, packet, rows);
  scenes.set(node, scene);
  window.__activeScene = scene;
  return scene;
}
