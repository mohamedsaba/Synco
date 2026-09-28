import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';

// Usage: node tests/browser/shot.mjs <url> <outputDir> [prefix]
const url = process.argv[2] || 'http://127.0.0.1:3102';
const outputDir = process.argv[3] || '/tmp/d1b-shots';
const prefix = process.argv[4] || 'shot';
await mkdir(outputDir, { recursive: true });

const port = 9400 + Math.floor(Math.random() * 300);
const profile = `/tmp/d1b-chromium-shot-${process.pid}`;
const browser = spawn(
  '/usr/bin/chromium-browser',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--force-color-profile=srgb',
    '--blink-settings=availablePointerTypes=4,primaryPointerType=4,availableHoverTypes=2,primaryHoverType=2',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  let page;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(
        (r) => r.json(),
      );
      page = targets.find((t) => t.type === 'page');
      if (page) break;
    } catch {}
    await wait(100);
  }
  if (!page) throw new Error('Chromium DevTools endpoint unavailable');

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    socket.addEventListener('open', res, { once: true });
    socket.addEventListener('error', rej, { once: true });
  });

  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve: reqResolve, reject: reqReject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reqReject(new Error(message.error.message));
    else reqResolve(message.result);
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails)
      throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };

  const screenshot = async (name) => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(
      `${outputDir}/${prefix}-${name}.png`,
      Buffer.from(result.data, 'base64'),
    );
    console.log(`${outputDir}/${prefix}-${name}.png`);
  };

  const settle = async () => {
    for (let a = 0; a < 120; a += 1) {
      const ok = await evaluate(
        `[...document.images].every(i => i.complete && i.naturalWidth > 0) && !!document.querySelector('.hirearchy-workbench')`,
      );
      if (ok) break;
      await wait(100);
    }
    await evaluate('document.fonts.ready.then(() => true)');
    await wait(400);
  };

  const viewport = async (width, height, mobile) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  };

  const motion = async (value) => {
    await send('Emulation.setEmulatedMedia', {
      features: value
        ? [
            { name: 'prefers-reduced-motion', value },
            { name: 'pointer', value: 'fine' },
          ]
        : [
            { name: 'prefers-reduced-motion', value: 'no-preference' },
            { name: 'pointer', value: 'fine' },
          ],
    });
  };

  const progress = (p) =>
    `(() => { const r = document.querySelector('.hirearchy-hero-motion'); if(!r) return 0; const rect = r.getBoundingClientRect(); const range = Math.max(1, r.offsetHeight - innerHeight); return window.scrollTo(0, rect.top + scrollY + range * ${p}); return 1; })()`;

  await send('Page.enable');
  await send('Runtime.enable');

  // ---- Desktop 1440x900 ----
  await viewport(1440, 900, false);
  await motion('no-preference');
  await send('Page.navigate', { url });
  await settle();
  await evaluate('window.scrollTo(0,0); 1');
  await wait(300);
  await screenshot('1440-arrival');

  for (const [name, p] of [
    ['1440-investigation', 0.27],
    ['1440-revision', 0.45],
    ['1440-verification', 0.63],
    ['1440-outcome', 0.8],
  ]) {
    await evaluate(progress(p));
    await wait(320);
    await screenshot(name);
  }

  // Scene 02 settled
  await evaluate(
    `(() => { const s = document.querySelector('[data-scene="02"]'); if (s) window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 40); return 1; })()`,
  );
  await wait(400);
  await screenshot('1440-scene02');

  // ---- 970x497: 1:1 with the hero tile of the reference contact sheet ----
  await viewport(970, 497, false);
  await send('Page.navigate', { url });
  await settle();
  await evaluate('window.scrollTo(0,0); 1');
  await wait(300);
  await screenshot('970-hero');

  // ---- 1280x800 ----
  await viewport(1280, 800, false);
  await send('Page.navigate', { url });
  await settle();
  await evaluate('window.scrollTo(0,0); 1');
  await wait(300);
  await screenshot('1280-arrival');

  // ---- Reduced motion 1440 ----
  await viewport(1440, 900, false);
  await motion('reduce');
  await send('Page.navigate', { url });
  await settle();
  await evaluate('window.scrollTo(0,0); 1');
  await wait(300);
  await screenshot('1440-reduced');

  // ---- Mobile 390x844 ----
  await viewport(390, 844, true);
  await motion('no-preference');
  await send('Page.navigate', { url });
  await settle();
  await evaluate('window.scrollTo(0,0); 1');
  await wait(300);
  await screenshot('390-hero');

  await evaluate(
    `(() => { const s = document.querySelector('[data-scene="02"]'); if (s) window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 20); return 1; })()`,
  );
  await wait(400);
  await screenshot('390-scene02');

  // ---- Overflow / a11y probes ----
  await viewport(1440, 900, false);
  await send('Page.navigate', { url });
  await settle();
  const probe = await evaluate(`(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    bodyScrollW: document.body.scrollWidth,
  }))()`);
  console.log('OVERFLOW_PROBE ' + JSON.stringify(probe));
} finally {
  browser.kill('SIGKILL');
  // tmpfs here is quota-bound; leaked chromium profiles fill it fast.
  await wait(300);
  await rm(profile, { recursive: true, force: true });
}
