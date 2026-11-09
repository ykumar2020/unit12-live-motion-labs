import { d3, createScene, label, hover, dragNodes, palette, number } from './core.js';
export function books(node, packet, rows) {
  const scene = createScene(
    node,
    'The author–work constellation',
    'FORCE GRAPH · DRAG NODES · PIN A NEIGHBORHOOD · ZOOM',
  );
  const { svg } = scene;
  const map = new Map(),
    edges = [];
  rows.forEach((book, i) => {
    map.set(book.id, {
      ...book,
      kind: 'work',
      r: Math.max(4, Math.sqrt(Math.max(0, book.value)) * 8),
      x: 360 + Math.cos(i * 2.4) * 160,
      y: 260 + Math.sin(i * 2.4) * 140,
    });
    for (const author of book.authors || []) {
      const id = 'author:' + author.id;
      if (!map.has(id))
        map.set(id, {
          id,
          label: author.name,
          kind: 'author',
          r: 8,
          x: 500 + Math.cos(i) * 160,
          y: 280 + Math.sin(i) * 140,
        });
      edges.push({ source: id, target: book.id });
    }
  });
  const nodes = [...map.values()],
    layer = svg.append('g');
  let mode = 0,
    pinned = null,
    showNames = false;
  const simulation = d3
    .forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(-40))
    .force(
      'link',
      d3
        .forceLink(edges)
        .id((d) => d.id)
        .distance(72)
        .strength(0.5),
    )
    .force(
      'collide',
      d3.forceCollide((d) => d.r + 9),
    )
    .force(
      'x',
      d3.forceX((d) => (mode ? (d.kind === 'author' ? 280 : 700) : 480)).strength(0.065),
    )
    .force('y', d3.forceY(280).strength(0.065))
    .stop();
  for (let i = 0; i < 70; i++) simulation.tick();
  const links = layer
    .append('g')
    .selectAll('path')
    .data(edges)
    .join('path')
    .attr('fill', 'none')
    .attr('stroke', '#9bb3d0')
    .attr('stroke-width', 1.2);
  const travelers = layer
    .append('g')
    .selectAll('circle')
    .data(edges)
    .join('circle')
    .attr('r', 2.5)
    .attr('fill', '#aa7dce')
    .attr('pointer-events', 'none');
  const groups = layer
    .append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'network-node');
  groups
    .append('circle')
    .attr('r', (d) => d.r)
    .attr('fill', (d) => (d.kind === 'author' ? '#8066b6' : '#edac64'))
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .attr('filter', 'url(#soft-shadow)');
  groups
    .filter((d) => d.kind === 'author')
    .append('text')
    .attr('x', 13)
    .attr('dy', 4)
    .attr('font-size', 12)
    .attr('fill', '#514d79')
    .text((d) => (d.label.length > 24 ? d.label.slice(0, 23) + '…' : d.label));
  groups
    .filter((d) => d.kind === 'work')
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 5)
    .attr('font-size', 11)
    .attr('font-weight', 700)
    .attr('fill', '#70411b')
    .text((d) => d.value);
  dragNodes(groups, simulation);
  hover(
    groups,
    scene,
    (d) => d.label,
    (d) =>
      d.kind === 'author'
        ? 'Author node; links are catalog work credits'
        : `${d.value} catalog editions · first publication ${d.year || 'not reported'}`,
  );
  groups.on('click', (_, d) => {
    pinned = pinned === d.id ? null : d.id;
    scene.inspect(
      d.label,
      d.kind === 'work'
        ? `${d.value} editions · ${(d.authors || []).map((a) => a.name).join(', ') || 'No author field returned'}`
        : 'Pinned author and connected works',
    );
    scene.probe.pinned = pinned;
    simulation.alpha(0.25);
  });
  const zoom = d3
    .zoom()
    .scaleExtent([0.6, 3])
    .filter((e) => !e.target.closest('.network-node'))
    .on('zoom', (e) => layer.attr('transform', e.transform));
  svg.call(zoom);
  scene.controls('Network geometry', ['Constellation', 'Authors → works'], (_, i) => {
    mode = i;
    simulation.alpha(0.9);
  });
  scene.controls(
    'Author labels',
    ['Inspect names', 'Show names'],
    (_, i) => (showNames = !!i),
  );
  scene.controls('Network selection', ['Clear pin', 'Reset view'], (_, i) => {
    ((pinned = null), (showNames = false));
    if (i) svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
  });
  label(
    svg,
    65,
    38,
    `${rows.length} works / ${nodes.length - rows.length} authors`,
    17,
    '#4b4d75',
  );
  label(
    svg,
    65,
    570,
    'Purple = authors · Amber area = editions · Numbers = exact edition counts',
    12,
  );
  label(
    svg,
    65,
    592,
    'Motion traces catalog relationships, not reading traffic. Search results are a sample.',
    12,
  );
  scene.inspect(
    'A bipartite catalog, not a ranked bar chart',
    'Move a work or author and watch the connected structure relax. Click a node to isolate its actual catalog relationships.',
  );
  function related(n) {
    return (
      !pinned ||
      n.id === pinned ||
      edges.some(
        (e) =>
          (e.source.id === pinned && e.target.id === n.id) ||
          (e.target.id === pinned && e.source.id === n.id),
      )
    );
  }
  scene.frame((dt, t) => {
    simulation.tick();
    for (const d of nodes) {
      if (!d.fx) {
        d.x = Math.max(45, Math.min(1020, d.x));
        d.y = Math.max(65, Math.min(510, d.y));
      }
    }
    groups
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .attr('opacity', (d) => (related(d) ? 1 : 0.12));
    links
      .attr(
        'd',
        (d) =>
          `M${d.source.x},${d.source.y}Q${(d.source.x + d.target.x) / 2},${(d.source.y + d.target.y) / 2 - 20} ${d.target.x},${d.target.y}`,
      )
      .attr('opacity', (d) =>
        !pinned || d.source.id === pinned || d.target.id === pinned ? 0.8 : 0.07,
      );
    travelers
      .attr('cx', (d, i) => {
        const a = (t * 0.22 + i * 0.071) % 1;
        return (1 - a) * d.source.x + a * d.target.x;
      })
      .attr('cy', (d, i) => {
        const a = (t * 0.22 + i * 0.071) % 1;
        return (1 - a) * d.source.y + a * d.target.y - 40 * a * (1 - a);
      })
      .attr('opacity', (d) =>
        !pinned || d.source.id === pinned || d.target.id === pinned ? 1 : 0,
      );
    scene.probe.nodes = nodes.length;
    scene.probe.edges = edges.length;
  });
  return scene;
}
