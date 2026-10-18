// Hide like / comment / share counts. Action buttons are an aria-hidden icon followed by a
// text holding just the number; only that number is hidden, the buttons keep working.
(() => {
    const MARK = 'data-mb-count';
    const NUMBER = /^\d[\d.,\s]*[KMBkmb]?$/;
    // TextArea in the feed, ServerTextArea on a post's own page
    const TEXT = '[role="button"] [data-type="text"]:not([aria-hidden="true"])';

    const style = document.createElement('style');
    style.textContent = `[${MARK}] { display: none !important; }`;
    document.head.appendChild(style);

    function hideCounts() {
        document.querySelectorAll(TEXT).forEach(text => {
            if (text.hasAttribute(MARK) || !NUMBER.test(text.textContent.trim())) return;
            if (!text.parentElement.querySelector(':scope > [aria-hidden="true"]')) return;
            text.setAttribute(MARK, '');
        });
    }

    let scheduled = false;
    new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => { scheduled = false; hideCounts(); });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    hideCounts();
})();
