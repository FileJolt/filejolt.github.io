/* FileJolt: progressive enhancement, with no analytics or remote dependencies. */
(() => {
  'use strict';

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('mobile-nav');
  const header = document.querySelector('.site-header');
  if (toggle && nav && header) {
    const desktop = window.matchMedia('(min-width: 781px)');
    const setOpen = (open, restoreFocus = false) => {
      if (restoreFocus) toggle.focus({ preventScroll: true });
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      nav.hidden = !open;
      document.body.classList.toggle('menu-open', open);
    };
    setOpen(false);
    toggle.hidden = false;
    toggle.addEventListener('click', () => setOpen(nav.hidden));
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !nav.hidden) {
        event.preventDefault();
        setOpen(false, true);
      }
    });
    document.addEventListener('click', event => {
      if (!nav.hidden && !header.contains(event.target)) setOpen(false);
    });
    document.addEventListener('focusin', event => {
      if (!nav.hidden && !header.contains(event.target)) setOpen(false);
    });
    desktop.addEventListener('change', () => {
      if (desktop.matches && (nav.contains(document.activeElement) || document.activeElement === toggle)) {
        header.querySelector('.desktop-nav a')?.focus({ preventScroll: true });
      }
      setOpen(false);
    });
    window.addEventListener('pageshow', () => setOpen(false));
  }

  const status = document.getElementById('site-status');
  const announce = message => { if (status) status.textContent = message; };
  const resetTimers = new WeakMap();
  document.querySelectorAll('[data-copy]').forEach(button => {
    const label = button.textContent;
    const context = button.getAttribute('data-copy-label') || 'Checksum';
    button.hidden = false;
    button.addEventListener('click', async () => {
      window.clearTimeout(resetTimers.get(button));
      button.disabled = true;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(button.dataset.copy || '');
        button.textContent = 'Copied';
        announce(`${context} copied to clipboard.`);
      } catch {
        const code = button.closest('.checksum-data')?.querySelector('code');
        const selection = window.getSelection();
        if (code && selection) {
          const range = document.createRange();
          range.selectNodeContents(code);
          selection.removeAllRanges();
          selection.addRange(range);
          button.textContent = 'Selected';
          announce(`${context} selected. Press Ctrl+C, or use your device’s Copy command.`);
        } else {
          button.textContent = 'Try again';
          announce(`Could not copy ${context.toLowerCase()}. Select the checksum text to copy it manually.`);
        }
      } finally {
        button.disabled = false;
        resetTimers.set(button, window.setTimeout(() => {
          button.textContent = label;
          announce('');
        }, 4000));
      }
    });
  });

  const shots = document.querySelectorAll('[data-screenshot]');
  if (!shots.length || typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'screenshot-dialog';
  dialog.setAttribute('aria-labelledby', 'screenshot-title');
  const bar = document.createElement('div');
  bar.className = 'screenshot-dialog-bar';
  const title = document.createElement('h2');
  title.id = 'screenshot-title';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'screenshot-close';
  close.textContent = 'Close';
  close.setAttribute('aria-label', 'Close screenshot');
  const fullImage = document.createElement('img');
  fullImage.className = 'screenshot-full-image';
  bar.append(title, close);
  dialog.append(bar, fullImage);
  document.body.append(dialog);

  let opener;
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('screenshot-open');
    opener?.focus({ preventScroll: true });
  });
  shots.forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const original = link.querySelector('img');
    opener = link;
    title.textContent = link.dataset.screenshot;
    fullImage.src = link.href;
    fullImage.alt = original?.alt || link.dataset.screenshot;
    dialog.showModal();
    document.body.classList.add('screenshot-open');
    close.focus({ preventScroll: true });
  }));
})();
