import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Use an available Playwright installation; no application dependency is needed.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : 'playwright'
);
const base = process.argv[2] || 'http://127.0.0.1:3102';
const output = 'docs/design/screenshots/common-thread';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const reports = [];
const routes = [
  '/',
  '/products',
  '/products/software',
  '/thinking',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
];
try {
  for (const [width, height, motion] of [
    [1440, 900, 'reduce'],
    [1280, 800, 'no-preference'],
    [390, 844, 'reduce'],
    [390, 844, 'no-preference'],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: motion,
    });
    for (const route of motion === 'reduce' ? routes : ['/']) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const response = await page.goto(base + route, {
        waitUntil: 'networkidle',
      });
      assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `overflow: ${width} ${route}`,
      );
      for (const section of await page.locator('.ct-reveal').all()) {
        await section.scrollIntoViewIfNeeded();
        if (motion !== 'reduce') await page.waitForTimeout(2800);
        for (const element of await section.locator('.ct-enter').all())
          assert.equal(
            await element.evaluate((el) => getComputedStyle(el).opacity),
            '1',
          );
      }
      if (motion === 'reduce')
        assert.equal(
          await page
            .locator('.ct-thread')
            .evaluateAll((paths) =>
              paths.every(
                (el) => getComputedStyle(el).animationName === 'none',
              ),
            ),
          true,
        );
      await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
      const axe = await page.evaluate(async () => {
        const result = await window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
          },
        });
        return result.violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
          details: v.nodes.map((n) => n.failureSummary),
        }));
      });
      assert.deepEqual(axe, [], `accessibility: ${width} ${route}`);
      assert.deepEqual(errors, []);
      await page.evaluate(() => scrollTo(0, 0));
      const name = `${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}-${width}-${motion}`;
      await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
      reports.push({
        route,
        width,
        height,
        motion,
        axeViolations: axe.length,
        overflow: false,
        errors,
      });
      await writeFile(
        `${output}/checks.json`,
        JSON.stringify(reports, null, 2) + '\n',
      );
      console.log('PASS', name);
      await page.close();
    }
    await context.close();
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(base + '/contact?topic=software', {
    waitUntil: 'networkidle',
  });
  assert.equal(
    await page.locator('input[name=topic]:checked').inputValue(),
    'Hirearchy Software',
  );
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').innerText(), 'Skip to content');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => location.hash), '#main');
  await page.getByRole('button', { name: 'Send message' }).click();
  assert.equal(
    await page
      .locator('#contact-name')
      .evaluate((el) => el.validity.valueMissing),
    true,
  );
  await page.locator('#contact-name').fill('Synthetic QA');
  await page.locator('#contact-email').fill('invalid');
  assert.equal(
    await page
      .locator('#contact-email')
      .evaluate((el) => el.validity.typeMismatch),
    true,
  );
  await page.locator('#contact-email').fill('qa@example.com');
  await page
    .locator('#contact-message')
    .fill('Synthetic browser check, no external delivery.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.locator('.ct-form-error').waitFor();
  assert.match(
    await page.locator('.ct-form-error').innerText(),
    /has not been sent/,
  );
  assert.equal(
    await page.locator('#contact-message').inputValue(),
    'Synthetic browser check, no external delivery.',
  );
  assert.equal(await page.locator(':focus').getAttribute('role'), 'alert');
  // UI-only success test, with a stubbed response; this proves no real delivery.
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await page.getByRole('button', { name: 'Send message' }).click();
  await page
    .getByText('Your message has been sent.', { exact: true })
    .waitFor();
  await page.getByRole('button', { name: 'Send another message' }).click();
  assert.equal(await page.locator('#contact-message').inputValue(), '');
  await context.close();
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const staticPage = await nojs.newPage();
  await staticPage.goto(base, { waitUntil: 'networkidle' });
  assert.equal(await staticPage.locator('h1').isVisible(), true);
  assert.equal(
    await staticPage
      .locator('#family-heading')
      .evaluate((el) => getComputedStyle(el).opacity),
    '1',
  );
  await nojs.close();
  console.log(
    'PASS contact validation, failure retention, keyboard, stubbed success and no-JavaScript content',
  );
} finally {
  await browser.close();
}
