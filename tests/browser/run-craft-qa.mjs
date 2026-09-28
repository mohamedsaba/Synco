import { spawn } from 'node:child_process';

async function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function main() {
  console.log('Starting Next.js production server on port 3101...');
  const server = spawn('npx', ['next', 'start', 'apps/web', '-p', '3101'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '3101' },
  });

  server.stdout.on('data', (d) => process.stdout.write(d));
  server.stderr.on('data', (d) => process.stderr.write(d));

  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:3101');
      if (res.ok || res.status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await wait(250);
  }

  if (!ready) {
    server.kill('SIGTERM');
    throw new Error('Server failed to respond on http://127.0.0.1:3101');
  }

  console.log('Server is ready on port 3101! Running browser QA tests...');

  const runScript = (file) =>
    new Promise((resolve, reject) => {
      console.log(`=== Running ${file} ===`);
      const proc = spawn('node', [file, 'http://127.0.0.1:3101'], {
        stdio: 'inherit',
      });
      proc.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${file} exited with code ${code}`));
      });
    });

  try {
    await runScript('tests/browser/hirearchy-opening.mjs');
    console.log('hirearchy-opening.mjs PASSED!');
    await runScript('tests/browser/capture-final.mjs');
    console.log('capture-final.mjs PASSED!');
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('Runner error:', err);
  process.exit(1);
});
