/**
 * Mobile quick panel (see EdgePanel.astro).
 * - The `>` tab sits on the left edge; drag vertically to reposition (saved in localStorage), tap to open.
 * - Tap the scrim, swipe left on the panel, press Escape, or pick an item to close.
 * - Items with `data-proxy="<id>"` click the matching header/footer button.
 */

const EDGE_Y_KEY = 'kfolio_edge_y';
const HANDLE_MARGIN = 44;
const DRAG_THRESHOLD_PX = 6;
const SWIPE_CLOSE_PX = 45;

let cleanup: (() => void) | null = null;

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function init() {
  cleanup?.();
  cleanup = null;

  const root = document.querySelector<HTMLElement>('[data-edge]');
  const handle = root?.querySelector<HTMLButtonElement>('.edge-handle');
  const panel = root?.querySelector<HTMLElement>('.edge-panel');
  const topBtn = root?.querySelector<HTMLButtonElement>('.edge-top-btn');
  if (!root || !handle || !panel) return;

  let edgeY = window.innerHeight * 0.5;
  try {
    const saved = Number(localStorage.getItem(EDGE_Y_KEY));
    if (Number.isFinite(saved) && saved > 0) {
      edgeY = clamp(saved, HANDLE_MARGIN, Math.max(HANDLE_MARGIN, window.innerHeight - HANDLE_MARGIN));
    }
  } catch {
    // Ignore storage errors
  }

  const applyHandleY = (y: number) => {
    edgeY = clamp(y, HANDLE_MARGIN, Math.max(HANDLE_MARGIN, window.innerHeight - HANDLE_MARGIN));
    root.style.setProperty('--edge-y', `${edgeY}px`);
  };

  const placePanel = () => {
    applyHandleY(edgeY);
    const hasScrolled = document.documentElement.classList.contains('has-scrolled');
    const bottomReserved = hasScrolled ? 84 : 12;
    const maxPanelH = Math.max(180, window.innerHeight - 12 - bottomReserved);
    panel.style.maxHeight = `${maxPanelH}px`;
    const h = Math.min(panel.offsetHeight || 360, maxPanelH);
    const maxTop = Math.max(12, window.innerHeight - h - bottomReserved);
    const top = clamp(edgeY - h / 2, 12, maxTop);
    root.style.setProperty('--edge-panel-top', `${top}px`);
  };
  placePanel();

  const setOpen = (open: boolean) => {
    root.classList.toggle('is-open', open);
    handle.setAttribute('aria-expanded', String(open));
    panel.inert = !open;
    if (topBtn) topBtn.inert = !open;
    if (open) {
      placePanel();
      panel.querySelector<HTMLElement>('.edge-item')?.focus({ preventScroll: true });
    } else if (panel.contains(document.activeElement) || topBtn?.contains(document.activeElement)) {
      handle.focus({ preventScroll: true });
    }
  };

  // Vertical handle drag + tap-to-open
  let dragging = false;
  let dragMoved = false;
  let suppressNextClick = false;
  let startY = 0;
  let startEdgeY = edgeY;

  const onHandlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragging = true;
    dragMoved = false;
    startY = e.clientY;
    startEdgeY = edgeY;
    handle.setPointerCapture?.(e.pointerId);
  };

  const onHandlePointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    if (!dragMoved && Math.abs(dy) >= DRAG_THRESHOLD_PX) {
      dragMoved = true;
      root.classList.add('is-dragging');
    }
    if (dragMoved) {
      applyHandleY(startEdgeY + dy);
    }
  };

  const onHandlePointerUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-dragging');
    if (handle.hasPointerCapture?.(e.pointerId)) {
      handle.releasePointerCapture(e.pointerId);
    }
    if (dragMoved) {
      suppressNextClick = true;
      placePanel();
      try {
        localStorage.setItem(EDGE_Y_KEY, String(Math.round(edgeY)));
      } catch {
        // Ignore storage errors
      }
    }
  };

  const onHandleClick = () => {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    setOpen(!root.classList.contains('is-open'));
  };

  // Horizontal swipe-left on panel to close
  let swipeStartX = 0;
  let swipeStartY = 0;
  let swiping = false;

  const onPanelTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    swiping = true;
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
  };

  const onPanelTouchEnd = (e: TouchEvent) => {
    if (!swiping || e.changedTouches.length === 0) return;
    swiping = false;
    const dx = e.changedTouches[0].clientX - swipeStartX;
    const dy = e.changedTouches[0].clientY - swipeStartY;
    if (dx <= -SWIPE_CLOSE_PX && Math.abs(dx) > Math.abs(dy)) {
      setOpen(false);
    }
  };

  const handleProxyOrAction = (target: HTMLElement) => {
    const item = target.closest<HTMLElement>('[data-proxy]');
    if (item) {
      setOpen(false);
      document.getElementById(item.dataset.proxy ?? '')?.click();
      return true;
    }
    if (target.closest('[data-dog-toggle]')) {
      setOpen(false);
      const w = window as Window & { __fxGet?: (k: string) => boolean; __fxSet?: (k: string, on: boolean) => void };
      if (w.__fxGet && w.__fxSet) {
        w.__fxSet('dog', !w.__fxGet('dog'));
        window.dispatchEvent(new CustomEvent('kfolio:fx-change', { detail: { key: 'dog' } }));
      }
      return true;
    }
    if (target.closest('a')) {
      setOpen(false);
      return true;
    }
    return false;
  };

  const onPanelClick = (e: MouseEvent) => {
    handleProxyOrAction(e.target as HTMLElement);
  };

  const onTopBtnClick = (e: MouseEvent) => {
    handleProxyOrAction(e.currentTarget as HTMLElement);
  };

  const onScrim = () => setOpen(false);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && root.classList.contains('is-open')) setOpen(false);
  };

  const scrim = root.querySelector<HTMLElement>('[data-edge-close]');
  handle.addEventListener('pointerdown', onHandlePointerDown);
  handle.addEventListener('pointermove', onHandlePointerMove);
  handle.addEventListener('pointerup', onHandlePointerUp);
  handle.addEventListener('pointercancel', onHandlePointerUp);
  handle.addEventListener('click', onHandleClick);
  panel.addEventListener('touchstart', onPanelTouchStart, { passive: true });
  panel.addEventListener('touchend', onPanelTouchEnd, { passive: true });
  panel.addEventListener('click', onPanelClick);
  topBtn?.addEventListener('click', onTopBtnClick);
  scrim?.addEventListener('click', onScrim);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', placePanel);

  cleanup = () => {
    handle.removeEventListener('pointerdown', onHandlePointerDown);
    handle.removeEventListener('pointermove', onHandlePointerMove);
    handle.removeEventListener('pointerup', onHandlePointerUp);
    handle.removeEventListener('pointercancel', onHandlePointerUp);
    handle.removeEventListener('click', onHandleClick);
    panel.removeEventListener('touchstart', onPanelTouchStart);
    panel.removeEventListener('touchend', onPanelTouchEnd);
    panel.removeEventListener('click', onPanelClick);
    topBtn?.removeEventListener('click', onTopBtnClick);
    scrim?.removeEventListener('click', onScrim);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', placePanel);
  };
}

document.addEventListener('astro:page-load', init);

export {};
