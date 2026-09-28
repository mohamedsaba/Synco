import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
);
const base = process.argv[2] || 'http://127.0.0.1:3104';
const out = 'docs/design/screenshots/common-thread-interactions';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium-browser',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  for (const [width, height] of [
    [2560, 1440],
    [1920, 1080],
    [1440, 900],
    [390, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: 'reduce',
    });
    await page.goto(base, { waitUntil: 'networkidle' });
    const box = await page.locator('.ct-site').boundingBox();
    assert.equal(box.x, 0);
    assert.equal(box.width, width);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      width,
    );
    assert.equal(
      await page.locator('h1').evaluate((el) => getComputedStyle(el).cursor),
      'default',
    );
    assert.equal(
      await page
        .locator('h1')
        .evaluate((el) => getComputedStyle(el).userSelect),
      'none',
    );
    const title = await page.locator('h1').boundingBox();
    await page.mouse.move(title.x + 3, title.y + 15);
    await page.mouse.down();
    await page.mouse.move(
      title.x + title.width - 3,
      title.y + title.height - 5,
      { steps: 8 },
    );
    await page.mouse.up();
    assert.equal(await page.evaluate(() => getSelection().toString()), '');
    const nav = page.locator('.ct-nav a').first();
    const before = await nav.boundingBox();
    await nav.hover();
    assert.equal(
      await nav.evaluate((el) => getComputedStyle(el).textDecorationLine),
      'none',
    );
    assert.equal(
      await nav.evaluate((el) => getComputedStyle(el).cursor),
      'pointer',
    );
    assert.equal(
      await nav.evaluate((el) => getComputedStyle(el, '::before').clipPath),
      'inset(0px round 999px)',
    );
    assert.deepEqual(await nav.boundingBox(), before);
    await page.locator('.ct-wordmark').hover();
    assert.equal(
      await page
        .locator('.ct-wordmark')
        .evaluate((el) => getComputedStyle(el, '::after').opacity),
      '1',
    );
    await page.screenshot({ path: `${out}/full-width-${width}.png` });
    await page.close();
  }
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'no-preference',
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
  const product = page.locator('.ct-destination--software');
  const bounds = await product.boundingBox();
  await product.hover();
  await page.waitForTimeout(300);
  assert.deepEqual(await product.boundingBox(), bounds);
  assert.notEqual(
    await product
      .locator('.ct-arrow')
      .evaluate((el) => getComputedStyle(el).transform),
    'none',
  );
  await page.goto(base + '/contact', { waitUntil: 'networkidle' });
  const input = page.locator('#contact-name');
  await input.fill('Copyable text');
  assert.equal(
    await input.evaluate((el) => getComputedStyle(el).cursor),
    'text',
  );
  assert.equal(
    await input.evaluate((el) => getComputedStyle(el).userSelect),
    'text',
  );
  await input.press('ControlOrMeta+A');
  assert.equal(
    await input.evaluate((el) => el.selectionEnd - el.selectionStart),
    13,
  );
  await page.keyboard.press('Tab');
  assert.equal(
    await page.locator(':focus').getAttribute('id'),
    'contact-email',
  );
  await page.waitForTimeout(300);
  assert.equal(
    await page
      .locator(':focus')
      .evaluate(
        (el) => getComputedStyle(el.closest('.ct-field')).backgroundColor,
      ),
    'rgb(237, 250, 243)',
  );
  assert.equal(
    await page
      .locator(':focus')
      .evaluate(
        (el) =>
          getComputedStyle(
            el.closest('.ct-field').querySelector('.ct-field-underline'),
            '::after',
          ).clipPath,
      ),
    'inset(0px)',
  );
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  const violations = await page.evaluate(async () =>
    (
      await window.axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
        },
      })
    ).violations.map((v) => v.id),
  );
  assert.deepEqual(violations, []);
  console.log(
    'PASS full-width 2560/1920/1440/390, hover, cursor, selection, keyboard, reduced motion and contact axe',
  );
  await page.close();
} finally {
  await browser.close();
}
