// Captures README media (screenshots + demo GIF) from a running preview.
//
//   just build && just preview          # serves http://localhost:4321/kfolio/
//   node tools/capture-media.mjs [baseUrl]
//
// Uses a local Chromium-based browser (Edge by default, override with BROWSER_PATH)
// over the DevTools protocol, `sharp` for compositing and `ffmpeg` for the GIF.
// No extra npm dependencies.

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const BASE = (process.argv[2] ?? 'http://localhost:4321/kfolio').replace(/\/$/, '');
const OUT = resolve('.github/assets');
const BROWSER =
  process.env.BROWSER_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9333;
const THEMES = ['hermes-dark', 'fluent-dark', 'hermes-light', 'seasonal-winter'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- minimal CDP client ----------

async function launch() {
  const profile = mkdtempSync(join(tmpdir(), 'kfolio-cdp-'));
  const proc = spawn(
    BROWSER,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      '--hide-scrollbars',
      '--force-color-profile=srgb',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return { proc, profile };
    } catch {
      // not ready yet
    }
    await sleep(200);
  }
  throw new Error('Browser did not start');
}

async function openPage() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
  const { webSocketDebuggerUrl } = await res.json();
  const ws = new WebSocket(webSocketDebuggerUrl);
  await new Promise((r, j) => {
    ws.onopen = r;
    ws.onerror = j;
  });
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve: ok, reject: fail } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? fail(new Error(msg.error.message)) : ok(msg.result);
    } else if (msg.method) {
      listeners.get(msg.method)?.forEach((fn) => fn(msg.params));
    }
  };
  const send = (method, params = {}) =>
    new Promise((ok, fail) => {
      const mid = ++id;
      pending.set(mid, { resolve: ok, reject: fail });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  const once = (method) =>
    new Promise((ok) => {
      const arr = listeners.get(method) ?? [];
      const fn = (p) => {
        arr.splice(arr.indexOf(fn), 1);
        ok(p);
      };
      arr.push(fn);
      listeners.set(method, arr);
    });

  // Resolves with the next main-frame document response.
  const documentResponse = () =>
    new Promise((ok) => {
      const fn = (p) => {
        if (p.type !== 'Document' || p.frameId !== mainFrameId) return;
        const arr = listeners.get('Network.responseReceived');
        arr.splice(arr.indexOf(fn), 1);
        ok(p.response);
      };
      listeners.set('Network.responseReceived', [...(listeners.get('Network.responseReceived') ?? []), fn]);
    });

  await send('Page.enable');
  await send('Runtime.enable');
  // Live Hacker News headlines would make the media non-deterministic: force site tips.
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['*hacker-news.firebaseio.com*'] });
  const mainFrameId = (await send('Page.getFrameTree')).frameTree.frame.id;

  const page = {
    async viewport(width, height, mobile = false, scale = 1) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: scale,
        mobile,
      });
      await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
      await send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
      });
    },
    // A 404 would end up in the README silently, so check the HTTP status and retry once.
    async goto(url, settle = 1500) {
      for (let attempt = 1; ; attempt++) {
        const loaded = once('Page.loadEventFired');
        const responded = documentResponse();
        await send('Page.navigate', { url });
        const [response] = await Promise.all([responded, loaded]);
        await sleep(settle);
        if (response.status < 400) return;
        if (attempt === 2) throw new Error(`${response.status} for ${url}`);
        console.warn(`  ${response.status} for ${url}, retrying`);
        await sleep(1000);
      }
    },
    async eval(expression) {
      const r = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      return r.result?.value;
    },
    async png(clip) {
      const { data } = await send('Page.captureScreenshot', {
        format: 'png',
        ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
      });
      return Buffer.from(data, 'base64');
    },
    send,
    on(method, fn) {
      listeners.set(method, [...(listeners.get(method) ?? []), fn]);
    },
    close: () => ws.close(),
  };
  return page;
}

// ---------- helpers ----------

const url = (path, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return `${BASE}${path}${q ? `?${q}` : ''}`;
};

const clickTheme = (theme) =>
  `document.querySelector('.theme-quick-btn[data-theme="${theme}"], .settings-theme-pill[data-theme="${theme}"]')?.click()`;

async function save(name, buf) {
  const file = join(OUT, name);
  // Palette PNG keeps UI screenshots crisp at a fraction of the size.
  await sharp(buf).png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 }).toFile(file);
  console.log('  saved', name);
}

