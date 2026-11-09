export function element(tag, value, parent) {
  const el = document.createElement(tag);
  el.textContent = String(value);
  parent.append(el);
  return el;
}
export function download(name, value) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(
    new Blob([typeof value === 'string' ? value : JSON.stringify(value, null, 2)], {
      type: 'application/json',
    }),
  );
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export function statistics(rows) {
  const v = rows.map((d) => d.value ?? d.x).filter(Number.isFinite);
  return v.length
    ? {
        count: v.length,
        min: Math.min(...v),
        max: Math.max(...v),
        mean: v.reduce((a, b) => a + b, 0) / v.length,
        sum: v.reduce((a, b) => a + b, 0),
      }
    : { count: 0, min: null, max: null, mean: null, sum: 0 };
}
export function aiPanel(parent, context) {
  const e = element,
    ai = e('section', '', parent);
  ai.className = 'panel';
  e('h2', 'Ask AI about this chart', ai);
  e(
    'p',
    'Generate a prompt from the current selection. Paste it into an approved LLM. This button does not contact a model or use a secret key.',
    ai,
  );
  const button = e('button', 'Generate chart-aware AI prompt', ai);
  button.className = 'primary';
  const area = e('textarea', '', ai);
  area.readOnly = true;
  area.setAttribute('aria-label', 'AI prompt');
  button.onclick = () => {
    area.value =
      'Act as a skeptical data analyst. Use ONLY this chart context: ' +
      JSON.stringify(context) +
      '. State two supported observations, one limitation and one better-view recommendation. Do not invent statistics, events or causal explanations. Distinguish forecasts from observations. Return numerical claims I can check against the selected records.';
  };
  const audit = e('details', '', ai);
  e('summary', 'Verify AI claims (local numerical checks)', audit);
  e(
    'p',
    'Paste each actual model claim in your submission. These controls check only the numerical minimum, maximum or mean, not an entire narrative or causality. Numeric tolerance is max(0.000001, |expected| x 0.00001); check rounded claims at sufficient precision.',
    audit,
  );
  for (let i = 1; i <= 3; i++) {
    const row = e('div', '', audit);
    row.className = 'mode-row audit';
    const label = e('label', `Claim ${i} text `, row),
      claim = e('input', '', label);
    claim.placeholder = 'Paste an actual AI claim';
    claim.setAttribute('aria-label', `Claim ${i}`);
    const metric = e('select', '', row);
    metric.setAttribute('aria-label', `Claim ${i} metric`);
    for (const k of ['min', 'max', 'mean']) {
      const op = e('option', k, metric);
      op.value = k;
    }
    const value = e('input', '', row);
    value.type = 'number';
    value.step = 'any';
    value.setAttribute('aria-label', `Claim ${i} value`);
    const check = e('button', 'Check numerical claim', row),
      result = e('span', 'Unverified', row);
    result.setAttribute('role', 'status');
    check.onclick = () => {
      const expected = context.summary[metric.value],
        n = Number(value.value);
      result.textContent =
        !claim.value.trim() || value.value === '' || expected === null
          ? 'Unverified: enter a real claim and a number.'
          : Math.abs(n - expected) <= Math.max(1e-6, Math.abs(expected) * 1e-5)
            ? 'Correct for this numeric metric.'
            : 'Incorrect for this numeric metric: selected-data value is ' + expected;
    };
  }
}
