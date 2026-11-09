import { d3, createScene, label, number, palette } from './core.js';
export function rain(node, packet, rows) {
  const scene = createScene(
    node,
    'Rainfall observatory',
    'ISOMETRIC RAIN PHYSICS · FIVE LIVE FORECAST LOCATIONS · DRAG TO ORBIT',
  );
  const { svg, surface } = scene;
  const canvas = document.createElement('canvas');
  canvas.width = 1100;
  canvas.height = 600;
  canvas.className = 'particle-layer';
  surface.prepend(canvas);
  const ctx = canvas.getContext('2d'),
    cities = [...d3.group(rows, (d) => d.city)].map(([name, series], i) => ({
      name,
      series: series.sort((a, b) => a.time - b.time),
      color: palette[i % 6],
      x: (i - 2) * 165,
    }));
  let selected = d3.greatestIndex(cities, (c) => d3.sum(c.series, (d) => d.value)),
    index = d3.greatestIndex(cities[selected].series, (d) => d.value),
    yaw = 0.55,
    auto = true,
    clock = 0,
    accumulated = false;
  const max = Math.max(
      0.1,
      d3.max(rows, (d) => d.value),
    ),
    height = d3.scaleLinear().domain([0, max]).range([0, 150]);
  const labels = svg
    .append('g')
    .selectAll('text')
    .data(cities)
    .join('text')
    .attr('font-size', 13)
    .attr('text-anchor', 'middle')
    .attr('fill', '#365374')
    .attr('font-weight', 700);
  const values = svg
    .append('g')
    .selectAll('text')
    .data(cities)
    .join('text')
    .attr('font-size', 12)
    .attr('text-anchor', 'middle')
    .attr('fill', '#5f86aa');
  const big = label(svg, 65, 88, '', 48, '#357db5'),
    caption = label(svg, 65, 118, '', 14);
  const timeLabel = label(svg, 770, 90, '', 15),
    modeLabel = label(svg, 770, 117, 'Amounts, not probabilities', 12);
  const particles = Array.from({ length: 500 }, () => ({
    x: (Math.random() - 0.5) * 120,
    y: (Math.random() - 0.5) * 75,
    z: Math.random() * 260,
  }));
  function project(x, y, z = 0) {
    const xx = x * Math.cos(yaw) - y * Math.sin(yaw),
      yy = x * Math.sin(yaw) + y * Math.cos(yaw);
    return [550 + xx, 382 + yy * 0.42 - z * 0.9];
  }
  function poly(points, fill, stroke) {
    ctx.beginPath();
    points.forEach((p, i) => {
      const xy = project(...p);
      if (i) ctx.lineTo(...xy);
      else ctx.moveTo(...xy);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }
  function amount(c) {
    return c.series[Math.min(index, c.series.length - 1)]?.value || 0;
  }
  const timeline = scene.timeline(
    'Rain forecast interval',
    0,
    cities[selected].series.length - 1,
    index,
    (i) => {
      index = i;
      auto = false;
      update();
    },
  );
  scene.controls(
    'Forecast location',
    cities.map((c) => c.name),
    (_, i) => {
      selected = i;
      index = Math.min(index, cities[i].series.length - 1);
      update();
    },
  );
  scene.controls(
    'Rain playback',
    ['Play hours', 'Hold hour', 'Find wettest interval'],
    (_, i) => {
      if (i === 2) {
        selected = d3.greatestIndex(cities, (c) => d3.max(c.series, (d) => d.value));
        index = d3.greatestIndex(cities[selected].series, (d) => d.value);
        auto = false;
        update();
      } else auto = i === 0;
    },
  );
  svg.call(
    d3.drag().on('drag', (e) => {
      yaw += e.dx * 0.008;
    }),
  );
  function update() {
    const d = cities[selected].series[index];
    big.text(`${number(d.value)} mm`);
    caption.text(`${cities[selected].name} · selected forecast interval`);
    timeLabel.text(new Date(d.time).toLocaleString());
    timeline.set(
      index,
      new Date(d.time).toLocaleTimeString('en-US', { hour: 'numeric' }),
    );
    scene.probe.city = cities[selected].name;
    scene.probe.rain = d.value;
    scene.probe.hour = d.time;
    scene.inspect(
      d.value > 0 ? 'Rainfall amount drives the scene' : 'Dry forecast interval',
      d.value > 0
        ? 'Particles are illustrative; their density follows the selected actual forecast amount. The plinths compare five cities.'
        : 'The actual selected amount is zero, so no rain particles are emitted. Choose another city or find the wettest interval.',
    );
  }
  update();
  scene.frame((dt, t) => {
    clock += dt;
    if (auto && clock > 0.65) {
      clock = 0;
      index = (index + 1) % cities[selected].series.length;
      update();
    }
    ctx.clearRect(0, 0, 1100, 600);
    const ground = ctx.createLinearGradient(0, 180, 0, 580);
    ground.addColorStop(0, '#fafcff');
    ground.addColorStop(1, '#e4eff8');
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, 1100, 600);
    for (const c of cities) {
      const a = amount(c),
        z = height(a);
      poly(
        [
          [c.x - 62, -40, 0],
          [c.x + 62, -40, 0],
          [c.x + 62, 40, 0],
          [c.x - 62, 40, 0],
        ],
        '#d8e4f1',
        '#b1c8de',
      );
      if (z > 0) {
        poly(
          [
            [c.x - 62, -40, 0],
            [c.x - 62, 40, 0],
            [c.x - 62, 40, z],
            [c.x - 62, -40, z],
          ],
          '#5d9bcaa0',
          '#75add2',
        );
        poly(
          [
            [c.x - 62, 40, 0],
            [c.x + 62, 40, 0],
            [c.x + 62, 40, z],
            [c.x - 62, 40, z],
          ],
          '#79bce3a0',
          '#75add2',
        );
        poly(
          [
            [c.x - 62, -40, z],
            [c.x + 62, -40, z],
            [c.x + 62, 40, z],
            [c.x - 62, 40, z],
          ],
          '#bce3f0b0',
          '#5a9ec8',
        );
        for (let k = 0; k < 6; k++) {
          ctx.beginPath();
          for (let j = 0; j <= 18; j++) {
            const p = project(
              c.x - 60 + j * 6.6,
              -35 + k * 13,
              z + Math.sin(j * 0.5 + t * 2 + k) * 1.2,
            );
            if (j) ctx.lineTo(...p);
            else ctx.moveTo(...p);
          }
          ctx.strokeStyle = '#e4faffaa';
          ctx.stroke();
        }
      }
    }
    const selectedCity = cities[selected],
      rainCount = Math.min(500, Math.round((amount(selectedCity) / max) * 450));
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#4d9ec1b0';
    for (let i = 0; i < rainCount; i++) {
      const p = particles[i],
        z0 = p.z;
      p.z -= dt * (130 + amount(selectedCity) * 20);
      if (p.z < height(amount(selectedCity))) {
        p.z = 220 + Math.random() * 80;
        p.x = (Math.random() - 0.5) * 120;
        p.y = (Math.random() - 0.5) * 75;
      }
      const a = project(selectedCity.x + p.x, p.y, p.z),
        b = project(selectedCity.x + p.x, p.y, p.z + 11);
      ctx.beginPath();
      ctx.moveTo(...a);
      ctx.lineTo(...b);
      ctx.stroke();
    }
    labels
      .attr('x', (d) => project(d.x, 73, 0)[0])
      .attr('y', (d) => project(d.x, 73, 0)[1] + 20)
      .attr('fill', (_, i) => (i === selected ? '#186497' : '#738aa1'))
      .text((d) => d.name);
    values
      .attr('x', (d) => project(d.x, 73, 0)[0])
      .attr('y', (d) => project(d.x, 73, 0)[1] + 40)
      .text((d) => number(amount(d)) + ' mm');
    scene.probe.particles = rainCount;
    scene.probe.rotation = yaw;
  });
  return scene;
}
