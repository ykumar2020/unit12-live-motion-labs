import { d3, createScene, label, hover, number } from './core.js';
export function globe(node, packet, rows) {
  const scene = createScene(
    node,
    'Seismic globe',
    'ORTHOGRAPHIC PROJECTION · DRAG TO ORBIT · CLICK AN EARTHQUAKE',
  );
  const { svg } = scene;
  const center = [430, 295],
    radius = 248,
    projection = d3.geoOrthographic().translate(center).scale(radius).rotate([65, -18]),
    path = d3.geoPath(projection),
    grid = d3.geoGraticule10();
  svg
    .append('circle')
    .attr('cx', center[0])
    .attr('cy', center[1])
    .attr('r', radius + 14)
    .attr('fill', '#f0f5fc');
  const sphere = svg
    .append('path')
    .datum({ type: 'Sphere' })
    .attr('fill', 'url(#ocean)')
    .attr('stroke', '#8bafcf');
  const graticule = svg
    .append('path')
    .datum(grid)
    .attr('fill', 'none')
    .attr('stroke', '#7fadd0')
    .attr('stroke-opacity', 0.42);
  const equator = svg
    .append('path')
    .datum({
      type: 'LineString',
      coordinates: d3.range(-180, 181, 2).map((lon) => [lon, 0]),
    })
    .attr('fill', 'none')
    .attr('stroke', '#4087bd')
    .attr('stroke-width', 1.6);
  const sorted = [...rows].sort((a, b) => a.time - b.time);
  let progress = 1,
    auto = true,
    rotation = [65, -18],
    style = 'Depth needles';
  const spokes = svg
    .append('g')
    .selectAll('line')
    .data(rows)
    .join('line')
    .attr('stroke', '#e68853')
    .attr('stroke-opacity', 0.55);
  const marks = svg
    .append('g')
    .selectAll('circle')
    .data(rows)
    .join('circle')
    .attr('class', 'quake-node')
    .attr('fill', (d) => d3.interpolateTurbo(Math.max(0, Math.min(1, d.y / 650))))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1);
  const pulses = svg
    .append('g')
    .selectAll('circle')
    .data(sorted.slice(-35))
    .join('circle')
    .attr('fill', 'none')
    .attr('stroke', '#df793d')
    .attr('pointer-events', 'none');
  hover(
    marks,
    scene,
    (d) => d.label,
    (d) =>
      `M ${d.x} · ${number(d.y)} km deep · ${new Date(d.time).toLocaleString()} · drag globe to expose the other hemisphere`,
  );
  svg.call(
    d3
      .drag()
      .filter((e) => !e.target.classList.contains('quake-node'))
      .on('start', () => (auto = false))
      .on('drag', (e) => {
        rotation[0] += e.dx * 0.3;
        rotation[1] = Math.max(-80, Math.min(80, rotation[1] - e.dy * 0.3));
        render(0);
      }),
  );
  scene.controls('Geometry', ['Depth needles', 'Surface pulses'], (name) => {
    style = name;
    render(0);
  });
  scene.controls('Spin', ['Auto orbit', 'Hold globe'], (_, i) => (auto = i === 0));
  const timeline = scene.timeline('Event time window', 0, 100, 100, (v) => {
    progress = v / 100;
    render(0);
  });
  label(svg, 760, 75, 'THE EARTH, IN MOTION', 12, '#ce774a');
  label(svg, 760, 113, String(rows.length), 52, '#223f63');
  label(svg, 760, 142, 'earthquakes in the current filter');
  label(svg, 760, 191, 'Color = hypocenter depth');
  for (let i = 0; i < 70; i++)
    svg
      .append('rect')
      .attr('x', 760 + i * 3)
      .attr('y', 210)
      .attr('width', 3.3)
      .attr('height', 9)
      .attr('fill', d3.interpolateTurbo(i / 70));
  label(svg, 760, 244, '0 km                         650+ km', 12);
  label(svg, 760, 297, 'Ring motion is a visual locator.', 13);
  label(svg, 760, 320, 'It is not a wave-speed simulation.', 13);
  label(svg, 760, 375, 'Drag to rotate the sphere.', 15, '#223f63');
  label(svg, 760, 402, 'Hover to inspect a real event.');
  label(svg, 760, 429, 'Scrub to reveal the weekly sequence.');
  label(svg, 760, 478, 'USGS magnitude ≥ 2.5 feed', 12);
  scene.inspect(
    'A live USGS response, not invented events',
    'The sphere rotates continuously; depths, coordinates and timestamps come from the current network response.',
  );
  function render(t) {
    projection.rotate(rotation);
    sphere.attr('d', path);
    graticule.attr('d', path);
    equator.attr('d', path);
    const inv = projection.invert(center),
      cut =
        sorted[0]?.time +
        progress * ((sorted.at(-1)?.time || 0) - (sorted[0]?.time || 0));
    const visible = (d) =>
      d3.geoDistance([d.lon, d.lat], inv) < Math.PI / 2 && d.time <= cut;
    marks
      .attr('display', (d) => (visible(d) ? null : 'none'))
      .attr('cx', (d) => projection([d.lon, d.lat])[0])
      .attr('cy', (d) => projection([d.lon, d.lat])[1])
      .attr('r', (d) => Math.max(2.8, (d.x - 1) * 1.5));
    spokes
      .attr('display', (d) => (visible(d) && style === 'Depth needles' ? null : 'none'))
      .attr('x1', (d) => projection([d.lon, d.lat])[0])
      .attr('y1', (d) => projection([d.lon, d.lat])[1])
      .attr(
        'x2',
        (d) =>
          center[0] +
          (projection([d.lon, d.lat])[0] - center[0]) * (1 - Math.max(0, d.y) / 6371),
      )
      .attr(
        'y2',
        (d) =>
          center[1] +
          (projection([d.lon, d.lat])[1] - center[1]) * (1 - Math.max(0, d.y) / 6371),
      );
    pulses
      .attr('display', (d) => (visible(d) ? null : 'none'))
      .attr('cx', (d) => projection([d.lon, d.lat])[0])
      .attr('cy', (d) => projection([d.lon, d.lat])[1])
      .attr('r', (d, i) => 4 + ((t * 0.5 + i * 0.17) % 1) * 24)
      .attr('opacity', (d, i) => 1 - ((t * 0.5 + i * 0.17) % 1));
    scene.probe.visible = rows.filter(visible).length;
    scene.probe.rotation = rotation.slice();
  }
  scene.frame((dt, t) => {
    if (auto) rotation[0] += dt * 5;
    render(t);
  });
  return scene;
}
