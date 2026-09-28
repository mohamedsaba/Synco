// Raw-CDP capture of the Hirearchy "Ledger" page by section id.
//   node tests/browser/lease.mjs <url> <outDir> <prefix> [width] [height]
// Chromium only; no playwright in this repo.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.argv[2] ?? 'http://127.0.0.1:3102';
const outDir = process.argv[3] ?? 'docs/design/screenshots/lease';
const prefix = process.argv[4] ?? 'L';
const W = Number(process.argv[5] ?? 1440);
const H = Number(process.argv[6] ?? 900);

const SECTIONS = [
  'who',
  'work',
  'clients',
  'services',
  'testimonials',
  'faq',
  'contact',
];
const profile = join(tmpdir(), `hirearchy-lease-${process.pid}`);
const PORT = 9331 + (process.pid % 400);
mkdirSync(outDir, { recursive: true });
mkdirSync(profile, { recursive: true });

const chrome = spawn(
  '/usr/bin/chromium-browser',
  [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${W},${H}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function socket() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (
        await fetch(`http://127.0.0.1:${PORT}/json/list`)
      ).json();
      const page = list.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('devtools endpoint never became ready');
}

let ws;
let seq = 0;
const pending = new Map();

function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result?.value;
}

async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(
    join(outDir, `${prefix}-${name}.png`),
    Buffer.from(r.data, 'base64'),
  );
  console.log(join(outDir, `${prefix}-${name}.png`));
}

try {
  ws = new WebSocket(await socket());
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: W,
    height: H,
    deviceScaleFactor: 1,
    mobile: W < 768,
  });

  await send('Page.navigate', { url });
  await sleep(2600);
  await evaluate('window.scrollTo(0,0); 1');
  await sleep(700);
  await shot('hero');

  const inventory = await evaluate(`JSON.stringify(
    ${JSON.stringify(SECTIONS)}.map((id) => {
      const el = document.getElementById(id);
      if (!el) return { id, missing: true };
      const r = el.getBoundingClientRect();
      return { id, top: Math.round(r.top + scrollY), height: Math.round(r.height) };
    })
  )`);
  console.log('SECTIONS', inventory);

  for (const s of JSON.parse(inventory).filter((x) => !x.missing)) {
    await evaluate(`window.scrollTo(0, ${s.top}); 1`);
    await sleep(650);
    await shot(s.id);
  }

  const probe = await evaluate(
    'JSON.stringify({scrollW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth,pageH:document.documentElement.scrollHeight})',
  );
  console.log('PROBE', probe);
} finally {
  try {
    ws?.close();
  } catch {}
  chrome.kill('SIGKILL');
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