async function rounded(buf, width, radius = 14) {
  const { data, info } = await sharp(buf).resize({ width }).toBuffer({ resolveWithObject: true });
  const { height } = info;
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/></svg>`
  );
  return sharp(data)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

// ---------- scenes ----------

async function screenshots(page) {
  console.log('screenshots');

  await page.viewport(1440, 900);

  // 1. Theme matrix: 2x2 grid of the four themes
  const tiles = [];
  for (const theme of THEMES) {
    await page.goto(url('/en/', { theme, dog: '0' }), 2000);
    tiles.push(await rounded(await page.png(), 704, 12));
  }
  const tileH = Math.round((900 / 1440) * 704);
  const gap = 32;
  const grid = await sharp({
    create: {
      width: 704 * 2 + gap * 3,
      height: tileH * 2 + gap * 3,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(
      tiles.map((input, i) => ({
        input,
        left: gap + (i % 2) * (704 + gap),
        top: gap + Math.floor(i / 2) * (tileH + gap),
      }))
    )
    .png()
    .toBuffer();
  await save('screen-themes.png', grid);

  // 2. Pixel assistant close-up at 2x: open bubble with a site tip
  await page.viewport(1440, 900, false, 2);
  await page.goto(url('/en/', { theme: 'hermes-dark', dog: '1' }), 1500);
  await page.eval(`sessionStorage.clear(); document.querySelector('[data-dog-sprite]')?.click()`);
  await sleep(500);
  await page.eval(
    `(() => { const s = document.querySelector('[data-dog-stage]'); if (s?.classList.contains('is-bubble-hidden')) document.querySelector('[data-dog-sprite]')?.click(); })()`
  );
  await sleep(2600);
  const box = await page.eval(
    `(() => { const r = document.querySelector('.dog-widget').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`
  );
  const pad = 28;
  const clip = {
    x: Math.max(0, box.x - pad - 120),
    y: Math.max(0, box.y - pad),
    width: Math.min(1440, box.width + pad * 2 + 120),
    height: Math.min(900, box.height + pad * 2),
  };
  clip.width = Math.min(clip.width, 1440 - clip.x);
  clip.height = Math.min(clip.height, 900 - clip.y);
  await save('screen-assistant.png', await page.png(clip));

  // 3. Mobile: edge quick panel open
  await page.viewport(390, 844, true);
  await page.goto(url('/en/', { theme: 'hermes-dark', dog: '0' }), 2000);
  await page.eval(`document.querySelector('[data-edge] .edge-handle')?.click()`);
  await sleep(700);
  const mobile = await page.png();
  await page.goto(url('/uk/', { theme: 'fluent-dark', dog: '0' }), 2000);
  const mobile2 = await page.png();
  const [m1, m2] = await Promise.all([rounded(mobile, 390, 22), rounded(mobile2, 390, 22)]);
  const mobileGrid = await sharp({
    create: { width: 390 * 2 + 32 * 3, height: 844 + 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: m1, left: 32, top: 32 },
      { input: m2, left: 390 + 64, top: 32 },
    ])
    .png()
    .toBuffer();
  await save('screen-mobile.png', mobileGrid);
}

async function demoGif(page) {
  console.log('demo gif');
  const W = 1280;
  const H = 800;
  const FPS = 10;
  const frameDir = mkdtempSync(join(tmpdir(), 'kfolio-frames-'));
  await page.viewport(W, H);
  await page.goto(url('/en/', { theme: 'hermes-dark', dog: '1' }), 1800);
  // Ambient particles repaint every frame and triple the GIF size; keep them for stills only.
  await page.eval(
    `sessionStorage.clear(); localStorage.removeItem('kfolio_dog_history'); localStorage.setItem('kfolio_bg_fx', 'false'); location.reload()`
  );
  await sleep(1800);
  // Start with a quiet assistant so the theme cycle stays readable.
  await sleep(2500);
  await page.eval(
    `(() => { const s = document.querySelector('[data-dog-stage]'); if (!s?.classList.contains('is-bubble-hidden')) s?.querySelector('[data-dog-dismiss-bubble]')?.click(); })()`
  );

  // Screencast pushes a frame on every repaint (much faster than polling screenshots).
  // Frames are resampled to a fixed rate by timestamp, repeating the last one during idle periods.
  const shots = [];
  page.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    shots.push({ t: metadata.timestamp, data });
    page.send('Page.screencastFrameAck', { sessionId });
  });
  const record = (ms) => sleep(ms);
  const t0 = Date.now() / 1000;
  await page.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H });

  await record(1600);
  // Theme cycle
  for (const theme of ['fluent-dark', 'hermes-light', 'seasonal-winter', 'hermes-dark']) {
    await page.eval(clickTheme(theme));
    await record(1400);
  }
  // Pixel assistant speaks
  await page.eval(`document.querySelector('[data-dog-sprite]')?.click()`);
  await record(3600);

  await page.send('Page.stopScreencast');
  const t1 = Date.now() / 1000;
  if (!shots.length) throw new Error('No screencast frames');
  let n = 0;
  for (let t = Math.max(t0, shots[0].t), i = 0; t < t1; t += 1 / FPS) {
    while (i + 1 < shots.length && shots[i + 1].t <= t) i++;
    writeFileSync(join(frameDir, `f${String(n++).padStart(4, '0')}.jpg`), Buffer.from(shots[i].data, 'base64'));
  }
  console.log(`  ${shots.length} paints, ${n} frames @ ${FPS} fps, encoding`);
  const gif = join(OUT, 'demo.gif');
  const ff = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-loglevel', 'error',
      '-framerate', String(FPS),
      '-i', join(frameDir, 'f%04d.jpg'),
      '-vf',
      'scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
      '-loop', '0',
      gif,
    ],
    { stdio: 'inherit' }
  );
  rmSync(frameDir, { recursive: true, force: true });
  if (ff.status !== 0) throw new Error('ffmpeg failed');
  console.log('  saved demo.gif');
}

async function socialPreview() {
  console.log('social preview');
  await save('social-preview.png', await sharp(join(OUT, 'banner.svg')).png().toBuffer());
}

// ---------- main ----------

mkdirSync(OUT, { recursive: true });
const { proc, profile } = await launch();
try {
  const page = await openPage();
  const only = process.env.ONLY;
  if (!only || only === 'banner') await socialPreview();
  if (!only || only === 'shots') await screenshots(page);
  if (!only || only === 'gif') await demoGif(page);
  page.close();
} finally {
  proc.kill();
  await sleep(500);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  } catch {
    // Browser helpers can hold the temp profile briefly; the OS cleans temp later.
  }
}
