import { d3, createScene, label, hover, palette, number, axisGrid } from './core.js';
export function economy(node, packet, rows) {
  const scene = createScene(
    node,
    'Economic phase space',
    'SIX COUNTRY TRAJECTORIES · PREVIOUS YEAR × CURRENT YEAR · SCRUB TIME',
  );
  const { svg } = scene;
  const groups = [...d3.group(rows, (d) => d.country)].map(([id, s], i) => ({
    id,
    name: s[0].countryName,
    color: palette[i % 6],
    series: s.sort((a, b) => a.time - b.time),
  }));
  for (const g of groups)
    g.pairs = g.series.flatMap((d, i) =>
      i && d.time - g.series[i - 1].time === 1
        ? [{ year: d.time, x: g.series[i - 1].value, y: d.value }]
        : [],
    );
  const points = groups.flatMap((g) => g.pairs),
    extent = Math.max(5, ...points.flatMap((d) => [Math.abs(d.x), Math.abs(d.y)])),
    x = d3.scaleLinear().domain([-extent, extent]).nice().range([80, 1005]),
    y = d3.scaleLinear().domain([-extent, extent]).nice().range([510, 60]);
  axisGrid(
    svg,
    x,
    y,
    'PREVIOUS YEAR REAL GDP GROWTH (%)',
    'CURRENT YEAR REAL GDP GROWTH (%)',
  );
  svg
    .append('rect')
    .attr('x', x(0))
    .attr('y', 60)
    .attr('width', 1005 - x(0))
    .attr('height', y(0) - 60)
    .attr('fill', '#e7f4ec')
    .attr('opacity', 0.6);
  svg
    .append('rect')
    .attr('x', 80)
    .attr('y', y(0))
    .attr('width', x(0) - 80)
    .attr('height', 510 - y(0))
    .attr('fill', '#fbe9eb')
    .attr('opacity', 0.6);
  svg
    .append('line')
    .attr('x1', x(0))
    .attr('x2', x(0))
    .attr('y1', 60)
    .attr('y2', 510)
    .attr('stroke', '#8797ae');
  svg
    .append('line')
    .attr('x1', 80)
    .attr('x2', 1005)
    .attr('y1', y(0))
    .attr('y2', y(0))
    .attr('stroke', '#8797ae');
  label(svg, 840, 91, 'TWO YEARS OF GROWTH', 11, '#4c8f69');
  label(svg, 98, 494, 'TWO YEARS OF CONTRACTION', 11, '#ad6673');
  const years = [...new Set(points.map((d) => d.year))].sort((a, b) => a - b);
  let index = 0,
    clock = 0,
    playing = true,
    pin = null,
    full = false;
  const paths = svg
    .append('g')
    .selectAll('path')
    .data(groups)
    .join('path')
    .attr('class', 'phase-trail')
    .attr('fill', 'none')
    .attr('stroke', (d) => d.color)
    .attr('stroke-width', 2.4)
    .attr('stroke-linecap', 'round');
  const heads = svg
    .append('g')
    .selectAll('g')
    .data(groups)
    .join('g')
    .attr('class', 'phase-country');
  heads
    .append('circle')
    .attr('r', 11)
    .attr('fill', (d) => d.color)
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .attr('filter', 'url(#soft-shadow)');
  heads
    .append('text')
    .attr('x', 16)
    .attr('dy', 4)
    .attr('font-size', 12)
    .attr('font-weight', 700)
    .attr('fill', (d) => d.color)
    .text((d) => d.name);
  hover(
    heads,
    scene,
    (d) => d.name,
    (d) =>
      d.point
        ? `${d.point.year}: previous ${number(d.point.x)}%, current ${number(d.point.y)}%`
        : 'No observation in selected year',
  );
  heads.on('click', (_, d) => {
    pin = pin === d.id ? null : d.id;
    scene.inspect(
      d.name,
      d.point
        ? `${d.point.year}: ${number(d.point.y)}% actual reported growth. The connected trail shows consecutive annual pairs.`
        : 'No reported value',
    );
    scene.probe.country = pin;
  });
  const yearLabel = label(svg, 92, 108, '', 48, '#cfdaea');
  const timeline = scene.timeline('Economic year', 0, years.length - 1, 0, (i) => {
    index = i;
    playing = false;
    update();
  });
  scene.controls(
    'Phase playback',
    ['Play years', 'Hold year'],
    (_, i) => (playing = i === 0),
  );
  scene.controls(
    'Trajectory detail',
    ['Reveal over time', 'Full selected history'],
    (_, i) => {
      full = !!i;
      update();
    },
  );
  function update() {
    const year = years[index];
    yearLabel.text(year);
    timeline.set(index, year);
    for (const g of groups) {
      g.point = g.pairs.find((p) => p.year === year);
      if (g.point) {
        g.tx = x(g.point.x);
        g.ty = y(g.point.y);
        if (g.px === undefined) {
          g.px = g.tx;
          g.py = g.ty;
        }
      }
    }
    paths.attr('d', (g) =>
      d3
        .line()
        .x((d) => x(d.x))
        .y((d) => y(d.y))
        .curve(d3.curveCatmullRom.alpha(0.5))(
        g.pairs.filter((p) => full || p.year <= year),
      ),
    );
    heads.attr('display', (d) => (d.point ? null : 'none'));
    scene.probe.year = year;
  }
  update();
  scene.inspect(
    'Economic history as a traversable phase portrait',
    'Each position is a pair of actual consecutive annual rates. Motion interpolates between records; it is not an economic forecast or a causal model.',
  );
  scene.frame((dt, t) => {
    clock += dt;
    if (playing && clock > 0.9) {
      index = (index + 1) % years.length;
      clock = 0;
      update();
    }
    for (const d of groups) {
      d.px += (d.tx - d.px) * Math.min(1, dt * 5);
      d.py += (d.ty - d.py) * Math.min(1, dt * 5);
    }
    heads
      .attr('transform', (d) => `translate(${d.px || 0},${d.py || 0})`)
      .attr('opacity', (d) => (pin && pin !== d.id ? 0.15 : 1));
    paths.attr('opacity', (d) => (pin && pin !== d.id ? 0.08 : 0.6));
    heads
      .select('circle')
      .attr('r', (d) => (pin === d.id ? 13 + Math.sin(t * 4) * 2 : 10));
    scene.probe.series = groups.length;
  });
  return scene;
}
