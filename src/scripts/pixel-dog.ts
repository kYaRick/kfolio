/**
 * Pixel companion assistant (`PixelDog.astro`).
 * - Hidden by default (`html:not(.fx-dog-on)`).
 * - Shows static site tips and live Hacker News highlights (cached in sessionStorage).
 * - Gracefully falls back to static tips without errors if Hacker News is unreachable.
 * - Saves spoken tips in localStorage (capped at 10 entries) for the history modal.
 */

interface TipEntry {
  kind: 'site' | 'hn';
  text: string;
  url?: string;
}

interface HnCache {
  ts: number;
  items: TipEntry[];
}

const HISTORY_KEY = 'kfolio_dog_history';
const HN_CACHE_KEY = 'kfolio_hn_cache';
const MAX_HISTORY = 10;
const HN_TTL_MS = 15 * 60 * 1000;
const HN_TIMEOUT_MS = 4000;
const IDLE_INTERVAL_MS = 25_000;
const BUBBLE_AUTO_CLOSE_MS = 18_000;
const AMBIENT_MIN_MS = 6500;
const AMBIENT_MAX_MS = 10_500;

const COMMON_TIPS: Record<'en' | 'uk', string[]> = {
  en: [
    'Check out the Engineering Blog for notes on architecture and tooling.',
    'Open Settings to switch between terminal themes or toggle visual FX.',
  ],
  uk: [
    'Загляньте в розділ Блог: там інженерні нотатки та розбори.',
    'У Налаштуваннях можна перемкнути тему термінала або вимкнути ефекти.',
  ],
};

const MOBILE_TIPS: Record<'en' | 'uk', string[]> = {
  en: [
    'Tap the `>` tab on the left edge to open quick actions and navigation.',
    'Press and hold the profile photo to decode it; release to bring the effect back.',
    'Use Print in the quick menu to export the CV as a clean A4 PDF.',
  ],
  uk: [
    'Тапніть по мітці `>` на лівому краю, щоб відкрити швидке меню.',
    'Утримуйте фото профілю, щоб проявити його; відпустіть, щоб повернути ефект.',
    'У швидкому меню є кнопка друку для експорту резюме у PDF формату A4.',
  ],
};

const DESKTOP_TIPS: Record<'en' | 'uk', string[]> = {
  en: [
    'Hover over the profile photo (or focus it with Tab) to decode the effect.',
    'Use the Print button in the top bar to export the CV as a clean A4 PDF.',
    'Use the Eye icon in the header to expand or collapse all experience cards at once.',
  ],
  uk: [
    'Наведіть курсор на фото профілю (або перейдіть через Tab), щоб проявити його.',
    'Кнопка друку в шапці формує чистий PDF-експорт резюме формату A4.',
    'Іконка ока в шапці розгортає або згортає всі картки досвіду одночасно.',
  ],
};

function getSiteTips(lang: 'en' | 'uk'): string[] {
  const isMobile = matchMedia('(hover: none)').matches || window.innerWidth <= 768;
  return [...COMMON_TIPS[lang], ...(isMobile ? MOBILE_TIPS[lang] : DESKTOP_TIPS[lang])];
}

let cleanup: (() => void) | null = null;
let hnFetching = false;

function getFxApi() {
  return window as Window & {
    __fxGet?: (key: string) => boolean;
    __fxSet?: (key: string, on: boolean) => void;
  };
}

function readHistory(): TipEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function pushHistory(entry: TipEntry) {
  const prev = readHistory().filter((item) => item.text !== entry.text);
  const next = [entry, ...prev].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
}

function readHnCache(): { hit: boolean; items: TipEntry[] } {
  try {
    const raw = sessionStorage.getItem(HN_CACHE_KEY);
    if (!raw) return { hit: false, items: [] };
    const parsed = JSON.parse(raw) as HnCache;
    if (!parsed || Date.now() - parsed.ts > HN_TTL_MS || !Array.isArray(parsed.items)) {
      return { hit: false, items: [] };
    }
    return { hit: true, items: parsed.items };
  } catch {
    return { hit: false, items: [] };
  }
}

function writeHnCache(items: TipEntry[]) {
  try {
    sessionStorage.setItem(HN_CACHE_KEY, JSON.stringify({ ts: Date.now(), items }));
  } catch {
    // Ignore storage quota errors
  }
}

