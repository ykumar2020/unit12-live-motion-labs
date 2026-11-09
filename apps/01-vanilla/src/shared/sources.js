export const numeric = (v) =>
  (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '')) &&
  Number.isFinite(Number(v));
export function normalizeEarthquakes(raw) {
  if (!Array.isArray(raw?.features)) throw Error('USGS features[] missing');
  return raw.features
    .filter(
      (f) =>
        numeric(f.properties?.mag) && f.geometry?.coordinates?.length >= 3 && f.geometry.coordinates.slice(0, 3).every(numeric),
    )
    .map((f) => ({
      id: f.id,
      label: f.properties.place || 'Unknown location',
      x: +f.properties.mag,
      y: +f.geometry.coordinates[2],
      lon: +f.geometry.coordinates[0],
      lat: +f.geometry.coordinates[1],
      time: f.properties.time,
      url: f.properties.url,
    }));
}
export function normalizeWorldBank(raw) {
  if (!Array.isArray(raw?.[1])) throw Error('World Bank observations missing');
  if (+raw[0].pages > 1)
    throw Error('Response has more pages; refusing incomplete series');
  return raw[1]
    .filter((d) => numeric(d.value) && /^\d{4}$/.test(String(d.date)))
    .map((d) => ({
      label: `${d.country.value} · ${d.date}`,
      time: +d.date,
      value: +d.value,
      country: d.countryiso3code || d.country.id,
      countryName: d.country.value,
      year: +d.date,
    }))
    .sort((a, b) => a.time - b.time || a.country.localeCompare(b.country));
}
export function normalizeForecast(raw, variable) {
  const cities = ['New York', 'London', 'Mumbai', 'Singapore', 'São Paulo'];
  return (Array.isArray(raw) ? raw : [raw]).flatMap((r, cityIndex) => {
    const times = r.hourly?.time,
      values = r.hourly?.[variable];
    if (
      !Array.isArray(times) ||
      times.length !== values?.length ||
      r.hourly_units?.time !== 'unixtime'
    )
      throw Error('Invalid live hourly response');
    return times.flatMap((t, i) =>
      numeric(t) && numeric(values[i])
        ? [
            {
              label: new Date(t * 1000).toISOString(),
              time: t * 1000,
              value: +values[i],
              city: Array.isArray(raw) ? cities[cityIndex] : 'New York',
              lat: r.latitude,
              lon: r.longitude,
              wind: +r.hourly.wind_speed_10m?.[i],
              direction: +r.hourly.wind_direction_10m?.[i],
              humidity: +r.hourly.relative_humidity_2m?.[i],
            },
          ]
        : [],
    );
  });
}
export function normalizeBooks(raw) {
  if (!Array.isArray(raw.docs)) throw Error('Book results missing');
  return raw.docs
    .filter((d) => numeric(d.edition_count))
    .map((d) => ({
      id: d.key,
      label: d.title || 'Untitled',
      value: +d.edition_count,
      year: d.first_publish_year,
      authors: (d.author_key || []).map((id, i) => ({
        id,
        name: d.author_name?.[i] || id,
      })),
      subjects: (d.subject || []).slice(0, 5),
    }))
    .sort((a, b) => b.value - a.value);
}
export function normalizeEvents(raw, mode = 'all') {
  if (!Array.isArray(raw.events)) throw Error('NASA events missing');
  const counts = new Map();
  for (const event of raw.events) {
    let cats = [...new Set((event.categories || []).map((c) => c.title))];
    if (!cats.length) cats = ['Other'];
    if (mode === 'first') cats = cats.slice(0, 1);
    for (const label of cats) counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
export function magnitudeBins(rows) {
  const map = new Map();
  for (const r of rows) {
    const k = Math.floor(r.x * 2) / 2;
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map]
    .sort((a, b) => a[0] - b[0])
    .map(([k, value]) => ({
      label: `[${k.toFixed(1)}, ${(k + 0.5).toFixed(1)})`,
      value,
    }));
}
export function recentYears(packet, n) {
  const latest = Math.max(...packet.rows.map((d) => d.time));
  return packet.rows.filter((d) => d.time >= latest - n + 1);
}
export function firstHours(packet, hours) {
  const starts = new Map();
  for (const d of packet.rows)
    starts.set(d.city, Math.min(starts.get(d.city) ?? Infinity, d.time));
  return packet.rows.filter((d) => d.time < starts.get(d.city) + hours * 3600000);
}
export async function loadDataset(key, signal) {
  const response = await fetch(`/api/data/${key}`, { signal, cache: 'no-store' }),
    packet = await response.json();
  if (!response.ok) throw Error(packet.error || `HTTP ${response.status}`);
  if (packet.meta?.mode !== 'live') throw Error('Refusing non-live data');
  const raw = packet.raw;
  const rows =
    key === 'earthquakes'
      ? normalizeEarthquakes(raw)
      : ['population', 'growth'].includes(key)
        ? normalizeWorldBank(raw)
        : key === 'books'
          ? normalizeBooks(raw)
          : key === 'events'
            ? normalizeEvents(raw)
            : normalizeForecast(
                raw,
                key === 'temperature' ? 'temperature_2m' : 'precipitation',
              );
  return {
    ...packet,
    rows,
    meta: {
      ...packet.meta,
      validCount: rows.length,
      rawCount:
        key === 'earthquakes'
          ? raw.features.length
          : ['population', 'growth'].includes(key)
            ? raw[1].length
            : key === 'books'
              ? raw.docs.length
              : key === 'events'
                ? raw.events.length
                : rows.length,
      omitted: 0,
    },
  };
}
export function watchLive(key, onPacket, onError) {
  let controller,
    last,
    active = true,
    busy = false;
  async function refresh() {
    if (busy || document.hidden) return;
    busy = true;
    controller = new AbortController();
    document.dispatchEvent(
      new CustomEvent('lab:request', { detail: { key, state: 'fetching' } }),
    );
    try {
      const packet = await loadDataset(key, controller.signal);
      if (active) {
        last = packet;
        onPacket(packet);
        document.dispatchEvent(
          new CustomEvent('lab:request', {
            detail: { key, state: 'ready', at: packet.meta.fetchedAt },
          }),
        );
      }
    } catch (e) {
      if (active && e.name !== 'AbortError') {
        if (last) last.invalid = true;
        document.dispatchEvent(
          new CustomEvent('lab:request', {
            detail: { key, state: 'error', message: e.message },
          }),
        );
        onError(e);
      }
    } finally {
      busy = false;
    }
  }
  const interval = setInterval(
    refresh,
    ['population', 'growth', 'books', 'events'].includes(key) ? 300000 : 120000,
  );
  window.addEventListener('lab:refresh', refresh);
  refresh();
  return () => {
    active = false;
    controller?.abort();
    clearInterval(interval);
    window.removeEventListener('lab:refresh', refresh);
  };
}
