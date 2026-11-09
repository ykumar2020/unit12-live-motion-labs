import { test, expect } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const names = [
  'Seismic globe',
  'Population choreography',
  'Forecast wind atelier',
  'The author–work constellation',
  'Natural-event radial atlas',
  'Seismic particle sculpture',
  'Economic phase space',
  'Rainfall observatory',
];
async function open(page, id) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:' + (5280 + id));
  await page.waitForFunction(() => window.__labState?.meta?.mode === 'live', null, {
    timeout: 45000,
  });
  await expect(page.locator('.custom-scene')).toBeVisible();
  return errors;
}
for (let id = 1; id <= 8; id++) {
  test(`lab ${id}: actual live request, custom animated scene, interaction and raw checksum`, async ({
    page,
  }) => {
    await mkdir('evidence/v2/screenshots', { recursive: true });
    const api = page.waitForResponse((r) => r.url().includes('/api/data/'));
    const errors = await open(page, id);
    const response = await api;
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');
    const packet = await response.json();
    expect(packet.meta.mode).toBe('live');
    expect(packet.meta.fetchedAt).toBeTruthy();
    expect(packet.meta.url.startsWith('https://')).toBe(true);
    expect(packet.meta.liveError).toBeUndefined();
    const before = await page.evaluate(() => ({
      probe: { ...window.__vizProbe },
      count: window.__labState.rows.length,
      svg: document.querySelector('.custom-scene').outerHTML,
    }));
    expect(before.count).toBeGreaterThan(0);
    expect(before.probe.kind).toBe(names[id - 1]);
    await expect
      .poll(() => page.evaluate(() => window.__vizProbe.frame))
      .toBeGreaterThan(before.probe.frame + 4);
    await page.screenshot({
      path: `evidence/v2/screenshots/lab-${id}.png`,
      fullPage: true,
    });
    const controls = page.locator('.segmented').first().getByRole('button');
    if ((await controls.count()) > 1) {
      await controls.nth(1).click();
      await expect(controls.nth(1)).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => window.__vizProbe.missions)).toContain(1);
    }
    const timeline = page.locator('.scene-timeline input');
    if (await timeline.count()) {
      await timeline.evaluate((n) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
          n,
          n.max,
        );
        n.dispatchEvent(new Event('input', { bubbles: true }));
      });
      expect(await page.evaluate(() => window.__vizProbe.missions)).toContain(2);
    }
    await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
    const frame = await page.evaluate(() => window.__vizProbe.frame);
    await page.waitForTimeout(350);
    expect(await page.evaluate(() => window.__vizProbe.frame)).toBe(frame);
    await page.getByRole('button', { name: 'Play motion', exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => window.__vizProbe.frame))
      .toBeGreaterThan(frame);
    const bad = await page
      .locator('.custom-scene')
      .evaluate((svg) =>
        [...svg.querySelectorAll('[d],[cx],[cy],[transform]')].some((n) =>
          [...n.attributes].some((a) => /NaN|Infinity/.test(a.value)),
        ),
      );
    expect(bad).toBe(false);
    await page
      .getByText('Inspect the real data / provenance / accessible table', { exact: true })
      .click();
    const download = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Download this live response', exact: true })
      .click();
    const dl = await download;
    const stream = await dl.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    expect(createHash('sha256').update(Buffer.concat(chunks)).digest('hex')).toBe(
      packet.meta.sha256,
    );
    expect(errors).toEqual([]);
    await writeFile(
      `evidence/v2/lab-${id}-proof.json`,
      JSON.stringify(
        {
          id,
          source: packet.meta,
          selectedRecords: before.count,
          scene: before.probe.kind,
          animationFrames: await page.evaluate(() => window.__vizProbe.frame),
          pageErrors: errors,
        },
        null,
        2,
      ),
    );
  });
  test(`lab ${id}: no invented/saved fallback when a live source is unavailable`, async ({
    page,
  }) => {
    await page.route('**/api/data/**', (r) =>
      r.fulfill({
        status: 502,
        json: { error: 'Controlled provider outage. No saved response is substituted.' },
      }),
    );
    await page.goto('http://127.0.0.1:' + (5280 + id));
    await expect(page.locator('#data-badge')).toHaveText('LIVE SOURCE UNAVAILABLE');
    await expect(page.locator('.custom-scene')).toHaveCount(0);
    await expect(page.getByRole('alert')).toContainText('Controlled provider outage');
    expect(await page.evaluate(() => window.__labState)).toBeNull();
  });
  test(`lab ${id}: responsive phone viewport, actual live data and canvas exploration control`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = await open(page, id);
    await expect(page.locator('.mobile-pan')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    await page.getByLabel('Canvas viewport', { exact: true }).evaluate((n) => {
      n.value = '100';
      n.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(
      await page.locator('.scene-surface').evaluate((n) => n.scrollLeft),
    ).toBeGreaterThan(0);
    await page.screenshot({
      path: `evidence/v2/screenshots/mobile-${id}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}
test('retired saved-data requests are rejected', async ({ request }) => {
  const response = await request.get(
    'http://127.0.0.1:5281/api/data/earthquakes?mode=snapshot',
  );
  expect(response.status()).toBe(410);
  expect((await response.json()).error).toContain('removed');
});
test('reduced motion gives a real static scene until explicitly played', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 2);
  expect(await page.evaluate(() => window.__vizProbe.playing)).toBe(false);
  await expect(
    page.getByRole('button', { name: 'Play motion', exact: true }),
  ).toBeVisible();
  expect(await page.locator('.country-body circle').first().getAttribute('r')).not.toBe(
    '0',
  );
});
