/**
 * Mobile quick panel (see EdgePanel.astro).
 * - The `>` tab sits on the left edge; tap/click it to open the panel.
 * - Tap the scrim, press Escape, or pick an item to close.
 * - Items with `data-proxy="<id>"` click the matching header/footer button.
 */

let cleanup: (() => void) | null = null;

function init() {
  cleanup?.();
  cleanup = null;

  const root = document.querySelector<HTMLElement>('[data-edge]');
  const handle = root?.querySelector<HTMLButtonElement>('.edge-handle');
  const panel = root?.querySelector<HTMLElement>('.edge-panel');
  if (!root || !handle || !panel) return;

  const placePanel = () => {
    const h = panel.offsetHeight || 360;
    const top = Math.min(window.innerHeight - h - 12, Math.max(12, window.innerHeight / 2 - h / 2));
    root.style.setProperty('--edge-panel-top', `${top}px`);
  };
  placePanel();

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

  const onHandleClick = () => {
    setOpen(!root.classList.contains('is-open'));
  };

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

  const scrim = root.querySelector<HTMLElement>('[data-edge-close]');
  handle.addEventListener('click', onHandleClick);
  panel.addEventListener('click', onPanelClick);
  scrim?.addEventListener('click', onScrim);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', placePanel);

  cleanup = () => {
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', placePanel);
  };
}

document.addEventListener('astro:page-load', init);

export {};
