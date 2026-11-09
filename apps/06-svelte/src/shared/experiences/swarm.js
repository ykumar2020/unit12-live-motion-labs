import { d3, createScene, label, hover, dragNodes, number } from './core.js';
export function swarm(node, packet, rows) {
  const scene = createScene(
    node,
    'Seismic particle sculpture',
    'ONE PARTICLE = ONE EARTHQUAKE · MORPH / BRUSH / ORBIT',
  );
  const { svg } = scene;
  const x = d3
      .scaleLinear()
      .domain([
        2.5,
        Math.max(
          6.5,
          d3.max(rows, (d) => d.x),
        ),
      ])
      .range([90, 1000]),
    depth = d3
      .scaleSqrt()
      .domain([
        0,
        Math.max(
          50,
          d3.max(rows, (d) => d.y),
        ),
      ])
      .range([80, 470]);
  let mode = 0,
    auto = true,
    clock = 0,
    yaw = 0.25,
    pinned = null;
  const byBin = d3.group(rows, (d) => Math.floor(d.x * 2) / 2);
  const particles = rows.map((d, i) => ({
    ...d,
    depthKm: d.y,
    magnitude: d.x,
    xPos: x(d.x),
    x: x(d.x),
    y: 290 + (i % 7) * 4,
    r: 3.3,
    tx: x(d.x),
    ty: 300,
  }));
  const simulation = d3
    .forceSimulation(particles)
    .force('x', d3.forceX((d) => d.tx).strength(0.18))
    .force('y', d3.forceY((d) => d.ty).strength(0.16))
    .force('collide', d3.forceCollide(4.7).iterations(3))
    .stop();
  const guide = svg.append('g'),
    baseAxis = svg
      .append('g')
      .attr('transform', 'translate(0,515)')
      .call(d3.axisBottom(x).ticks(8));
  label(svg, 410, 565, 'EARTHQUAKE MAGNITUDE', 12);
  const glyph = svg
    .append('g')
    .selectAll('circle')
    .data(particles)
    .join('circle')
    .attr('class', 'seismic-particle')
    .attr('r', 4)
    .attr('fill', (d) => d3.interpolatePlasma(Math.min(1, Math.max(0, d.depthKm) / 650)))
    .attr('stroke', 'white')
    .attr('stroke-width', 0.6);
  hover(
    glyph,
    scene,
    (d) => d.label,
    (d) => `M ${d.magnitude} · ${number(d.depthKm)} km`,
  );
  dragNodes(glyph, simulation);
  glyph.on('click', (_, d) => {
    pinned = d.id;
    const original = rows.find((r) => r.id === d.id);
    scene.inspect(
      original.label,
      `M ${original.x} · ${original.y} km deep · ${new Date(original.time).toLocaleString()}`,
    );
    scene.probe.pinned = pinned;
  });
  const halos = svg
    .append('circle')
    .attr('fill', 'none')
    .attr('stroke', '#ec884b')
    .attr('stroke-width', 2)
    .attr('r', 13)
    .attr('pointer-events', 'none');
  const top = label(svg, 90, 40, 'MAGNITUDE SWARM', 18, '#3e4775');
  const countLabel = label(svg, 760, 40, `${rows.length} real earthquakes`, 14);
  const rawByID = new Map(rows.map((d) => [d.id, d]));
  function targets() {
    guide.selectAll('*').remove();
    top.text(['MAGNITUDE SWARM', 'BIN SCULPTURE', 'DEPTH ORBIT'][mode]);
    for (const p of particles) {
      const d = rawByID.get(p.id);
      if (mode === 0) {
        p.tx = x(d.x);
        p.ty = 290;
      } else if (mode === 1) {
        const bin = Math.floor(d.x * 2) / 2,
          group = byBin.get(bin),
          at = group.findIndex((r) => r.id === d.id);
        p.tx = x(bin + 0.25) + ((at % 5) - 2) * 10;
        p.ty = 490 - Math.floor(at / 5) * 10;
      } else {
        const a = (d.x - 4.5) * 145,
          z = ((d.time - d3.min(rows, (r) => r.time)) / 86400000) * 35 - 120;
        p.tx = 550 + a * Math.cos(yaw) - z * Math.sin(yaw);
        p.ty = 90 + depth(d.y) * 0.7 + (a * Math.sin(yaw) + z * Math.cos(yaw)) * 0.25;
      }
    }
    if (mode === 1)
      for (const [bin, group] of byBin) {
        label(
          guide,
          x(bin + 0.25),
          480 - Math.ceil(group.length / 5) * 10,
          String(group.length),
          12,
          '#806595',
        ).attr('text-anchor', 'middle');
      }
    simulation.alpha(0.7);
    scene.probe.layout = ['swarm', 'bins', 'depth'][mode];
  }
  scene.controls(
    'Particle layout',
    ['Magnitude swarm', 'Bin sculpture', 'Depth orbit'],
    (_, i) => {
      mode = i;
      auto = false;
      targets();
    },
  );
  scene.controls(
    'Choreography',
    ['Auto morph', 'Hold layout'],
    (_, i) => (auto = i === 0),
  );
  const brush = svg
    .append('g')
    .attr('class', 'magnitude-brush')
    .call(
      d3
        .brushX()
        .extent([
          [85, 525],
          [1005, 552],
        ])
        .on('brush end', (e) => {
          if (!e.selection) {
            glyph.attr('opacity', 1);
            return;
          }
          const [a, b] = e.selection.map(x.invert);
          const chosen = particles.filter((p) => {
            const d = rawByID.get(p.id);
            return d.x >= a && d.x <= b;
          });
          glyph.attr('opacity', (p) => (chosen.includes(p) ? 1 : 0.08));
          scene.inspect(
            `${chosen.length} events in the brushed interval`,
            `Magnitude ${a.toFixed(2)}–${b.toFixed(2)}; selection is linked to actual event IDs.`,
          );
          scene.probe.selectedEventIds = chosen.map((d) => d.id);
        }),
    );
  label(
    svg,
    90,
    591,
    'BRUSH THE STRIP BELOW THE AXIS · COLOR = DEPTH · LAYOUT PHYSICS DOES NOT CHANGE DATA',
    11,
  );
  targets();
  for (let i = 0; i < 35; i++) simulation.tick();
  scene.inspect(
    'A histogram built from individual events',
    'Watch the same particles become a swarm, stacked bins and a rotating depth cloud. Nothing is replaced by synthetic counts.',
  );
  scene.frame((dt, t) => {
    clock += dt;
    if (auto && clock > 7) {
      mode = (mode + 1) % 3;
      clock = 0;
      targets();
    }
    if (mode === 2) {
      yaw += dt * 0.17;
      targets();
    }
    simulation.tick();
    glyph
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', (d) => (d.id === pinned ? 7 : 4));
    const selected = particles.find((p) => p.id === pinned);
    halos.attr('display', selected ? null : 'none');
    if (selected)
      halos
        .attr('cx', selected.x)
        .attr('cy', selected.y)
        .attr('r', 12 + Math.sin(t * 3) * 3);
    scene.probe.particleCount = particles.length;
  });
  return scene;
}
