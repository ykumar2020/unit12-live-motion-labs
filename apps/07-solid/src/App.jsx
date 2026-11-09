import { createSignal, onMount, onCleanup, createEffect, Show } from 'solid-js';
import { watchLive, recentYears } from './shared/sources.js';
import { draw } from './shared/lab.js';
export default function App() {
  let chart, stop;
  const [packet, setPacket] = createSignal(null),
    [years, setYears] = createSignal(25),
    [metric, setMetric] = createSignal('growth'),
    [error, setError] = createSignal('');
  function load(key) {
    stop?.();
    setError('');
    setPacket(null);
    chart?.replaceChildren();
    stop = watchLive(
      key,
      (p) => {
        setError('');
        setPacket(p);
      },
      (e) => {
        setPacket(null);
        setError(e.message);
      },
    );
  }
  onMount(() => load('growth'));
  onCleanup(() => stop?.());
  createEffect(() => {
    const p = packet(),
      n = years(),
      key = metric();
    if (chart && p)
      draw(chart, p, recentYears(p, n), {
        kind: 'line',
        title: key === 'growth' ? 'U.S. real GDP growth' : 'U.S. population by year',
        filters: { lastYears: n, metric: key },
        limitation:
          'Negative growth is retained. An annual rate is not a dollar GDP ' +
          'level; causes require outside evidence. Switch to population and ' +
          'compare Vue with the same years/data mode.',
      });
  });
  return (
    <>
      <div class="controls">
        <label>
          Years displayed: {years()}
          <input
            id="primary-control"
            aria-label="Years displayed"
            type="range"
            min="10"
            max="60"
            step="5"
            value={years()}
            onInput={(e) => setYears(Number(e.currentTarget.value))}
          />
        </label>
        <label>
          Metric{' '}
          <select
            aria-label="Metric"
            value={metric()}
            onChange={(e) => {
              setMetric(e.currentTarget.value);
              load(e.currentTarget.value);
            }}
          >
            <option value="growth">Real GDP growth (annual %)</option>
          </select>
        </label>
      </div>
      <Show
        when={error()}
        fallback={
          <p role="status">
            {packet()
              ? `${Math.min(years(), packet().rows.length)} reporting years per available country`
              : 'Loading World Bank data…'}
          </p>
        }
      >
        <p role="alert" class="error">
          {error()}
        </p>
      </Show>
      <section class="chart-card">
        <h2>Economic phase space</h2>
        <div ref={chart} class="chart" />
      </section>
    </>
  );
}
