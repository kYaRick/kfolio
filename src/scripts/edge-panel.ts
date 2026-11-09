/**
 * Mobile quick panel (see EdgePanel.astro).
 * - The `>` tab sits on the left edge (the scrollbar is on the right). Drag it up or down; the position is saved as a fraction of the viewport height.
 * - Tap the grip to open the panel next to it; tap the scrim, press Escape or pick an item to close.
 * - Items with `data-proxy="<id>"` click the matching header/footer button.
 * - Swipe the open panel to the left to close it.
 */

const STORAGE_KEY = 'kfolio_edge_y';
const DRAG_THRESHOLD = 6; // px before a press counts as a drag
const MARGIN = 56; // keep the grip away from the screen edges
const SWIPE_CLOSE = 48; // px of leftward swipe that closes the panel

let cleanup: (() => void) | null = null;

function clampY(y: number) {
  return Math.min(window.innerHeight - MARGIN, Math.max(MARGIN, y));
}

function init() {
  cleanup?.();
  cleanup = null;

  const root = document.querySelector<HTMLElement>('[data-edge]');
  const handle = root?.querySelector<HTMLButtonElement>('.edge-handle');
  const panel = root?.querySelector<HTMLElement>('.edge-panel');
  if (!root || !handle || !panel) return;

  let y = clampY((Number(localStorage.getItem(STORAGE_KEY)) || 0.5) * window.innerHeight);

  const placePanel = () => {
    const h = panel.offsetHeight || 360;
    const top = Math.min(window.innerHeight - h - 12, Math.max(12, y - h / 2));
    root.style.setProperty('--edge-panel-top', `${top}px`);
  };
  const place = () => {
    root.style.setProperty('--edge-y', `${y}px`);
    placePanel();
  };
  place();

  const setOpen = (open: boolean) => {
    root.classList.toggle('is-open', open);
    handle.setAttribute('aria-expanded', String(open));
    panel.inert = !open;
    if (open) {
      placePanel();
      panel.querySelector<HTMLElement>('.edge-item')?.focus({ preventScroll: true });
    } else if (panel.contains(document.activeElement)) {
      handle.focus({ preventScroll: true });
    }
  };

  // --- drag or tap on the grip
  let startY = 0;
  let startGrip = 0;
  let dragging = false;
  let pressed = false;

  const onDown = (e: PointerEvent) => {
    pressed = true;
    dragging = false;
    startY = e.clientY;
    startGrip = y;
    handle.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!pressed) return;
    const dy = e.clientY - startY;
    if (!dragging && Math.abs(dy) < DRAG_THRESHOLD) return;
    dragging = true;
    root.classList.add('is-dragging');
    y = clampY(startGrip + dy);
    place();
  };
  const onUp = (e: PointerEvent) => {
    if (!pressed) return;
    pressed = false;
    handle.releasePointerCapture(e.pointerId);
    root.classList.remove('is-dragging');
    if (dragging) {
      localStorage.setItem(STORAGE_KEY, String(y / window.innerHeight));
    } else {
      setOpen(!root.classList.contains('is-open'));
    }
  };
  // keyboard: Enter/Space fire `click` without pointer events
  const onClick = (e: MouseEvent) => {
    if (e.detail === 0) setOpen(!root.classList.contains('is-open'));
  };

  // --- panel items
  const onPanelClick = (e: MouseEvent) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('[data-proxy]');
    if (item) {
      setOpen(false);
      document.getElementById(item.dataset.proxy ?? '')?.click();
      return;
    }
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  };
  const onScrim = () => setOpen(false);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && root.classList.contains('is-open')) setOpen(false);
  };
  const onResize = () => {
    y = clampY((Number(localStorage.getItem(STORAGE_KEY)) || 0.5) * window.innerHeight);
    place();
  };

  // --- swipe left on the open panel to close it (follows the finger)
  let swipeX: number | null = null;
  let swipeDx = 0;
  const onPanelDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    swipeX = e.clientX;
    swipeDx = 0;
  };
  const onPanelMove = (e: PointerEvent) => {
    if (swipeX === null) return;
    swipeDx = Math.min(0, e.clientX - swipeX);
    if (swipeDx < -6) panel.style.transform = `translateX(${swipeDx}px)`;
  };
  const onPanelUp = () => {
    if (swipeX === null) return;
    swipeX = null;
    panel.style.transform = '';
    if (swipeDx <= -SWIPE_CLOSE) setOpen(false);
  };
  panel.addEventListener('pointerdown', onPanelDown);
  panel.addEventListener('pointermove', onPanelMove);
  panel.addEventListener('pointerup', onPanelUp);
  panel.addEventListener('pointercancel', onPanelUp);

  const scrim = root.querySelector<HTMLElement>('[data-edge-close]');
  handle.addEventListener('pointerdown', onDown);
  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onUp);
  handle.addEventListener('pointercancel', onUp);
  handle.addEventListener('click', onClick);
  panel.addEventListener('click', onPanelClick);
  scrim?.addEventListener('click', onScrim);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);

  cleanup = () => {
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  };
}

document.addEventListener('astro:page-load', init);

export {};
