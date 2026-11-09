<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { watchLive, recentYears } from './shared/sources.js';
import { draw } from './shared/lab.js';
const chart = ref(null),
  packet = ref(null),
  years = ref(25),
  metric = ref('population'),
  error = ref(''),
  loading = ref(true);
let stop;
function load() {
  stop?.();
  packet.value = null;
  loading.value = true;
  error.value = '';
  chart.value?.replaceChildren();
  stop = watchLive(
    metric.value,
    (p) => {
      packet.value = p;
      loading.value = false;
    },
    (e) => {
      packet.value = null;
      loading.value = false;
      error.value = e.message;
    },
  );
}
function redraw() {
  if (!chart.value || !packet.value) return;
  const shown = recentYears(packet.value, years.value);
  draw(chart.value, packet.value, shown, {
    kind: 'line',
    title:
      metric.value === 'population' ? 'U.S. population by year' : 'U.S. real GDP growth',
    filters: { lastYears: years.value, metric: metric.value },
    limitation:
      'Missing years are omitted, not zero-filled. This chart describes the ' +
      'six selected countries; the line may use a nonzero vertical origin. ' +
      'Forecasts and causal stories are not implied.',
  });
}
onMounted(load);
onBeforeUnmount(() => stop?.());
watch(metric, load);
watch([packet, years], redraw, { flush: 'post' });
</script>
<template>
  <div class="controls">
    <label
      >Years displayed: {{ years }}
      <input
        id="primary-control"
        aria-label="Years displayed"
        type="range"
        min="10"
        max="60"
        step="5"
        v-model.number="years" /></label
    ><label
      >Metric
      <select aria-label="Metric" v-model="metric">
        <option value="population">Population (people)</option>
      </select></label
    >
  </div>
  <p v-if="error" role="alert" class="error">{{ error }}</p>
  <p v-else role="status">
    {{
      loading
        ? 'Loading World Bank data…'
        : `${Math.min(years, packet?.rows.length || 0)} reporting years per available country`
    }}
  </p>
  <section class="chart-card">
    <h2>Population choreography</h2>
    <div ref="chart" class="chart"></div>
  </section>
</template>
