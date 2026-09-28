// Capture each reference scene by id so tiles can be diffed against the board.
// Usage: node tests/browser/scenes.mjs <url> <outDir> <prefix>
const url = process.argv[2] ?? 'http://127.0.0.1:3102';
const outDir = process.argv[3] ?? 'docs/design/screenshots/scenes';
const prefix = process.argv[4] ?? 's';
const width = Number(process.argv[5] ?? 1440);
const height = Number(process.argv[6] ?? 900);

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync(outDir, { recursive: true });
const profile = `/tmp/hirearchy-scenes-${process.pid}`;
const port = 9333 + (process.pid % 200);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn('/usr/bin/chromium-browser', [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--disable-dev-shm-usage',
  `--window-size=${width},${height}`,
  'about:blank',
]);

// Page.* only exists on a page target, not the browser endpoint.
let page = null;
for (let i = 0; i < 60 && !page; i++) {
  await sleep(250);
  try {
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(
      (r) => r.json(),
    );
    page = targets.find((t) => t.type === 'page');
  } catch {}
}
if (!page) throw new Error('chromium page target never came up');

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let seq = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) {
      reject(new Error(JSON.stringify(msg.error)));
    } else {
      resolve(msg.result);
    }
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return r.result?.value;
};

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url });
  await sleep(2500);

  const scenes = await evaluate(`
    JSON.stringify(
      Array.from(document.querySelectorAll('section[data-scene]')).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          scene: el.dataset.scene,
          id: el.id,
          top: Math.round(r.top + window.scrollY),
          height: Math.round(r.height),
        };
      })
    )
  `);
  const list = JSON.parse(scenes ?? '[]');

  const probe = await evaluate(
    `JSON.stringify({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, pageH: document.documentElement.scrollHeight })`,
  );

  for (const s of list) {
    await evaluate(`window.scrollTo(0, ${s.top}); 1`);
    await sleep(450);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const name = `${prefix}-scene${s.scene}-${s.id}.png`;
    writeFileSync(join(outDir, name), Buffer.from(shot.data, 'base64'));
    console.log(name, `${s.width ?? ''}`.slice(0, 0) + `${s.height}px tall`);
  }

  console.log('SCENES', scenes);
  console.log('PROBE', probe);
} finally {
  try {
    ws.close();
  } catch {}
  child.kill('SIGKILL');
  await sleep(400);
  rmSync(profile, { recursive: true, force: true });
}
