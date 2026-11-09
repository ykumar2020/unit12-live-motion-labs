<script>
  import { onMount, untrack } from 'svelte';
  import { watchLive } from './shared/sources.js';
  import { draw } from './shared/lab.js';
  let chart = $state(null),
    packet = $state(null),
    minimum = $state(3),
    error = $state('');
  onMount(() =>
    watchLive(
      'earthquakes',
      (p) => {
        packet = p;
        error = '';
      },
      (e) => {
        packet = null;
        error = e.message;
      },
    ),
  );
  $effect(() => {
    const p = packet,
      min = Number(minimum),
      node = chart;
    if (node && p) {
      const shown = p.rows.filter((q) => q.x >= min);
      untrack(() =>
        draw(node, p, shown, {
          kind: 'bar',
          bins: true,
          unit: 'magnitude',
          title: 'USGS magnitude distribution',
          filters: { minimumMagnitude: min },
          limitation:
            'Each half-open bin [a,b) includes a and excludes b. Zero counts ' +
            'indicate no selected events in that interval, not missing ' +
            'measurements. Thresholded weekly events are not all global ' +
            'earthquake activity.',
        }),
      );
    }
  });
</script>

<div class="controls">
  <label
    >Minimum magnitude: {minimum}<input
      id="primary-control"
      aria-label="Minimum magnitude"
      type="range"
      min="2.5"
      max="9"
      step=".5"
      bind:value={minimum}
    /></label
  >
</div>
{#if error}<p role="alert" class="error">{error}</p>{:else}<p role="status">
    {packet
      ? `${packet.rows.filter((q) => q.x >= Number(minimum)).length} of ${packet.rows.length} earthquakes selected`
      : 'Loading USGS data…'}
  </p>{/if}
<section class="chart-card">
  <h2>Seismic particle sculpture</h2>
  <div bind:this={chart} class="chart"></div>
</section>
