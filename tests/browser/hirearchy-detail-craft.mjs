import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
);
const base = process.argv[2] || 'http://127.0.0.1:3105';
const output = 'docs/design/screenshots/common-thread-details';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium-browser',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const overlaps = (a, b) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;
// Marketing routes set `scroll-behavior: smooth`, so a fragment jump or an
// autoscrolled action can still be animating when a locator hovers. The cursor
// then stays at a fixed viewport point while content slides underneath it and
// :hover is dropped mid-transition, so a fixed sleep races the 180ms background
// transition. Settle the scroll, then poll for the settled color and assert it.
const hoverSettledBackground = async (page, locator, expected) => {
  let last = null;
  for (let i = 0; i < 30; i++) {
    const y = await page.evaluate(() => scrollY);
    if (y === last) break;
    last = y;
    await page.waitForTimeout(100);
  }
  await locator.hover();
  let actual = '';
  for (let i = 0; i < 20; i++) {
    actual = await locator.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    if (actual === expected) return actual;
    await page.waitForTimeout(50);
  }
  return actual;
};
const reports = [];
try {
  for (const [width, height] of [
    [3840, 2160],
    [2560, 1080],
    [1920, 1080],
    [1440, 900],
    [1366, 768],
    [1280, 720],
    [768, 1024],
    [390, 844],
    [320, 568],
    [390, 480],
    [844, 390],
    [667, 375],
    [568, 320],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: 'reduce',
    });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('.ct-page-navigator').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const hero = await page.locator('.ct-hero').boundingBox();
    assert.equal(hero.y, 0);
    assert.equal(hero.height, height);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      width,
    );
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollbarWidth,
      ),
      'none',
    );
    const header = await page.locator('.ct-header').boundingBox();
    const copy = await page.locator('.ct-hero-copy').boundingBox();
    assert.ok(
      !overlaps(header, copy),
      `header/copy overlap ${width}x${height}`,
    );
    const copyText = await page.locator('.ct-hero-copy').evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const rects = [];
      while (walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        rects.push(
          ...Array.from(range.getClientRects(), (rect) => ({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          })),
        );
      }
      return rects;
    });
    const navigator = await page.locator('.ct-page-navigator').boundingBox();
    const cards = await page.locator('.ct-destination').all();
    for (const card of cards) {
      const box = await card.boundingBox();
      assert.ok(
        box.y + box.height <= height && box.x + box.width <= width,
        `card outside hero ${width}x${height}`,
      );
      assert.ok(
        !copyText.some((rect) => overlaps(rect, box)),
        `copy/card overlap ${width}x${height}`,
      );
      assert.ok(
        !overlaps(navigator, box),
        `navigator/card overlap ${width}x${height}`,
      );
      for (const child of await card.locator('strong, .ct-symbol').all()) {
        const inside = await child.boundingBox();
        assert.ok(
          inside.x >= box.x &&
            inside.x + inside.width <= box.x + box.width + 1 &&
            inside.y >= box.y &&
            inside.y + inside.height <= box.y + box.height + 1,
          `card content outside bounds ${width}x${height}`,
        );
      }
    }
    const cue = page.locator('.ct-scroll-cue');
    if (await cue.isVisible())
      assert.ok(
        !overlaps(await cue.boundingBox(), navigator),
        `cue/navigator overlap ${width}x${height}`,
      );
    await page.screenshot({ path: `${output}/hero-${width}-${height}.png` });
    reports.push({
      width,
      height,
      heroFits: true,
      overflow: false,
      overlaps: false,
    });
    console.log('PASS hero', width, height);
    await page.close();
  }
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'no-preference',
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2800);
  for (const [type, part] of [
    ['software', '.ct-code-left'],
    ['it', '.ct-network-trace'],
    ['marketing', '.ct-campaign-wave'],
  ]) {
    const card = page.locator(`.ct-destination--${type}`);
    const before = await card.boundingBox();
    const color = await card.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    await card.hover();
    assert.notEqual(
      await card
        .locator(part)
        .evaluate((el) => getComputedStyle(el).animationName),
      'none',
    );
    await page.waitForTimeout(300);
    assert.equal(
      await card.evaluate((el) => getComputedStyle(el).backgroundColor),
      color,
    );
    assert.deepEqual(await card.boundingBox(), before);
    assert.equal(
      await card
        .locator('.ct-product-caption > span + span')
        .evaluate((el) => getComputedStyle(el).transform),
      'matrix(1, 0, 0, 1, 0, 0)',
    );
  }
  assert.equal(
    await hoverSettledBackground(
      page,
      page.locator('.ct-start'),
      'rgb(255, 155, 136)',
    ),
    'rgb(255, 155, 136)',
  );
  await page.mouse.wheel(0, 900);
  await page.waitForFunction(() => scrollY > 500);
  const summary = page.locator('.ct-page-navigator summary');
  await summary.click();
  await page
    .getByRole('navigation', { name: 'On this page' })
    .getByRole('link', { name: 'The family' })
    .click();
  await page.waitForFunction(
    () =>
      Math.abs(document.getElementById('family').getBoundingClientRect().top) <
      2,
  );
  assert.equal(await page.locator(':focus').getAttribute('id'), 'family');
  assert.equal(
    await page.locator('.ct-page-navigator details').getAttribute('open'),
    null,
  );
  assert.match(await summary.getAttribute('aria-label'), /The family/);
  assert.ok(
    Number(
      await page
        .locator('.ct-page-navigator')
        .evaluate((el) => el.style.getPropertyValue('--page-progress')),
    ) > 0,
  );
  await summary.click();
  await page.keyboard.press('Escape');
  assert.equal(
    await page.locator('.ct-page-navigator details').getAttribute('open'),
    null,
  );
  assert.equal(
    await summary.evaluate((el) => el === document.activeElement),
    true,
  );
  await summary.click();
  await page.locator('#family-heading').click();
  assert.equal(
    await page.locator('.ct-page-navigator details').getAttribute('open'),
    null,
  );
  await page.locator('.ct-next-chapter').click();
  await page.waitForFunction(
    () =>
      Math.abs(
        document.getElementById('philosophy').getBoundingClientRect().top,
      ) < 2,
  );
  await page.keyboard.press('Home');
  await page.keyboard.press('Control+Home');
  await page.waitForFunction(() => scrollY === 0);
  await summary.click();
  await page.screenshot({ path: `${output}/section-menu.png` });
  // Navigate through Next's client router, rebuilding section labels for the next page.
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Products', exact: true })
    .click();
  await page.waitForURL('**/products');
  await page.waitForFunction(() =>
    document
      .querySelector('.ct-page-navigator summary')
      ?.getAttribute('aria-label')
      ?.includes('One principle. Different kinds of work.'),
  );
  await page.goto(base + '/contact', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.waitForFunction(
    () => document.activeElement?.id === 'contact-name',
  );
  assert.match(await page.locator('#error-name').innerText(), /Please enter/);
  assert.equal(
    await page.locator('#contact-name').getAttribute('aria-invalid'),
    'true',
  );
  await page.locator('#contact-name').fill('Synthetic QA');
  assert.equal(await page.locator('#error-name').count(), 0);
  await page.locator('#contact-email').fill('invalid');
  await page.locator('#contact-email').blur();
  assert.match(await page.locator('#error-email').innerText(), /valid email/);
  await page.locator('#contact-email').fill('qa@example.com');
  await page.getByText('General question', { exact: true }).click();
  assert.equal(
    await page.locator('input[name=topic]:checked').inputValue(),
    'General question',
  );
  await page.locator('#contact-topic-2').focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal(
    await page.locator('input[name=topic]:checked').inputValue(),
    'Another discipline',
  );
  await page.locator('#contact-message').fill('Short');
  await page.locator('#contact-message').blur();
  assert.match(await page.locator('#error-message').innerText(), /at least 10/);
  await page
    .locator('#contact-message')
    .fill('Synthetic QA with enough detail.');
  const send = page.getByRole('button', { name: 'Send message' });
  assert.equal(
    await hoverSettledBackground(page, send, 'rgb(255, 155, 136)'),
    'rgb(255, 155, 136)',
  );
  await page.locator('#contact-name').focus();
  await page.screenshot({
    path: `${output}/contact-focus.png`,
    fullPage: true,
  });
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  const violations = await page.evaluate(async () =>
    (
      await window.axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
        },
      })
    ).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  );
  assert.deepEqual(violations, []);
  await page.goto(base + '/evaluator', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.ct-page-navigator').count(), 0);
  assert.notEqual(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollbarWidth,
    ),
    'none',
  );
  await page.close();
  const staticPage = await browser.newPage({ javaScriptEnabled: false });
  await staticPage.goto(base, { waitUntil: 'networkidle' });
  assert.equal(await staticPage.locator('.ct-page-navigator').count(), 0);
  assert.notEqual(
    await staticPage.evaluate(
      () => getComputedStyle(document.documentElement).scrollbarWidth,
    ),
    'none',
  );
  await staticPage.goto(base + '/contact', { waitUntil: 'networkidle' });
  assert.equal(
    await staticPage.locator('form').evaluate((el) => el.noValidate),
    false,
  );
  await staticPage.close();
  await writeFile(
    `${output}/checks.json`,
    JSON.stringify(
      {
        viewports: reports,
        navigation: true,
        productMotion: true,
        productColorsPreserved: true,
        formStates: true,
        noJavaScriptFallback: true,
        axeViolations: 0,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'PASS section navigation, keyboard, product motion/colors, form states, accessibility, product isolation and no-JavaScript fallback',
  );
} finally {
  await browser.close();
}
