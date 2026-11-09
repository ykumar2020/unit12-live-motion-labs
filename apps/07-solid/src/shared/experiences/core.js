import * as d3 from 'd3';
export { d3 };
export const palette = ['#247bdf', '#f2823d', '#3baf94', '#9a72d7', '#dc5b89', '#b89b3d'];
export const W = 1100,
  H = 600;
export const number = (n) =>
  new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
    notation: Math.abs(n) >= 1000000 ? 'compact' : 'standard',
  }).format(n);
export function createScene(node, title, subtitle) {
  node.replaceChildren();
  node.classList.add('kinetic-stage');
  const toolbar = document.createElement('div');
  toolbar.className = 'scene-toolbar';
  const tag = document.createElement('span');
  tag.className = 'scene-label';
  tag.textContent = subtitle;
  toolbar.append(tag);
  const pause = document.createElement('button');
  pause.className = 'motion-toggle';
  pause.textContent = 'Pause motion';
  toolbar.append(pause);
  node.append(toolbar);
  const surface = document.createElement('div');
  surface.className = 'scene-surface';
  node.append(surface);
  const pan = document.createElement('label');
  pan.className = 'mobile-pan';
  pan.textContent = 'Explore canvas';
  const panInput = document.createElement('input');
  panInput.type = 'range';
  panInput.min = 0;
  panInput.max = 100;
  panInput.value = 25;
  panInput.setAttribute('aria-label', 'Canvas viewport');
  panInput.oninput = () =>
    (surface.scrollLeft =
      ((surface.scrollWidth - surface.clientWidth) * panInput.value) / 100);
  pan.append(panInput);
  node.append(pan);
  queueMicrotask(() => {
    surface.scrollLeft = (surface.scrollWidth - surface.clientWidth) * 0.25;
  });
  const svg = d3
    .select(surface)
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('role', 'img')
    .attr('aria-label', title)
    .attr('class', 'custom-scene');
  svg.append('title').text(title);
  const defs = svg.append('defs');
  const filter = defs.append('filter').attr('id', 'soft-shadow');
  filter
    .append('feDropShadow')
    .attr('dx', 0)
    .attr('dy', 6)
    .attr('stdDeviation', 9)
    .attr('flood-color', '#233e6620');
  const grad = defs
    .append('linearGradient')
    .attr('id', 'ocean')
    .attr('x2', '1')
    .attr('y2', '1');
  grad.append('stop').attr('stop-color', '#edf5ff');
  grad.append('stop').attr('offset', '100%').attr('stop-color', '#b7d5f3');
  const inspector = document.createElement('div');
  inspector.className = 'scene-inspector';
  inspector.setAttribute('aria-live', 'off');
  node.append(inspector);
  let inView = true;
  const observer = new IntersectionObserver((entries) => {
    inView = entries[0]?.isIntersecting !== false;
  });
  observer.observe(node);
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches,
    t = 0,
    last = 0,
    callback = () => {},
    dead = false;
  pause.textContent = paused ? 'Play motion' : 'Pause motion';
  const state = (window.__missionState ||= new Map());
  const done = state.get(title) || new Set();
  state.set(title, done);
  const board = document.createElement('div');
  board.className = 'mission-board';
  board.innerHTML =
    '<strong>EXPLORE / PLAY</strong><span data-mission="0">Inspect a real record</span><span data-mission="1">Change the geometry</span><span data-mission="2">Scrub or select data</span>';
  node.append(board);
  function achieve(i) {
    done.add(i);
    board
      .querySelectorAll('[data-mission]')
      .forEach((el) => el.classList.toggle('complete', done.has(+el.dataset.mission)));
  }
  done.forEach(achieve);
  const probe = {
    kind: title,
    frame: 0,
    time: 0,
    selection: null,
    playing: !paused,
    missions: [...done],
  };
  window.__vizProbe = probe;
  pause.onclick = () => {
    paused = !paused;
    probe.playing = !paused;
    pause.textContent = paused ? 'Play motion' : 'Pause motion';
  };
  const timer = d3.timer((now) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (dead || document.hidden || !inView) return;
    if (!paused) {
      t += dt;
      probe.frame++;
      probe.time = t;
      callback(dt, t);
    }
  });
  const controls = (label, options, onChange) => {
    const group = document.createElement('div');
    group.className = 'segmented';
    group.setAttribute('aria-label', label);
    for (const [i, name] of options.entries()) {
      const b = document.createElement('button');
      b.textContent = name;
      b.setAttribute('aria-pressed', String(i === 0));
      b.onclick = () => {
        group
          .querySelectorAll('button')
          .forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        onChange(name, i);
        if (paused) callback(0.5, t);
        achieve(1);
        probe.missions = [...done];
        probe.selection = name;
      };
      group.append(b);
    }
    toolbar.insertBefore(group, pause);
    return group;
  };
  const inspect = (heading, detail) => {
    inspector.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = heading;
    const p = document.createElement('span');
    p.textContent = detail;
    inspector.append(strong, p);
    probe.selection = heading;
  };
  const timeline = (label, min, max, value, onInput) => {
    const wrap = document.createElement('label');
    wrap.className = 'scene-timeline';
    const output = document.createElement('output');
    output.textContent = String(value);
    wrap.append(document.createTextNode(label + ' '), output);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = '1';
    slider.value = value;
    slider.setAttribute('aria-label', label);
    slider.oninput = () => {
      output.textContent = slider.value;
      onInput(+slider.value);
      if (paused) callback(0.5, t);
      achieve(0);
      achieve(2);
      probe.missions = [...done];
    };
    wrap.append(slider);
    node.append(wrap);
    return {
      slider,
      output,
      set(v, labelValue = v) {
        slider.value = v;
        output.textContent = String(labelValue);
      },
    };
  };
  return {
    svg,
    surface,
    toolbar,
    probe,
    inspect,
    controls,
    timeline,
    achieve,
    frame(fn) {
      callback = fn;
      fn(0, t);
    },
    dispose() {
      dead = true;
      observer.disconnect();
      timer.stop();
      svg.interrupt();
      svg.selectAll('*').interrupt();
      node.replaceChildren();
    },
    setPaused(v) {
      paused = v;
      probe.playing = !v;
      pause.textContent = v ? 'Play motion' : 'Pause motion';
    },
  };
}
export function label(svg, x, y, text, size = 13, color = '#5e7188') {
  return svg
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('fill', color)
    .attr('font-size', size)
    .text(text);
}
export function hover(selection, scene, title, detail) {
  selection
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', (d) => title(d) + '. ' + detail(d))
    .on('pointerenter focus', (_, d) => {
      scene.inspect(title(d), detail(d));
      scene.achieve(0);
    })
    .on('click keydown', (e, d) => {
      if (e.type === 'click' || e.key === 'Enter') {
        scene.inspect(title(d), detail(d));
        scene.probe.pinned = d.id || title(d);
      }
    });
  selection.append('title').text((d) => title(d) + ' · ' + detail(d));
}
export function dragNodes(selection, simulation) {
  selection.call(
    d3
      .drag()
      .on('start', (e, d) => {
        d.fx = d.x;
        d.fy = d.y;
        simulation.alpha(0.8);
      })
      .on('drag', (e, d) => {
        d.fx = e.x;
        d.fy = e.y;
      })
      .on('end', (_, d) => {
        d.fx = null;
        d.fy = null;
        simulation.alpha(0.6);
      }),
  );
}
export function axisGrid(svg, x, y, xTitle, yTitle) {
  svg
    .append('g')
    .attr('class', 'scene-grid')
    .attr('transform', 'translate(80,0)')
    .call(d3.axisLeft(y).ticks(5).tickSize(-930).tickFormat(''));
  svg.append('g').attr('transform', 'translate(0,510)').call(d3.axisBottom(x).ticks(7));
  svg.append('g').attr('transform', 'translate(80,0)').call(d3.axisLeft(y).ticks(5));
  label(svg, 480, 565, xTitle);
  label(svg, 80, 35, yTitle);
}
