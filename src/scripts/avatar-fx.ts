/**
 * Avatar reveal effect. A canvas over the photo renders a theme-aware filter:
 *  - pixel:    gold mosaic in the PixelTryzub style (dark themes); hover reveals the photo
 *  - halftone: newspaper dots (light theme); hover reveals the photo
 *  - frost:    fogged glass (winter); the pointer wipes it, and it fogs up again
 * Colours come from the theme's CSS custom properties, so new themes work too.
 * `data-avatar-fx="locked"` keeps the photo encoded (pixel or halftone) with no reveal.
 */

type Mode = 'pixel' | 'halftone' | 'frost';

const PITCH = 7; // CSS px per mosaic cell (small avatars use a finer grid)
const INTRO_MS = 900;
const BRUSH = 30; // CSS px wipe radius
const REFOG_DELAY_MS = 900;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function modeFor(theme: string, locked: boolean): Mode {
  if (theme === 'seasonal-winter' && !locked) return 'frost';
  if (theme === 'hermes-light') return 'halftone';
  return 'pixel';
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Draw `img` like `object-fit: cover; object-position: center <posY>`. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, posY = 0.15) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) * posY;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}

/** Average luminance (0..1) per cell of a cols x rows grid. */
function sampleGrid(img: HTMLImageElement, cols: number, rows: number): Float32Array {
  const c = document.createElement('canvas');
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  drawCover(ctx, img, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows).data;
  const out = new Float32Array(cols * rows);
  for (let i = 0; i < out.length; i++) {
    out[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
  }
  return out;
}

/** Contrast stretch between the 2nd and 98th percentile, so faces read on bright backgrounds. */
function stretch(lum: Float32Array): Float32Array {
  const sorted = Float32Array.from(lum).sort();
  const lo = sorted[Math.floor(sorted.length * 0.02)];
  const hi = sorted[Math.floor(sorted.length * 0.98)];
  const span = Math.max(0.05, hi - lo);
  return lum.map((v) => Math.min(1, Math.max(0, (v - lo) / span)));
}

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

class AvatarFx {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private mode: Mode = 'pixel';
  private raf = 0;
  private fog: HTMLCanvasElement | null = null;
  private last: { x: number; y: number } | null = null;
  private lastWipe = 0;
  private refogFrames = 0;
  private resizeObs: ResizeObserver;
  private readonly locked: boolean;
  private themeObs: MutationObserver;

  constructor(
    private box: HTMLElement,
    private img: HTMLImageElement,
    private canvas: HTMLCanvasElement,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.locked = box.dataset.avatarFx === 'locked';
    this.resizeObs = new ResizeObserver(() => this.render(false));
    this.resizeObs.observe(box);
    this.themeObs = new MutationObserver(() => this.render(true));
    this.themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    if (!this.locked) {
      box.addEventListener('pointermove', this.onMove);
      box.addEventListener('pointerdown', this.onMove);
      box.addEventListener('pointerleave', this.onLeave);
      box.addEventListener('click', this.onTap);
    }
    this.render(true);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    this.themeObs.disconnect();
    this.box.removeEventListener('pointermove', this.onMove);
    this.box.removeEventListener('pointerdown', this.onMove);
    this.box.removeEventListener('pointerleave', this.onLeave);
    this.box.removeEventListener('click', this.onTap);
  }

  private get pitch() {
    return this.w < 120 ? 4 : PITCH;
  }

  private setup() {
    const rect = this.box.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, Math.round(rect.width));
    this.h = Math.max(1, Math.round(rect.height));
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  render(intro: boolean) {
    cancelAnimationFrame(this.raf);
    this.setup();
    this.mode = modeFor(document.documentElement.getAttribute('data-theme') || 'hermes-dark', this.locked);
    this.box.dataset.fx = this.mode;
    this.box.classList.remove('is-revealed');
    this.canvas.classList.remove('fx-intro');

    if (this.mode === 'frost') {
      this.fog = this.buildFog();
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.ctx.drawImage(this.fog, 0, 0, this.w, this.h);
      if (intro && !reducedMotion()) {
        void this.canvas.offsetWidth; // restart the CSS "fogging up" animation
        this.canvas.classList.add('fx-intro');
      }
      return;
    }

    const draw = this.mode === 'pixel' ? this.drawPixels : this.drawHalftone;
    if (!intro || reducedMotion()) {
      draw(1);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / INTRO_MS);
      draw(easeOut(t));
      if (t < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  /** Mosaic: resolves from big blocks to the fine grid while `p` goes 0..1. */
  private drawPixels = (p: number) => {
    const fine = Math.max(8, Math.floor(this.w / this.pitch));
    const cols = Math.max(4, Math.round(4 + (fine - 4) * p));
    const pitch = this.w / cols;
    const rows = Math.ceil(this.h / pitch);
    const lum = stretch(sampleGrid(this.img, cols, rows));
    const ctx = this.ctx;
    const dim = cssVar('--accent-dim');
    const amber = cssVar('--accent-amber');
    const gold = cssVar('--accent-gold');
    const hot = cssVar('--text-main');

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = cssVar('--bg-base');
    ctx.fillRect(0, 0, this.w, this.h);

    const cell = pitch * 0.8;
    const radius = Math.min(2, cell * 0.22);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const l = lum[r * cols + c];
        // continuous tone: dim cells fade into the background, bright ones glow
        if (l < 0.45) {
          ctx.fillStyle = dim;
          ctx.globalAlpha = 0.1 + l * 1.6;
        } else if (l < 0.75) {
          ctx.fillStyle = amber;
          ctx.globalAlpha = 0.55 + (l - 0.45) * 1.5;
        } else if (l < 0.93) {
          ctx.fillStyle = gold;
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = hot;
          ctx.globalAlpha = 1;
        }
        ctx.beginPath();
        ctx.roundRect(c * pitch + (pitch - cell) / 2, r * pitch + (pitch - cell) / 2, cell, cell, radius);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  /** Halftone: darker areas give bigger dots. */
  private drawHalftone = (p: number) => {
    const fine = Math.max(8, Math.floor(this.w / (this.pitch - 1)));
    const cols = Math.max(4, Math.round(4 + (fine - 4) * p));
    const pitch = this.w / cols;
    const rows = Math.ceil(this.h / pitch) + 1;
    const lum = stretch(sampleGrid(this.img, cols, rows));
    const ctx = this.ctx;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = cssVar('--bg-panel') || '#fff';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.fillStyle = cssVar('--text-main');
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 ? pitch / 2 : 0;
      for (let c = 0; c < cols; c++) {
        const dark = 1 - lum[r * cols + c];
        const radius = (pitch / 2) * Math.sqrt(dark) * 1.05;
        if (radius < 0.35) continue;
        ctx.beginPath();
        ctx.arc(c * pitch + pitch / 2 + offset, r * pitch + pitch / 2, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // a touch of the accent colour, like a two-ink print
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = cssVar('--accent-gold');
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  /** Fogged glass: blurred photo + frosty haze + condensation droplets. */
  private buildFog(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.w * this.dpr;
    c.height = this.h * this.dpr;
    const ctx = c.getContext('2d')!;
    ctx.scale(this.dpr, this.dpr);

    ctx.filter = 'blur(7px) saturate(0.6) brightness(1.15)';
    ctx.save();
    ctx.translate(-10, -10);
    drawCover(ctx, this.img, this.w + 20, this.h + 20);
    ctx.restore();
    ctx.filter = 'none';

    const haze = ctx.createLinearGradient(0, 0, 0, this.h);
    haze.addColorStop(0, 'rgba(224, 242, 254, 0.62)');
    haze.addColorStop(1, 'rgba(186, 230, 253, 0.48)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, this.w, this.h);

    // frost grain
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < (this.w * this.h) / 60; i++) {
      ctx.fillRect(rand() * this.w, rand() * this.h, 1, 1);
    }
    // condensation droplets
    for (let i = 0; i < (this.w * this.h) / 2200; i++) {
      const x = rand() * this.w;
      const y = rand() * this.h;
      const r = 0.8 + rand() * 2.6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    return c;
  }

  private onMove = (e: PointerEvent) => {
    if (this.mode !== 'frost') return;
    const rect = this.box.getBoundingClientRect();
    const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const from = this.last ?? p;
    const dist = Math.hypot(p.x - from.x, p.y - from.y);
    const steps = Math.max(1, Math.ceil(dist / (BRUSH / 3)));
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 1; i <= steps; i++) {
      const x = from.x + ((p.x - from.x) * i) / steps;
      const y = from.y + ((p.y - from.y) * i) / steps;
      const g = ctx.createRadialGradient(x, y, 0, x, y, BRUSH);
      g.addColorStop(0, 'rgba(0,0,0,0.9)');
      g.addColorStop(0.6, 'rgba(0,0,0,0.5)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - BRUSH, y - BRUSH, BRUSH * 2, BRUSH * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    this.last = p;
    this.lastWipe = performance.now();
    this.scheduleRefog();
  };

  private onLeave = () => {
    this.last = null;
  };

  /** Touch devices have no hover: a tap toggles the reveal. */
  private onTap = () => {
    if (this.mode !== 'frost' && matchMedia('(hover: none)').matches) {
      this.box.classList.toggle('is-revealed');
    }
  };

  /** After the pointer stops, the glass slowly fogs up again. */
  private scheduleRefog() {
    cancelAnimationFrame(this.raf);
    this.refogFrames = 0;
    const tick = (now: number) => {
      if (this.mode !== 'frost' || !this.fog) return;
      if (now - this.lastWipe < REFOG_DELAY_MS) {
        this.raf = requestAnimationFrame(tick);
        return;
      }
      const ctx = this.ctx;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = reducedMotion() ? 1 : 0.025;
      ctx.drawImage(this.fog, 0, 0, this.w, this.h);
      ctx.globalAlpha = 1;
      if (++this.refogFrames < 240 && !reducedMotion()) {
        this.raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, this.w, this.h);
        ctx.drawImage(this.fog, 0, 0, this.w, this.h);
      }
    };
    this.raf = requestAnimationFrame(tick);
  }
}

let active: AvatarFx[] = [];

function destroyAll() {
  active.forEach((fx) => fx.destroy());
  active = [];
}

async function attach(box: HTMLElement) {
  const img = box.querySelector<HTMLImageElement>('img');
  const canvas = box.querySelector<HTMLCanvasElement>('canvas');
  if (!img || !canvas) return;
  // With srcset, img.naturalWidth is density-corrected while drawImage uses real
  // bitmap pixels; a plain Image of the chosen source keeps both in sync.
  const source = new Image();
  try {
    if (!img.complete) await img.decode();
    source.src = img.currentSrc || img.src;
    await source.decode();
  } catch {
    return; // image failed: leave the plain photo
  }
  if (box.isConnected) active.push(new AvatarFx(box, source, canvas));
}

function init() {
  destroyAll();
  document.querySelectorAll<HTMLElement>('[data-avatar-fx]').forEach((box) => void attach(box));
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', destroyAll);
