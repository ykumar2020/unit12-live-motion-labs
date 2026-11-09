import { useEffect, useRef, useState } from 'preact/hooks';
import { watchLive } from './shared/sources.js';
import { draw } from './shared/lab.js';
export function App() {
  const chart = useRef(null),
    [packet, setPacket] = useState(null),
    [error, setError] = useState(''),
    [limit, setLimit] = useState(32);
  useEffect(
    () =>
      watchLive(
        'books',
        (p) => {
          setError('');
          setPacket(p);
        },
        (e) => {
          setPacket(null);
          setError(e.message);
        },
      ),
    [],
  );
  useEffect(() => {
    if (chart.current && packet)
      draw(chart.current, packet, packet.rows.slice(0, limit), {
        kind: 'bar',
        title: 'Most editions among returned search results',
        filters: { topN: limit, query: 'data visualization' },
        limitation:
          'This is at most 70 Open Library search results, not a census of all ' +
          'books or all editions worldwide. Only the returned sample is ranked; ' +
          'edition counts are catalog metadata.',
      });
  }, [packet, limit]);
  return (
    <>
      <div class="controls">
        <label>
          Books displayed: {limit}
          <input
            id="primary-control"
            aria-label="Books displayed"
            type="range"
            min="5"
            max="60"
            step="1"
            value={limit}
            onInput={(e) => setLimit(Number(e.currentTarget.value))}
          />
        </label>
      </div>
      {error ? (
        <p role="alert" class="error">
          {error}
        </p>
      ) : (
        <p role="status">
          {packet
            ? `${Math.min(limit, packet.rows.length)} of ${packet.rows.length} valid search results selected`
            : 'Loading Open Library results…'}
        </p>
      )}
      <section class="chart-card">
        <h2>Author–work force constellation</h2>
        <div ref={chart} class="chart" />
      </section>
    </>
  );
}