async function fetchJsonQuiet<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), HN_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchHnTopStories(): Promise<TipEntry[]> {
  const cached = readHnCache();
  if (cached.hit) return cached.items;
  if (hnFetching) return [];

  hnFetching = true;
  try {
    const ids = await fetchJsonQuiet<number[]>('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!Array.isArray(ids) || ids.length === 0) {
      writeHnCache([]);
      return [];
    }

    const results = await Promise.all(
      ids.slice(0, 8).map((id) => fetchJsonQuiet<{ id?: number; title?: string }>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)),
    );

    const items: TipEntry[] = [];
    for (const story of results) {
      if (story?.title && story?.id) {
        items.push({
          kind: 'hn',
          text: story.title,
          url: `https://news.ycombinator.com/item?id=${story.id}`,
        });
      }
    }

    writeHnCache(items);
    return items;
  } catch {
    writeHnCache([]);
    return [];
  } finally {
    hnFetching = false;
  }
}

function init() {
  cleanup?.();
  cleanup = null;

  const root = document.querySelector<HTMLElement>('[data-pixel-dog]');
  const modal = document.getElementById('modal-dog-history');
  if (!root || !modal) return;

  const lang = root.dataset.lang === 'uk' ? 'uk' : 'en';
  const badgeSite = root.dataset.badgeSite || 'SITE TIP';
  const badgeHn = root.dataset.badgeHn || 'HACKER NEWS';
  const hnDetailsLabel = root.dataset.hnDetails || 'Open on Hacker News';
  const emptyLabel = root.dataset.empty || 'No saved tips yet.';

  const badgeEl = root.querySelector<HTMLElement>('[data-dog-badge]');
  const textEl = root.querySelector<HTMLElement>('[data-dog-text]');
  const detailsEl = root.querySelector<HTMLDetailsElement>('[data-dog-details]');
  const linkEl = root.querySelector<HTMLAnchorElement>('[data-dog-link]');
  const spriteEl = root.querySelector<HTMLElement>('[data-dog-sprite]');
  const spriteWrapEl = root.querySelector<HTMLElement>('.dog-sprite-wrap');
  const stageEl = root.querySelector<HTMLElement>('[data-dog-stage]');
  const bubbleEl = root.querySelector<HTMLElement>('.dog-bubble');
  const historyList = modal.querySelector<HTMLElement>('[data-dog-history-list]');

  let hnPool: TipEntry[] = readHnCache().items;
  let lastText = '';
  let wasScrolled = document.documentElement.classList.contains('has-scrolled');
  let idleTimer = 0;
  let animTimer = 0;
  let animResetTimer = 0;
  let thinkTimer = 0;
  let autoCloseTimer = 0;
  let powerTimer = 0;
  let bubbleHovered = false;

  const stopTimers = () => {
    if (idleTimer) {
      window.clearTimeout(idleTimer);
      idleTimer = 0;
    }
    if (animTimer) {
      window.clearTimeout(animTimer);
      animTimer = 0;
    }
    if (animResetTimer) {
      window.clearTimeout(animResetTimer);
      animResetTimer = 0;
    }
    if (thinkTimer) {
      window.clearTimeout(thinkTimer);
      thinkTimer = 0;
    }
    if (autoCloseTimer) {
      window.clearTimeout(autoCloseTimer);
      autoCloseTimer = 0;
    }
    if (powerTimer) {
      window.clearTimeout(powerTimer);
      powerTimer = 0;
    }
  };

  const hidePowerControls = () => {
    if (powerTimer) {
      window.clearTimeout(powerTimer);
      powerTimer = 0;
    }
    spriteWrapEl?.classList.remove('show-power');
  };

  const showPowerControls = () => {
    if (!spriteWrapEl) return;
    if (powerTimer) window.clearTimeout(powerTimer);
    spriteWrapEl.classList.add('show-power');
    powerTimer = window.setTimeout(hidePowerControls, 4000);
  };

  const scheduleAutoClose = () => {
    if (autoCloseTimer) window.clearTimeout(autoCloseTimer);
    if (!document.documentElement.classList.contains('fx-dog-on')) return;
    if (stageEl?.classList.contains('is-bubble-hidden')) return;
    autoCloseTimer = window.setTimeout(() => {
      autoCloseTimer = 0;
      if (bubbleHovered || detailsEl?.open || modal.classList.contains('open')) {
        scheduleAutoClose();
        return;
      }
      stageEl?.classList.add('is-bubble-hidden');
      resetIdleTimer();
    }, BUBBLE_AUTO_CLOSE_MS);
  };

  const playAnim = (name: 'scratch' | 'walk' | 'speak' | 'think', durationMs: number) => {
    if (!spriteEl || document.documentElement.classList.contains('fx-reduced')) return;
    if (animResetTimer) window.clearTimeout(animResetTimer);
    spriteEl.dataset.anim = name;
    animResetTimer = window.setTimeout(() => {
      if (spriteEl) spriteEl.dataset.anim = 'idle';
    }, durationMs);
  };

  const thinkAndSpeak = (thinkMs = 2000) => {
    if (thinkTimer) window.clearTimeout(thinkTimer);
    if (document.documentElement.classList.contains('fx-reduced')) {
      pickRandomTip();
      return;
    }
    playAnim('think', thinkMs);
    thinkTimer = window.setTimeout(() => {
      thinkTimer = 0;
      if (document.documentElement.classList.contains('fx-dog-on')) {
        pickRandomTip();
      }
    }, thinkMs);
  };

  const scheduleAmbient = () => {
    if (animTimer) window.clearTimeout(animTimer);
    if (!document.documentElement.classList.contains('fx-dog-on')) return;
    const delay = AMBIENT_MIN_MS + Math.random() * (AMBIENT_MAX_MS - AMBIENT_MIN_MS);
    animTimer = window.setTimeout(() => {
      if (
        document.documentElement.classList.contains('fx-dog-on') &&
        !modal.classList.contains('open') &&
        spriteEl?.dataset.anim === 'idle'
      ) {
        const nextAnim = Math.random() < 0.5 ? 'scratch' : 'walk';
        playAnim(nextAnim, nextAnim === 'scratch' ? 2400 : 3600);
      }
      scheduleAmbient();
    }, delay);
  };

  const resetIdleTimer = () => {
    if (idleTimer) window.clearTimeout(idleTimer);
    if (!document.documentElement.classList.contains('fx-dog-on')) return;
    idleTimer = window.setTimeout(() => {
      if (document.documentElement.classList.contains('fx-dog-on') && !modal.classList.contains('open')) {
        if (stageEl?.classList.contains('is-bubble-hidden')) {
          thinkAndSpeak(2200);
        } else {
          pickRandomTip();
        }
      }
      resetIdleTimer();
    }, IDLE_INTERVAL_MS);
  };

  const showTip = (entry: TipEntry, save = true) => {
    lastText = entry.text;
    stageEl?.classList.remove('is-bubble-hidden');
    if (badgeEl) badgeEl.textContent = entry.kind === 'hn' ? badgeHn : badgeSite;
    if (textEl) textEl.textContent = entry.text;
    if (detailsEl && linkEl) {
      if (entry.url) {
        detailsEl.hidden = false;
        detailsEl.open = false;
        linkEl.href = entry.url;
        linkEl.textContent = entry.url;
      } else {
        detailsEl.hidden = true;
        detailsEl.open = false;
      }
    }
    if (bubbleEl) {
      bubbleEl.classList.remove('is-popping');
      void bubbleEl.offsetWidth;
      bubbleEl.classList.add('is-popping');
    }
    playAnim('speak', 900);
    scheduleAutoClose();
    if (save) pushHistory(entry);
  };

  const pickRandomTip = () => {
    const sitePool: TipEntry[] = getSiteTips(lang).map((text) => ({ kind: 'site', text }));
    const pool = [...sitePool, ...hnPool];
    const candidates = pool.filter((item) => item.text !== lastText);
    const source = candidates.length > 0 ? candidates : pool;
    const chosen = source[Math.floor(Math.random() * source.length)];
    if (chosen) showTip(chosen, true);
  };

  const renderHistoryModal = () => {
    if (!historyList) return;
    historyList.replaceChildren();
    const items = readHistory();
    if (items.length === 0) {
      const p = document.createElement('p');
      p.style.margin = '0';
      p.style.color = 'var(--text-muted)';
      p.style.fontFamily = 'var(--font-mono)';
      p.style.fontSize = '12px';
      p.textContent = emptyLabel;
      historyList.appendChild(p);
      return;
    }

    for (const item of items) {
      const card = document.createElement('div');
      card.className = 'dog-history-item';

      const badge = document.createElement('span');
      badge.className = 'dog-badge';
      badge.textContent = item.kind === 'hn' ? badgeHn : badgeSite;
      card.appendChild(badge);

      const p = document.createElement('p');
      p.textContent = item.text;
      card.appendChild(p);

      if (item.url) {
        const det = document.createElement('details');
        const sum = document.createElement('summary');
        sum.textContent = hnDetailsLabel;
        const a = document.createElement('a');
        a.href = item.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = item.url;
        det.appendChild(sum);
        det.appendChild(a);
        card.appendChild(det);
      }

      historyList.appendChild(card);
    }
  };

  const setDogEnabled = (on: boolean) => {
    const fx = getFxApi();
    if (fx.__fxSet) {
      fx.__fxSet('dog', on);
      window.dispatchEvent(new CustomEvent('kfolio:fx-change', { detail: { key: 'dog' } }));
    } else {
      document.documentElement.classList.toggle('fx-dog-on', on);
    }
  };

  const onActivated = () => {
    if (!document.documentElement.classList.contains('fx-dog-on')) {
      stopTimers();
      return;
    }
    if (!lastText) pickRandomTip();
    resetIdleTimer();
    scheduleAmbient();
    if (hnPool.length === 0 && !readHnCache().hit) {
      void fetchHnTopStories().then((items) => {
        if (items.length > 0) hnPool = items;
      });
    }
  };

  const openModal = () => {
    renderHistoryModal();
    modal.classList.add('open');
  };

  const closeModal = () => {
    modal.classList.remove('open');
  };

  const onRootClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-dog-open]')) {
      setDogEnabled(true);
      return;
    }
    if (target.closest('[data-dog-hide]')) {
      setDogEnabled(false);
      return;
    }
    if (target.closest('[data-dog-dismiss-bubble]')) {
      if (autoCloseTimer) {
        window.clearTimeout(autoCloseTimer);
        autoCloseTimer = 0;
      }
      stageEl?.classList.add('is-bubble-hidden');
      resetIdleTimer();
      return;
    }
    if (target.closest('[data-dog-next]')) {
      pickRandomTip();
      resetIdleTimer();
      return;
    }
    if (target.closest('[data-dog-sprite]')) {
      const isTouch = matchMedia('(hover: none)').matches;
      if (isTouch) showPowerControls();
      if (stageEl?.classList.contains('is-bubble-hidden')) {
        thinkAndSpeak(1100);
        resetIdleTimer();
      } else if (!isTouch) {
        openModal();
      }
      return;
    }
    if (target.closest('[data-dog-history]')) {
      openModal();
    }
  };

  const onModalClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === modal || target.closest('[data-dog-modal-close]')) {
      closeModal();
      return;
    }
    if (target.closest('[data-dog-clear]')) {
      localStorage.removeItem(HISTORY_KEY);
      renderHistoryModal();
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    resetIdleTimer();
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  };

  const onScroll = () => {
    resetIdleTimer();
    const isScrolled = document.documentElement.classList.contains('has-scrolled');
    if (isScrolled !== wasScrolled) {
      wasScrolled = isScrolled;
      if (document.documentElement.classList.contains('fx-dog-on')) {
        playAnim('walk', 1100);
      }
    }
  };

  const onFxChange = (e: Event) => {
    const detail = (e as CustomEvent<{ key?: string }>).detail;
    if (!detail?.key || detail.key === 'dog') onActivated();
  };

  const onBubbleEnter = () => {
    bubbleHovered = true;
  };
  const onBubbleLeave = () => {
    bubbleHovered = false;
  };

  const onDocPointerDown = (e: PointerEvent) => {
    resetIdleTimer();
    if (spriteWrapEl && !spriteWrapEl.contains(e.target as Node)) {
      hidePowerControls();
    }
  };

  root.addEventListener('click', onRootClick);
  bubbleEl?.addEventListener('pointerenter', onBubbleEnter);
  bubbleEl?.addEventListener('pointerleave', onBubbleLeave);
  modal.addEventListener('click', onModalClick);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('pointerdown', onDocPointerDown, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('kfolio:fx-change', onFxChange);

  onActivated();

  cleanup = () => {
    stopTimers();
    root.removeEventListener('click', onRootClick);
    bubbleEl?.removeEventListener('pointerenter', onBubbleEnter);
    bubbleEl?.removeEventListener('pointerleave', onBubbleLeave);
    modal.removeEventListener('click', onModalClick);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('pointerdown', onDocPointerDown);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('kfolio:fx-change', onFxChange);
  };
}

document.addEventListener('astro:page-load', init);

export {};
