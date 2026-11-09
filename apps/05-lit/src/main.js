import { LitElement, html } from 'lit';
import './shared/style.css';
import { watchLive, normalizeEvents } from './shared/sources.js';
import { installShell, draw } from './shared/lab.js';
installShell(5);
class EventChart extends LitElement {
  static properties = {
    packet: { state: true },
    error: { state: true },
    limit: { state: true },
    countMode: { state: true },
  };
  constructor() {
    super();
    this.packet = null;
    this.error = '';
    this.limit = 12;
    this.countMode = 'all';
  }
  // Light DOM shares classroom styles; Lit owns the template, D3 only #chart.
  createRenderRoot() {
    return this;
  }
  firstUpdated() {
    this.stop = watchLive(
      'events',
      (p) => {
        this.packet = p;
        this.error = '';
      },
      (e) => {
        this.packet = null;
        this.error = e.message;
      },
    );
  }
  disconnectedCallback() {
    this.stop?.();
    super.disconnectedCallback();
  }
  updated() {
    if (!this.packet) return;
    const rows = normalizeEvents(this.packet.raw, this.countMode).slice(0, this.limit);
    draw(this.querySelector('#chart'), this.packet, rows, {
      kind: 'bar',
      title: 'NASA EONET event categories',
      filters: { categories: this.limit, countMode: this.countMode },
      limitation: `${this.packet.raw.events.length} unique events were returned by a request capped at 500. Counts are ${this.countMode === 'all' ? 'category memberships, which may exceed the number of events' : 'first-category assignments, one per event'}. The provider is not a complete census of all disasters; a capped response may be incomplete.`,
    });
  }
  render() {
    return html`<div class="controls">
        <label
          >Categories displayed: ${this.limit}<input
            id="primary-control"
            aria-label="Categories displayed"
            type="range"
            min="1"
            max="12"
            step="1"
            .value=${String(this.limit)}
            @input=${(e) => (this.limit = Number(e.target.value))} /></label
        ><label
          >Counting rule
          <select
            aria-label="Counting rule"
            @change=${(e) => (this.countMode = e.target.value)}
          >
            <option value="all">All category memberships</option>
            <option value="first">First category only</option>
          </select></label
        >
      </div>
      ${this.error
        ? html`<p role="alert" class="error">${this.error}</p>`
        : html`<p role="status">
            ${this.packet
              ? `${this.packet.raw.events.length} unique source events`
              : 'Loading NASA EONET data…'}
          </p>`}
      <section class="chart-card">
        <h2>Natural-event radial atlas</h2>
        <div id="chart" class="chart"></div>
      </section>`;
  }
}
customElements.define('event-chart', EventChart);
document.querySelector('#app').append(document.createElement('event-chart'));
