/* FileJolt website interactions: no analytics, no remote dependencies. */
(() => {
  'use strict';
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('mobile-nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      nav.hidden = !open;
      document.body.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', () => setOpen(nav.hidden));
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
  }
  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const value = button.getAttribute('data-copy') || '';
      const previous = button.textContent;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard API not supported');
        await navigator.clipboard.writeText(value);
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Select checksum above';
      }
      button.setAttribute('aria-label', button.textContent);
      window.setTimeout(() => { button.textContent = previous; button.removeAttribute('aria-label'); }, 2200);
    });
  });
})();
