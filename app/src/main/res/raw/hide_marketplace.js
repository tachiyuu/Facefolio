// Hide the Marketplace tab and Marketplace suggestions in the feed
(() => {
    if (window.isDesktopMode()) return;

    window.hideHeaderTab('marketplace', '󰎂');

    const LABELS = new Set(['Marketplace', 'Suggested for you on Marketplace', 'Popular on Marketplace']
        .map(window.normalizeFeedLabel));

    window.addFeedFilter((unit, labels) =>
        location.pathname === '/' && labels.slice(0, 4).some(text => LABELS.has(text))
    );
})();
