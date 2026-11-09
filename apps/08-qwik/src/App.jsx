import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { watchLive, firstHours } from './shared/sources.js';
import { draw } from './shared/lab.js';
export const App = component$(() => {
  const chart = useSignal(),
    packet = useSignal(null),
    hours = useSignal(48),
    error = useSignal(''),
    timing = useSignal('Waiting for component visibility');
  useVisibleTask$(({ cleanup }) => {
    const stop = watchLive(
      'precipitation',
      (p) => {
        packet.value = p;
        error.value = '';
        timing.value = 'Fresh response ' + p.meta.fetchedAt;
      },
      (e) => {
        packet.value = null;
        error.value = e.message;
      },
    );
    cleanup(stop);
  });
  useVisibleTask$(({ track }) => {
    const p = track(() => packet.value),
      n = track(() => hours.value);
    if (chart.value && p)
      draw(chart.value, p, firstHours(p, n), {
        kind: 'line',
        title: 'Five-city rainfall observatory',
        filters: { firstHours: n },
        limitation:
          'Precipitation is a forecast amount per provider interval, not a ' +
          'probability of rain. This standalone classroom app uses client-side ' +
          'rendering; it is not a benchmark or demonstration of full ' +
          'server-rendered resumability.',
      });
  });
  return (
    <>
      <div class="controls">
        <label>
          Forecast hours: {hours.value}
          <input
            id="primary-control"
            aria-label="Forecast hours"
            type="range"
            min="6"
            max="48"
            step="6"
            value={hours.value}
            onInput$={(e) => (hours.value = Number(e.target.value))}
          />
        </label>
      </div>
      {error.value ? (
        <p role="alert" class="error">
          {error.value}
        </p>
      ) : (
        <p role="status">
          {packet.value
            ? `${Math.min(hours.value, packet.value.rows.length)} hourly records selected`
            : 'Loading forecast after visibility…'}
        </p>
      )}
      <p class="small" id="timing">
        {timing.value}
      </p>
      <section class="chart-card">
        <h2>Rainfall observatory (mm)</h2>
        <div ref={chart} class="chart" />
      </section>
    </>
  );
});
