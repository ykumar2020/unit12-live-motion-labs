import { useEffect, useMemo, useRef, useState } from 'react';
import { watchLive, firstHours } from './shared/sources.js';
import { draw } from './shared/lab.js';
export default function App() {
  const chart = useRef(null),
    [packet, setPacket] = useState(null),
    [error, setError] = useState(''),
    [firstDayOnly, setFirstDayOnly] = useState(false);
  useEffect(
    () =>
      watchLive(
        'temperature',
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
  const shown = useMemo(
    () => (packet ? (firstDayOnly ? firstHours(packet, 24) : packet.rows) : []),
    [packet, firstDayOnly],
  );
  useEffect(() => {
    if (chart.current && packet)
      draw(chart.current, packet, shown, {
        kind: 'line',
        title: 'NYC hourly air temperature',
        filters: { first24Hours: firstDayOnly },
        limitation:
          'A model forecast is not an observed measurement or a climate trend. ' +
          'Times are displayed in America/New_York; the line breaks over ' +
          'missing hours.',
      });
  }, [packet, shown, firstDayOnly]);
  return (
    <>
      <div className="controls">
        <label>
          <input
            id="primary-control"
            aria-label="First 24 forecast hours"
            type="checkbox"
            checked={firstDayOnly}
            onChange={(e) => setFirstDayOnly(e.target.checked)}
          />{' '}
          Show first 24 forecast hours only
        </label>
      </div>
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : (
        <p role="status">
          {packet ? `${shown.length} hourly records selected` : 'Loading forecast…'}
        </p>
      )}
      <section className="chart-card">
        <h2>Temperature forecast (°C)</h2>
        <div ref={chart} className="chart" />
      </section>
    </>
  );
}
