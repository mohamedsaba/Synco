import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { format } from 'prettier';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const url = process.argv[2] || 'http://127.0.0.1:3101';
const output = 'docs/design/screenshots/corrective-scene-01-02';
await mkdir(output, { recursive: true });
const port = 9327;
const profile = `/tmp/d1b-chromium-${process.pid}`;
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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  let page;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(
        (response) => response.json(),
      );
      page = targets.find((target) => target.type === 'page');
      if (page) break;
    } catch {}
    await wait(100);
  }
  if (!page) throw new Error('Chromium DevTools endpoint unavailable');

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
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
  const screenshot = async (name, full = false) => {
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: full,
    });
    await writeFile(
      `${output}/${name}.png`,
      Buffer.from(result.data, 'base64'),
    );
  };
  const key = async (key, code, value) => {
    await send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      text: key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined,
      key,
      code,
      windowsVirtualKeyCode: value,
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code,
      windowsVirtualKeyCode: value,
    });
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    window.openingMetrics = { lcp: 0, cls: 0, longTasks: [], interactions: [] };
    new PerformanceObserver(list => { for (const e of list.getEntries()) window.openingMetrics.lcp = e.startTime; }).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.openingMetrics.cls += e.value; }).observe({type:'layout-shift',buffered:true});
    new PerformanceObserver(list => { for (const e of list.getEntries()) window.openingMetrics.longTasks.push(e.duration); }).observe({type:'longtask',buffered:true});
    new PerformanceObserver(list => { for (const e of list.getEntries()) if (e.interactionId) window.openingMetrics.interactions.push(e.duration); }).observe({type:'event',durationThreshold:16,buffered:true});
  `,
  });
  const axeSource = await readFile('node_modules/axe-core/axe.min.js', 'utf8');
  const reports = [];
  for (const [width, height, motion] of [
    [1440, 900, 'no-preference'],
    [1280, 800, 'no-preference'],
    [390, 844, 'no-preference'],
    [1440, 900, 'reduce'],
  ]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: width < 768 });
    await send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-reduced-motion', value: motion },
        { name: 'pointer', value: width < 768 ? 'coarse' : 'fine' },
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
      if (attempt === 99)
        throw new Error('Page did not hydrate or load its images');
      await wait(100);
    }
    await evaluate('document.fonts.ready.then(() => true)');
    await wait(200);
    const initial = await evaluate(
      `({enhanced:document.querySelector('.hirearchy-hero-motion').dataset.enhanced, phase:document.querySelector('.hirearchy-hero-motion').dataset.phase, pointer:matchMedia('(pointer: fine)').matches, width:innerWidth, overflow:document.documentElement.scrollWidth > innerWidth, headings:[...document.querySelectorAll('h1,h2')].map(x=>x.tagName), hero:document.querySelector('.hirearchy-hero__stage').getBoundingClientRect().toJSON()})`,
    );
    assert.equal(initial.overflow, false);
    assert.deepEqual(initial.headings, ['H1', 'H2']);
    const animated = width >= 768 && motion !== 'reduce';
    assert.equal(initial.enhanced, String(animated), JSON.stringify(initial));
    await screenshot(
      `scene-01-${width}x${height}${motion === 'reduce' ? '-reduced' : ''}`,
    );
    await evaluate(axeSource);
    const axe = await evaluate(
      `axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}).then(r=>({violations:r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))}))`,
    );
    assert.deepEqual(axe.violations, []);
    const focus = [];
    await evaluate('document.body.tabIndex=-1; document.body.focus(); true');
    for (let i = 0; i < (width < 768 ? 2 : 6); i++) {
      await key('Tab', 'Tab', 9);
      const item = await evaluate(
        `({label:document.activeElement.getAttribute('aria-label') || document.activeElement.textContent.trim(),outline:getComputedStyle(document.activeElement).outlineStyle,visible:document.activeElement.matches(':focus-visible')})`,
      );
      assert.equal(item.outline, 'solid');
      assert.equal(item.visible, true);
      focus.push(item.label);
    }
    if (width < 768) {
      await key('Tab', 'Tab', 9);
      assert.equal(await evaluate('document.activeElement.tagName'), 'SUMMARY');
      await key('Enter', 'Enter', 13);
      assert.equal(
        await evaluate("document.querySelector('.hirearchy-mobile-nav').open"),
        true,
      );
      await screenshot('mobile-navigation-open');
      await key(' ', 'Space', 32);
      assert.equal(
        await evaluate("document.querySelector('.hirearchy-mobile-nav').open"),
        false,
      );
    }
    const phases = [];
    if (animated) {
      await evaluate(
        'document.activeElement.blur(); window.scrollTo(0,0); true',
      );
      for (const [p, phase, active] of [
        [0, 'ARRIVAL', 'none'],
        [0.27, 'INVESTIGATION', 'investigation'],
        [0.45, 'REVISION', 'revision'],
        [0.63, 'VERIFICATION', 'verification'],
        [0.8, 'OUTCOME', 'outcome'],
        [0.94, 'HANDOFF', 'none'],
      ]) {
        await evaluate(
          `(() => { const root=document.querySelector('.hirearchy-hero-motion'); const top=root.getBoundingClientRect().top+scrollY; window.scrollTo(0, top+(root.offsetHeight-innerHeight)*${p}); return true; })()`,
        );
        await wait(150);
        const state = await evaluate(
          `({phase:document.querySelector('.hirearchy-hero-motion').dataset.phase,active:document.querySelector('.hirearchy-hero-motion').dataset.active,stageTransform:getComputedStyle(document.querySelector('.hirearchy-hero__stage')).transform,scene02Top:document.querySelector('#philosophy').getBoundingClientRect().top})`,
        );
        assert.equal(state.phase, phase);
        assert.equal(state.active, active);
        assert.equal(state.stageTransform, 'none');
        phases.push(state);
        if (width === 1440) await screenshot(`scene-01-${phase.toLowerCase()}`);
      }
      assert.ok(
        phases.at(-1).scene02Top < height,
        'Scene 02 must enter the viewport during handoff',
      );
      await evaluate(
        "window.scrollTo(0,0); document.querySelector('[data-replay]').focus(); true",
      );
      await wait(150);
      await key('Enter', 'Enter', 13);
      await wait(1600);

      assert.equal(
        await evaluate(
          "document.querySelector('.hirearchy-hero-motion').dataset.phase",
        ),
        'INVESTIGATION',
      );
      await wait(4200);
      assert.equal(
        await evaluate(
          "document.querySelector('.hirearchy-hero-motion').dataset.phase",
        ),
        'HANDOFF',
      );
      assert.equal(
        await evaluate('scrollY'),
        0,
        'Replay must not drive page scrolling',
      );
    } else {
      assert.equal(initial.phase, 'RESOLVED');
      assert.equal(
        await evaluate(
          "getComputedStyle(document.querySelector('.hirearchy-hero__stage')).transform",
        ),
        'none',
      );
      assert.equal(
        await evaluate(
          "getComputedStyle(document.querySelector('.hirearchy-hero__viewport')).position",
        ),
        'relative',
      );
    }
    await evaluate(`(() => {
      const card=document.querySelector('[data-evidence="revision"]');
      card.focus();
      card.click();
      return true;
    })()`);
    await wait(180);
    const relationship = await evaluate(`(() => {
      const card=document.querySelector('[data-evidence="revision"]');
      const region=document.querySelector('[data-workbench-region="revision"]');
      return {
        active:document.querySelector('.hirearchy-hero-motion').dataset.active,
        pressed:card.getAttribute('aria-pressed'),
        regionOpacity:getComputedStyle(region).opacity,
        focusVisible:card.matches(':focus-visible')
      };
    })()`);
    assert.equal(relationship.active, 'revision');
    assert.equal(relationship.pressed, 'true');
    assert.equal(relationship.regionOpacity, '1');
    assert.equal(relationship.focusVisible, true);
    await evaluate(
      "document.querySelector('#philosophy').scrollIntoView(); true",
    );
    await wait(150);
    assert.equal(
      await evaluate('document.documentElement.scrollWidth > innerWidth'),
      false,
    );
    await screenshot(
      `scene-02-${width}x${height}${motion === 'reduce' ? '-reduced' : ''}`,
    );
    await evaluate(
      'document.querySelector(\'a[href="#evidence"]\').click(); true',
    );
    await wait(200);
    assert.equal(
      await evaluate("document.querySelector('#evidence').open"),
      true,
    );
    const contrast = await evaluate(`(() => {
      const linear = v => (v/=255) <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4;
      const lum = rgb => rgb.match(/[0-9.]+/g).slice(0,3).map(Number).map(linear).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      const bg = lum(getComputedStyle(document.querySelector('.hirearchy-home')).backgroundColor);
      return ['.hirearchy-hero__lead','.hirearchy-kicker','.hirearchy-specimen figcaption','h1','h2'].map(selector=> { const ink=lum(getComputedStyle(document.querySelector(selector)).color); return {selector,ratio:(Math.max(bg,ink)+.05)/(Math.min(bg,ink)+.05)}; });
    })()`);
    for (const item of contrast)
      assert.ok(item.ratio >= 4.5, `${item.selector} contrast ${item.ratio}`);
    reports.push({
      viewport: [width, height],
      motion,
      initial,
      axe,
      focus,
      phases,
      relationship,
      contrast,
      performance: await evaluate('window.openingMetrics'),
    });
  }
  // Progressive fallback remains complete when JavaScript cannot run.
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
  });
  await send('Emulation.setScriptExecutionDisabled', { value: true });
  await send('Page.navigate', { url });
  await wait(1000);
  await screenshot('scene-01-no-javascript');
  await send('Emulation.setScriptExecutionDisabled', { value: false });
  const fallback = await evaluate(
    `({headings:document.querySelectorAll('h1,h2').length,images:[...document.images].every(i=>i.complete && i.naturalWidth),height:document.querySelector('.hirearchy-hero').getBoundingClientRect().height})`,
  );
  assert.equal(fallback.headings, 2);
  assert.equal(fallback.images, true);
  await writeFile(
    `${output}/browser-validation.json`,
    await format(JSON.stringify({ reports, fallback }), { parser: 'json' }),
  );
  console.log(
    JSON.stringify({
      cases: reports.length,
      axeViolations: reports.map((r) => r.axe.violations.length),
      fallback,
    }),
  );
  socket.close();
} finally {
  browser.kill('SIGTERM');
}
