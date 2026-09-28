import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:3101';
const outputDir = 'docs/design/screenshots/final-scene-01-02';
await mkdir(outputDir, { recursive: true });

const port = 9328;
const profile = `/tmp/d1b-chromium-final-${process.pid}`;
const browser = spawn(
  '/usr/bin/chromium-browser',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--blink-settings=availablePointerTypes=4,primaryPointerType=4,availableHoverTypes=2,primaryHoverType=2',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

try {
  let page;
  for (let attempt = 0; attempt < 50; attempt += 1) {
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

  const screenshot = async (filename, full = false) => {
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: full,
    });
    await writeFile(
      `${outputDir}/${filename}`,
      Buffer.from(result.data, 'base64'),
    );
    console.log(`Saved screenshot: ${outputDir}/${filename}`);
  };

  await send('Page.enable');
  await send('Runtime.enable');

  // 1. Desktop 1440x900 no-preference
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: 'no-preference' },
      { name: 'pointer', value: 'fine' },
    ],
  });
  await send('Page.navigate', { url });

  for (let attempt = 0; attempt < 100; attempt++) {
    if (
      await evaluate(
        `document.querySelector('.hirearchy-hero-motion')?.hasAttribute('data-enhanced') && [...document.images].every(i => i.complete && i.naturalWidth > 0)`,
      )
    )
      break;
    await wait(100);
  }
  await evaluate('document.fonts.ready.then(() => true)');
  await wait(250);

  // A. Arrival (p = 0.00)
  await evaluate('window.scrollTo(0, 0); true');
  await wait(200);
  await screenshot('hero-1440-arrival.png');

  // B. Separation (p = 0.30)
  await evaluate(
    `window.scrollTo(0, document.querySelector('.hirearchy-hero-motion').getBoundingClientRect().top + scrollY + innerHeight * 1.5 * 0.3); true`,
  );
  await wait(200);
  await screenshot('hero-1440-separation.png');

  // C. Context Formation (p = 0.60)
  await evaluate(
    `window.scrollTo(0, document.querySelector('.hirearchy-hero-motion').getBoundingClientRect().top + scrollY + innerHeight * 1.5 * 0.6); true`,
  );
  await wait(200);
  await screenshot('hero-1440-context.png');

  // D. Scene 02 handoff/opening (p = 0.90)
  await evaluate(
    `window.scrollTo(0, document.querySelector('.hirearchy-hero-motion').getBoundingClientRect().top + scrollY + innerHeight * 1.5 * 0.9); true`,
  );
  await wait(200);
  await screenshot('scene02-1440-handoff.png');

  // Also Scene 02 full view
  await evaluate(
    "document.querySelector('#philosophy').scrollIntoView(); true",
  );
  await wait(200);
  await screenshot('scene02-1440.png');

  // 2. Laptop 1280x800
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url });
  await wait(300);
  await evaluate('window.scrollTo(0, 0); true');
  await wait(200);
  await screenshot('hero-1280.png');

  // 3. Mobile 390x844
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: 'no-preference' },
      { name: 'pointer', value: 'coarse' },
    ],
  });
  await send('Page.navigate', { url });
  await wait(300);
  await evaluate('window.scrollTo(0, 0); true');
  await wait(200);
  await screenshot('hero-mobile-390.png');

  // Mobile Scene 02
  await evaluate(
    "document.querySelector('#philosophy').scrollIntoView(); true",
  );
  await wait(200);
  await screenshot('scene02-mobile-390.png');

  // 4. Reduced motion 1440x900
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: 'reduce' },
      { name: 'pointer', value: 'fine' },
    ],
  });
  await send('Page.navigate', { url });
  await wait(300);
  await evaluate('window.scrollTo(0, 0); true');
  await wait(200);
  await screenshot('hero-reduced-motion-1440.png');

  // 5. Contact Sheet Generation
  const contactSheetHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Hirearchy Scene 01/02 Choreography Contact Sheet</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #e9e4d8;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 40px;
      color: #161513;
    }
    header {
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px solid #d4cebf;
      padding-bottom: 20px;
    }
    h1 { font-size: 28px; font-weight: 600; letter-spacing: -0.02em; }
    .subtitle { color: #5c5950; font-size: 16px; margin-top: 6px; }
    .meta { font-family: monospace; font-size: 13px; color: #7a756b; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    .card {
      background: #faf8f4;
      border: 1px solid #d4cebf;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e5dfd3;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f4f1ea;
    }
    .phase-badge {
      font-family: monospace;
      font-size: 12px;
      font-weight: 600;
      color: #9e4328;
      letter-spacing: 0.08em;
    }
    .phase-name {
      font-size: 15px;
      font-weight: 600;
      color: #161513;
    }
    .phase-progress {
      font-family: monospace;
      font-size: 12px;
      color: #7a756b;
    }
    .card img {
      width: 100%;
      height: auto;
      display: block;
    }
    .card-footer {
      padding: 12px 20px;
      font-size: 13px;
      color: #5c5950;
      line-height: 1.4;
      background: #faf8f4;
      border-top: 1px solid #f0ece3;
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Hirearchy — Scene 01/02 Chronological Choreography</h1>
      <p class="subtitle">Deterministic native scroll progression states captured at 1440 × 900</p>
    </div>
    <div class="meta">Synco / Delimit · Feature: d1b-frontend-craft</div>
  </header>
  <div class="grid">
    <div class="card">
      <div class="card-header">
        <span class="phase-badge">STAGE A</span>
        <span class="phase-name">Arrival · Compressed Fragment State</span>
        <span class="phase-progress">p = 0.00</span>
      </div>
      <img src="hero-1440-arrival.png" alt="Arrival state">
      <div class="card-footer">Initial viewport arrival: dense strata cluster (rx:18°, ry:-15°, z:-60px), left editorial column crisp.</div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="phase-badge">STAGE B</span>
        <span class="phase-name">Strata Separation</span>
        <span class="phase-progress">p = 0.30</span>
      </div>
      <img src="hero-1440-separation.png" alt="Separation state">
      <div class="card-footer">Layers fan out along Z-axis (translateZ: 0px, scale: 0.98), revealing file tree and emerging evidence chips.</div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="phase-badge">STAGE C</span>
        <span class="phase-name">Context Formation · Peak Clarity</span>
        <span class="phase-progress">p = 0.60</span>
      </div>
      <img src="hero-1440-context.png" alt="Context formation state">
      <div class="card-footer">Nominal resting position (rx:8°, ry:-4°, z:+20px, scale: 1.00), chips fully illuminated, active cursor parallax.</div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="phase-badge">STAGE D</span>
        <span class="phase-name">Scene 02 Handoff &amp; Opening</span>
        <span class="phase-progress">p = 0.90</span>
      </div>
      <img src="scene02-1440-handoff.png" alt="Scene 02 handoff state">
      <div class="card-footer">Hero flattens and translates right (+140px, opacity: 0.15); Scene 02 emerges seamlessly at viewport bottom.</div>
    </div>
  </div>
</body>
</html>`;

  const contactSheetPath = resolve(outputDir, 'contact-sheet.html');
  await writeFile(contactSheetPath, contactSheetHtml, 'utf8');

  // 6. Reference Comparison HTML
  const referenceComparisonHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Hirearchy — Reference Direction vs Implemented Slice</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f4f1ea;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 36px 40px;
      color: #161513;
    }
    header {
      margin-bottom: 28px;
      border-bottom: 1px solid #d4cebf;
      padding-bottom: 16px;
    }
    h1 { font-size: 26px; font-weight: 600; margin-bottom: 6px; }
    p { font-size: 15px; color: #5c5950; }
    .grid {
      display: grid;
      grid-template-columns: 1440px 1440px;
      gap: 32px;
    }
    .panel {
      background: #faf8f4;
      border: 1px solid #d4cebf;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    }
    .panel-header {
      padding: 14px 20px;
      font-weight: 600;
      font-size: 14px;
      background: #ede8dd;
      border-bottom: 1px solid #d4cebf;
      display: flex;
      justify-content: space-between;
    }
    .reference-crop {
      width: 1440px;
      aspect-ratio: 971 / 504;
      overflow: hidden;
    }
    .reference-crop img {
      width: calc(1440px * 1536 / 971);
      max-width: none;
      display: block;
    }
    .implementation-view img {
      width: 1440px;
      display: block;
    }
  </style>
</head>
<body>
  <header>
    <h1>Hirearchy Opening — Side-by-Side Reference Comparison</h1>
    <p>Left: Approved Reference Direction (Top-Left Hero Panel) · Right: Implemented Production Slice (1440 × 900 Resolved)</p>
  </header>
  <div class="grid">
    <div class="panel">
      <div class="panel-header">
        <span>APPROVED REFERENCE DIRECTION (hirearchy-website-direction-v1.png)</span>
        <span>Original Concept</span>
      </div>
      <div class="reference-crop">
        <img src="../../references/hirearchy-website-direction-v1.png" alt="Approved Reference Direction">
      </div>
    </div>
    <div class="panel">
      <div class="panel-header">
        <span>IMPLEMENTED PRODUCTION SLICE (1440 × 900)</span>
        <span>Browser Rendered</span>
      </div>
      <div class="implementation-view">
        <img src="hero-reduced-motion-1440.png" alt="Implemented Slice">
      </div>
    </div>
  </div>
</body>
</html>`;

  const referenceComparisonPath = resolve(
    outputDir,
    'reference-comparison.html',
  );
  await writeFile(referenceComparisonPath, referenceComparisonHtml, 'utf8');

  // Screenshot Reference Comparison
  await send('Emulation.setDeviceMetricsOverride', {
    width: 2980,
    height: 1060,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: `file://${referenceComparisonPath}` });
  await wait(500);
  await screenshot('hero-reference-comparison.png');

  // Screenshot Contact Sheet
  await send('Emulation.setDeviceMetricsOverride', {
    width: 2980,
    height: 1980,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: `file://${contactSheetPath}` });
  await wait(500);
  await screenshot('hero-contact-sheet.png');

  console.log('All screenshots and comparisons generated successfully.');
  socket.close();
} finally {
  browser.kill('SIGTERM');
}
