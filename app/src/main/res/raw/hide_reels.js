(() => {
  const isDesktop = window.isDesktopMode && window.isDesktopMode();

  if (isDesktop) {
    const CONTAINER = window.__mbFB.desktop.reelsShelf;
    const CHILD = window.__mbFB.desktop.reelsShelfChild;

    const handle = node => {
      if (!(node instanceof HTMLElement)) return;
      const targets = node.matches(CONTAINER) ? [node] : node.querySelectorAll(CONTAINER);
      targets.forEach(container => {
        if (container.querySelector(CHILD)) container.style.display = 'none';
      });
    };

    document.querySelectorAll(CONTAINER).forEach(handle);

    new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes.forEach(handle));
    }).observe(document.body, { childList: true, subtree: true });

  } else {
    const ICONS = window.__mbFB.glyphs.reels;

    // Reels shelves in the feed go through the feed filter, so the feed pill counts them
    window.addFeedFilter(unit =>
      [...unit.querySelectorAll('.fl.ac .native-text')].some(el => ICONS.includes(el.textContent.trim())),
      'reels'
    );
  }
})();
