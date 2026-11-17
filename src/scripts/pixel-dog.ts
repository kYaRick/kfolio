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
const DOG_STATE_KEY = 'kfolio_dog_state';
const DOG_OUTFIT_KEY = 'kfolio_dog_winter_outfit';
const WINTER_OUTFITS = ['hat-socks', 'socks', 'hat'] as const;
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

const UK_HN_INTROS = [
  'Перепрошую, що не державною, але на Hacker News пишуть:',
  'Перепрошую за мій американський, та ось що гудить на HN:',
  'Мовою оригіналу (бо перекладач у відпустці):',
  "Вибачаюсь за несолов'їну, свіже з Hacker News:",
  'Хвилина англійської на HN:',
  'Трохи техно-фольклору мовою оригіналу:',
];

const NOT_FOUND_TIPS: Record<'en' | 'uk', string[]> = {
  en: [
    'Whoops, you were not supposed to be here... Grab a paw and head back to the main CV!',
    'I sniffed every sector on the server: nothing here but dust and stray pixels.',
    '404! Someone buried this page deeper than I hide my bones.',
    'Psst... Nothing lives at this address. Not even a stray bug. Let us head back!',
    'The router says 404 Not Found; I say it is time to hit the Main CV button.',
  ],
  uk: [
    'От халепа, ти не мав би тут бути... Але раз уже зайшов, тримай лапу і гайда на головну!',
    'Я обнюхав усі сектори сервера: за цією адресою тільки пил і загублені пікселі.',
    '404! Хтось закопав цю сторінку глибше, ніж я ховаю кістки.',
    'Тсс... Тут нічого немає. Навіть багів не завезли. Повертаймося до резюме!',
    'Маршрутизатор каже 404, а я кажу: час тиснути кнопку "Головна (Резюме)".',
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

  const is404 = Boolean(document.getElementById('nf-wrap'));
  const detectedNfLang = document.documentElement.dataset.nfLang;
  const lang: 'en' | 'uk' =
    is404 && (detectedNfLang === 'uk' || detectedNfLang === 'en')
      ? detectedNfLang
      : root.dataset.lang === 'uk'
        ? 'uk'
        : 'en';

  interface DogI18n {
    open?: string;
    hide?: string;
    next?: string;
    history?: string;
    historyTitle?: string;
    clear?: string;
    empty?: string;
    hnDetails?: string;
    badgeSite?: string;
    badgeHn?: string;
  }

  let i18n: DogI18n = {};
  try {
    const raw = lang === 'uk' ? root.dataset.i18nUk : root.dataset.i18nEn;
    if (raw) i18n = JSON.parse(raw) as DogI18n;
  } catch {
    // Ignore parse error
  }

  const badgeSite = is404 ? '404 // LOST' : i18n.badgeSite || root.dataset.badgeSite || 'SITE TIP';
  const badgeHn = i18n.badgeHn || root.dataset.badgeHn || 'HACKER NEWS';
  const hnDetailsLabel = i18n.hnDetails || root.dataset.hnDetails || 'Open on Hacker News';
  const emptyLabel = i18n.empty || root.dataset.empty || 'No saved tips yet.';

  // Sync static UI labels when runtime language differs from build language (e.g. on 404.html)
  const nextBtn = root.querySelector<HTMLElement>('[data-dog-next]');
  const historyBtn = root.querySelector<HTMLElement>('[data-dog-history]');
  const openBtn = root.querySelector<HTMLElement>('[data-dog-open]');
  const hideBtns = root.querySelectorAll<HTMLElement>('[data-dog-hide], [data-dog-dismiss-bubble]');
  const historyTitleEl = document.getElementById('dog-history-title');
  const clearBtn = modal.querySelector<HTMLElement>('[data-dog-clear]');
  const detailsSummary = root.querySelector<HTMLElement>('[data-dog-details] > summary');

  if (nextBtn && i18n.next) nextBtn.textContent = i18n.next;
  if (historyBtn && i18n.history) historyBtn.textContent = i18n.history;
  if (historyTitleEl && i18n.historyTitle) historyTitleEl.textContent = i18n.historyTitle;
  if (clearBtn && i18n.clear) clearBtn.textContent = i18n.clear;
  if (detailsSummary && i18n.hnDetails) detailsSummary.textContent = i18n.hnDetails;
  if (openBtn && i18n.open) {
    openBtn.title = i18n.open;
    openBtn.setAttribute('aria-label', i18n.open);
  }
  if (i18n.hide) {
    hideBtns.forEach((btn) => {
      btn.title = i18n.hide!;
      btn.setAttribute('aria-label', i18n.hide!);
    });
  }
  const spriteBtnInit = root.querySelector<HTMLElement>('[data-dog-sprite]');
  if (spriteBtnInit && i18n.history) {
    spriteBtnInit.title = i18n.history;
    spriteBtnInit.setAttribute('aria-label', i18n.history);
  }

  const badgeEl = root.querySelector<HTMLElement>('[data-dog-badge]');
  const textEl = root.querySelector<HTMLElement>('[data-dog-text]');
  const detailsEl = root.querySelector<HTMLDetailsElement>('[data-dog-details]');
  const linkEl = root.querySelector<HTMLAnchorElement>('[data-dog-link]');
  const spriteEl = root.querySelector<HTMLElement>('[data-dog-sprite]');
  const spriteWrapEl = root.querySelector<HTMLElement>('.dog-sprite-wrap');
  const emoteEl = root.querySelector<HTMLElement>('[data-dog-emote]');
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
  let emoteTimer = 0;
  let emoteShowTimer = 0;
  let topVisitDelayTimer = 0;
  let lastTopVisitAt = 0;
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
    if (emoteTimer) {
      window.clearTimeout(emoteTimer);
      emoteTimer = 0;
    }
    if (emoteShowTimer) {
      window.clearTimeout(emoteShowTimer);
      emoteShowTimer = 0;
    }
    if (topVisitDelayTimer) {
      window.clearTimeout(topVisitDelayTimer);
      topVisitDelayTimer = 0;
    }
    spriteWrapEl?.classList.remove('show-emote');
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

  const isBubbleOpen = () => Boolean(stageEl && !stageEl.classList.contains('is-bubble-hidden'));

  const saveDogState = (hidden: boolean, entry: TipEntry | null) => {
    try {
      sessionStorage.setItem(DOG_STATE_KEY, JSON.stringify({ hidden, entry, lang }));
    } catch {
      // Ignore storage errors
    }
  };

  const readDogState = (): { hidden: boolean; entry: TipEntry | null } | null => {
    try {
      const raw = sessionStorage.getItem(DOG_STATE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { hidden?: boolean; entry?: TipEntry | null; lang?: string };
      if (parsed.lang !== lang) return null;
      return { hidden: Boolean(parsed.hidden), entry: parsed.entry ?? null };
    } catch {
      return null;
    }
  };

  const scheduleAutoClose = () => {
    if (autoCloseTimer) window.clearTimeout(autoCloseTimer);
    if (!document.documentElement.classList.contains('fx-dog-on')) return;
    if (!isBubbleOpen()) return;
    autoCloseTimer = window.setTimeout(() => {
      autoCloseTimer = 0;
      if (bubbleHovered || detailsEl?.open || modal.classList.contains('open')) {
        scheduleAutoClose();
        return;
      }
      stageEl?.classList.add('is-bubble-hidden');
      saveDogState(true, null);
      resetIdleTimer();
    }, BUBBLE_AUTO_CLOSE_MS);
  };

  const playAnim = (
    name: 'scratch' | 'walk' | 'speak' | 'think' | 'top-boop' | 'top-mark' | 'top-nap' | 'top-hop-off',
    durationMs: number
  ) => {
    if (!spriteEl || document.documentElement.classList.contains('fx-reduced')) return;
    if (animResetTimer) window.clearTimeout(animResetTimer);
    spriteEl.dataset.anim = name;
    if (durationMs > 0) {
      animResetTimer = window.setTimeout(() => {
        if (spriteEl) spriteEl.dataset.anim = 'idle';
      }, durationMs);
    }
  };

  const TOP_EMOTES: Record<'boop' | 'mark' | 'nap', Record<'en' | 'uk', string[]>> = {
    boop: {
      en: ['*boop ^*', 'chmod +x ^', 'up?'],
      uk: ['*буп ^*', 'chmod +x ^', 'стриб!'],
    },
    mark: {
      en: ['404 hydrant', 'git push ^', 'sudo mark'],
      uk: ['404 гідрант', 'git push ^', 'мітка ОК'],
    },
    nap: {
      en: ['zZz...', 'sleep(∞)', 'idle ^'],
      uk: ['zZz...', 'sleep(∞)', 'дрім...'],
    },
  };

  const showEmote = (text: string, delayMs = 450, durationMs = 1900) => {
    if (!spriteWrapEl || !emoteEl) return;
    if (emoteShowTimer) window.clearTimeout(emoteShowTimer);
    if (emoteTimer) window.clearTimeout(emoteTimer);
    emoteShowTimer = window.setTimeout(() => {
      emoteShowTimer = 0;
      emoteEl.textContent = text;
      spriteWrapEl.classList.add('show-emote');
      emoteTimer = window.setTimeout(() => {
        emoteTimer = 0;
        spriteWrapEl.classList.remove('show-emote');
      }, durationMs);
    }, delayMs);
  };

  const visitTopButton = (respectCooldown = false) => {
    if (window.innerWidth <= 768) return false;
    if (!document.documentElement.classList.contains('fx-dog-on')) return false;
    if (!document.documentElement.classList.contains('has-scrolled')) return false;
    if (document.documentElement.classList.contains('fx-reduced')) return false;
    if (modal.classList.contains('open') || spriteEl?.dataset.anim !== 'idle') return false;
    const now = Date.now();
    if (respectCooldown && now - lastTopVisitAt < 15_000) return false;
    lastTopVisitAt = now;
    const roll = Math.random();
    const kind: 'boop' | 'mark' | 'nap' = roll < 0.34 ? 'boop' : roll < 0.67 ? 'mark' : 'nap';
    const pool = TOP_EMOTES[kind][lang];
    const text = pool[Math.floor(Math.random() * pool.length)];
    if (kind === 'nap') {
      playAnim('top-nap', 0);
      showEmote(text, 550, 2600);
    } else {
      playAnim(kind === 'boop' ? 'top-boop' : 'top-mark', 2850);
      showEmote(text, 500, 1800);
    }
    return true;
  };

  const wakeFromTopNap = () => {
    if (spriteEl?.dataset.anim !== 'top-nap') return;
    playAnim('top-hop-off', 470);
    showEmote('!', 0, 900);
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
        if (!isBubbleOpen() && document.documentElement.classList.contains('has-scrolled') && window.innerWidth > 768 && Math.random() < 0.25) {
          visitTopButton(false);
        } else {
          const nextAnim = isBubbleOpen() ? 'scratch' : (Math.random() < 0.5 ? 'scratch' : 'walk');
          playAnim(nextAnim, nextAnim === 'scratch' ? 2400 : 3450);
        }
      }
      scheduleAmbient();
    }, delay);
  };

  const resetIdleTimer = () => {
    if (idleTimer) window.clearTimeout(idleTimer);
    if (!document.documentElement.classList.contains('fx-dog-on')) return;
    idleTimer = window.setTimeout(() => {
      const currentAnim = spriteEl?.dataset.anim || 'idle';
      if (
        document.documentElement.classList.contains('fx-dog-on') &&
        !modal.classList.contains('open') &&
        (currentAnim === 'idle' || currentAnim === 'scratch')
      ) {
        thinkAndSpeak(isBubbleOpen() ? 900 : 2200);
      }
      resetIdleTimer();
    }, IDLE_INTERVAL_MS);
  };

  const showTip = (entry: TipEntry, save = true, animate = true) => {
    lastText = entry.text;
    stageEl?.classList.remove('is-bubble-hidden');
    if (badgeEl) badgeEl.textContent = entry.kind === 'hn' ? badgeHn : badgeSite;
    if (textEl) {
      if (lang === 'uk' && entry.kind === 'hn') {
        const intro = UK_HN_INTROS[Math.floor(Math.random() * UK_HN_INTROS.length)];
        textEl.textContent = `${intro} "${entry.text}"`;
      } else {
        textEl.textContent = entry.text;
      }
    }
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
    if (bubbleEl && animate) {
      bubbleEl.classList.remove('is-popping');
      void bubbleEl.offsetWidth;
      bubbleEl.classList.add('is-popping');
    }
    if (animate) playAnim('speak', 900);
    scheduleAutoClose();
    saveDogState(false, entry);
    if (save) pushHistory(entry);
  };

  const pickRandomTip = () => {
    const pool: TipEntry[] = is404
      ? NOT_FOUND_TIPS[lang].map((text) => ({ kind: 'site', text }))
      : [
          ...getSiteTips(lang).map((text) => ({ kind: 'site' as const, text })),
          ...hnPool,
        ];
    const candidates = pool.filter((item) => item.text !== lastText);
    const source = candidates.length > 0 ? candidates : pool;
    const chosen = source[Math.floor(Math.random() * source.length)];
    if (chosen) showTip(chosen, !is404);
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

  const applyWinterOutfit = (reroll = false) => {
    if (!spriteEl) return;
    let outfit: string | null = null;
    try {
      if (!reroll) outfit = sessionStorage.getItem(DOG_OUTFIT_KEY);
      if (!outfit || !WINTER_OUTFITS.includes(outfit as (typeof WINTER_OUTFITS)[number])) {
        outfit = WINTER_OUTFITS[Math.floor(Math.random() * WINTER_OUTFITS.length)];
        sessionStorage.setItem(DOG_OUTFIT_KEY, outfit);
      }
    } catch {
      outfit = WINTER_OUTFITS[0];
    }
    spriteEl.dataset.winterOutfit = outfit;
  };

  applyWinterOutfit(false);

  const setDogEnabled = (on: boolean) => {
    if (on) applyWinterOutfit(true);
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
    if (!lastText) {
      if (is404) {
        stageEl?.classList.add('is-bubble-hidden');
        thinkAndSpeak(700);
      } else {
        const prevState = readDogState();
        if (prevState && !prevState.hidden && prevState.entry) {
          showTip(prevState.entry, false, false);
        } else {
          stageEl?.classList.add('is-bubble-hidden');
          saveDogState(true, null);
        }
      }
    }
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
      thinkAndSpeak(900);
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
      saveDogState(true, null);
      resetIdleTimer();
      return;
    }
    if (target.closest('[data-dog-next]')) {
      if (thinkTimer) return;
      thinkAndSpeak(900);
      resetIdleTimer();
      return;
    }
    if (target.closest('[data-dog-sprite]')) {
      const isTouch = matchMedia('(hover: none)').matches;
      if (isTouch) showPowerControls();
      if (spriteEl?.dataset.anim === 'top-nap') {
        wakeFromTopNap();
        resetIdleTimer();
        return;
      }
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
      if (topVisitDelayTimer) {
        window.clearTimeout(topVisitDelayTimer);
        topVisitDelayTimer = 0;
      }
      if (isScrolled && !isBubbleOpen()) {
        // Wait for .dog-widget's 350ms horizontal transition to finish before animating the sprite
        topVisitDelayTimer = window.setTimeout(() => {
          topVisitDelayTimer = 0;
          if (document.documentElement.classList.contains('has-scrolled') && !isBubbleOpen()) {
            visitTopButton(true);
          }
        }, 450);
      } else if (!isScrolled) {
        wakeFromTopNap();
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
