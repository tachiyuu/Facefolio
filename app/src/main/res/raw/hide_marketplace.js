// Hide Marketplace suggestions in the feed (the header tab is a pinned-tabs setting)
(() => {
    if (window.isDesktopMode()) return;

    const LABELS = new Set(['Marketplace', 'Suggested for you on Marketplace', 'Popular on Marketplace']
        .map(window.normalizeFeedLabel));

    window.addFeedFilter((unit, labels) =>
        location.pathname === '/' && labels.slice(0, 4).some(text => LABELS.has(text)),
        'marketplace'
    );
})();
