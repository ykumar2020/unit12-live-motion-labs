import { d3, createScene, label, hover, dragNodes, palette, number } from './core.js';
export function population(node, packet, rows) {
  const scene = createScene(
    node,
    'Population choreography',
    'LIVE-REQUESTED ANNUAL DATA · AREA = POPULATION · DRAG A COUNTRY',
  );
  const { svg } = scene;
  const grouped = [...d3.group(rows, (d) => d.country)].map(([id, series], i) => ({
    id,
    name: series[0].countryName,
    series,
    color: palette[i % 6],
    x: 388 + Math.cos(i * 1.07) * 130,
    y: 239 + Math.sin(i * 1.07) * 100,
    r: 0,
    value: 0,
  }));
  const years = [...new Set(rows.map((d) => d.time))].sort((a, b) => a - b);
  let index = 0,
    clock = 0,
    playing = true,
    mode = 0,
    pinned = null;
  const radius = d3
    .scaleSqrt()
    .domain([0, d3.max(rows, (d) => d.value)])
    .range([0, 116]);
  const hugeYear = label(svg, 760, 125, String(years[0]), 78, '#d5deec');
  label(svg, 760, 164, 'ANNUAL PLAYBACK', 12);
  label(svg, 760, 202, 'Six countries, requested now.');
  label(svg, 760, 225, 'Annual records are historical,');
  label(svg, 760, 248, 'not a live population counter.');
  label(svg, 760, 296, 'Circle area is proportional');
  label(svg, 760, 319, 'to reported population.');
  label(svg, 760, 380, 'Pin a country to trace its history.');
  svg
    .append('circle')
    .attr('cx', 388)
    .attr('cy', 239)
    .attr('r', 203)
    .attr('fill', '#f2f6fc')
    .attr('stroke', '#e3eaf5');
  const bodies = svg
    .append('g')
    .selectAll('g')
    .data(grouped)
    .join('g')
    .attr('class', 'country-body')
    .style('cursor', 'grab');
  bodies
    .append('circle')
    .attr('fill', (d) => d.color)
    .attr('fill-opacity', 0.83)
    .attr('stroke', '#fff')
    .attr('stroke-width', 3)
    .attr('filter', 'url(#soft-shadow)');
  bodies
    .append('text')
    .attr('class', 'country-name')
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('font-size', 15)
    .attr('font-weight', 700)
    .text((d) => d.name);
  bodies
    .append('text')
    .attr('class', 'country-pop')
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('dy', 24)
    .attr('font-size', 17);
  bodies.on('click', (_, d) => {
    pinned = pinned === d.id ? null : d.id;
    scene.inspect(
      d.name,
      `${number(d.value)} people in ${years[index]}. The selected trace is highlighted.`,
    );
    scene.probe.country = pinned;
  });
  hover(
    bodies,
    scene,
    (d) => d.name,
    (d) => `${number(d.value)} people · ${years[index]}`,
  );
  const simulation = d3
    .forceSimulation(grouped)
    .force(
      'x',
      d3
        .forceX((d) =>
          mode ? 388 + 180 * Math.cos((grouped.indexOf(d) * Math.PI) / 3) : 388,
        )
        .strength(0.045),
    )
    .force(
      'y',
      d3
        .forceY((d) =>
          mode ? 239 + 130 * Math.sin((grouped.indexOf(d) * Math.PI) / 3) : 239,
        )
        .strength(0.045),
    )
    .force('collide', d3.forceCollide((d) => d.r + 5).iterations(4))
    .stop();
  dragNodes(bodies, simulation);
  const history = svg.append('g');
  const sx = d3.scaleLinear().domain(d3.extent(years)).range([95, 1010]),
    sy = d3
      .scaleLinear()
      .domain([0, d3.max(rows, (d) => d.value)])
      .range([555, 465]);
  const traces = history
    .selectAll('path')
    .data(grouped)
    .join('path')
    .attr('fill', 'none')
    .attr('stroke', (d) => d.color)
    .attr('stroke-width', 2)
    .attr('d', (d) =>
      d3
        .line()
        .x((r) => sx(r.time))
        .y((r) => sy(r.value))(d.series),
    );
  const scan = history
    .append('line')
    .attr('y1', 457)
    .attr('y2', 558)
    .attr('stroke', '#243d64')
    .attr('stroke-dasharray', '3 3');
  label(svg, 95, 591, String(years[0]), 12);
  label(svg, 966, 591, String(years.at(-1)), 12);
  label(svg, 95, 446, 'LINKED HISTORY · SAME REPORTING YEARS', 11);
  const timeline = scene.timeline('Reporting year', 0, years.length - 1, 0, (i) => {
    index = i;
    playing = false;
    update();
  });
  scene.controls(
    'Population motion',
    ['Play years', 'Hold year'],
    (_, i) => (playing = i === 0),
  );
  scene.controls('Country layout', ['Packed population', 'Country orbit'], (_, i) => {
    mode = i;
    simulation.alpha(0.8);
  });
  function update() {
    const year = years[index];
    hugeYear.text(year);
    timeline.set(index, year);
    for (const d of grouped) {
      const r = d.series.find((r) => r.time === year);
      d.value = r?.value ?? null;
      d.targetRadius = r ? radius(r.value) : 0;
      if (d.r === 0) d.r = d.targetRadius;
    }
    bodies
      .select('.country-pop')
      .text((d) => (d.value === null ? 'not reported' : number(d.value)));
    scene.probe.year = year;
    scan.attr('x1', sx(year)).attr('x2', sx(year));
    simulation.alpha(0.35);
  }
  update();
  scene.inspect(
    'Population as a moving, collision-aware composition',
    'Scrub reported years, drag countries and switch layouts. Layout physics changes position; the circle area continues to encode the actual record.',
  );
  scene.frame((dt) => {
    clock += dt;
    if (playing && clock > 1.1) {
      index = (index + 1) % years.length;
      clock = 0;
      update();
    }
    for (const d of grouped) {
      if (!d.fx) {
        d.x = Math.max(70 + d.r, Math.min(700 - d.r, d.x));
        d.y = Math.max(60 + d.r, Math.min(417 - d.r, d.y));
      }
    }
    for (const d of grouped) d.r += (d.targetRadius - d.r) * Math.min(1, dt * 5);
    simulation.force('collide').radius((d) => d.r + 5);
    simulation.tick();
    bodies
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .attr('opacity', (d) => (pinned && pinned !== d.id ? 0.25 : 1));
    bodies.select('circle').attr('r', (d) => d.r);
    bodies.select('.country-name').attr('font-size', (d) => (d.r < 45 ? 10 : 15));
    traces
      .attr('opacity', (d) => (pinned && pinned !== d.id ? 0.13 : 1))
      .attr('stroke-width', (d) => (pinned === d.id ? 4 : 2));
  });
  return scene;
}
