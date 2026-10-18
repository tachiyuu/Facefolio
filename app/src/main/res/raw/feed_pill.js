// "Friends & groups only · N hidden" pill at the top of the home feed. Counts the items the feed
// filter hid (data-mb-hidden, see scripts.js) and lets the user peek at them for a moment.
(() => {
    const ID = 'mb-feed-pill';
    const ITEM = '[data-mb-hidden=""]';
    const POST = 'div[data-tracking-duration-id]';

    const style = document.createElement('style');
    style.textContent = `
        #${ID} {
            display: flex; align-items: center; gap: 10px; box-sizing: border-box;
            width: calc(100% - 24px); height: 44px; margin: 8px 12px; padding: 0 16px;
            border: 0; border-radius: 22px; font: inherit; font-size: 14px; text-align: left;
            background: var(--mb-pill-bg, rgba(128, 128, 128, 0.16)); color: inherit;
        }
        #${ID} span:first-of-type { flex-grow: 1; opacity: 0.8; }
        #${ID} span:last-of-type { font-weight: 600; color: var(--mb-pill-accent, #1877f2); }
    `;
    document.head.appendChild(style);

    const pill = document.createElement('button');
    pill.id = ID;
    pill.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M3 3l18 18"/><path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c5 0 9 5 9 7 0 .9-.8 2.3-2.1 3.6M6.4 6.4C4.3 7.8 3 10.2 3 12c0 2 4 7 9 7 1.6 0 3-.4 4.3-1.1"/>
        </svg>
        <span></span><span></span>`;
    const [label, action] = pill.querySelectorAll('span');

    // The pill is the app's own UI, so it takes the app's accent color
    const accent = window.MaterialYouBridge?.getMaterialYouPrimaryRgbString?.();
    if (accent) pill.style.setProperty('--mb-pill-accent', accent);

    pill.onclick = () => {
        document.documentElement.classList.toggle('mb-peek');
        update();
    };

    function update() {
        const count = document.querySelectorAll(ITEM).length;
        const peeking = document.documentElement.classList.contains('mb-peek');
        const light = document.querySelector('meta[name="theme-color"]')?.content?.toLowerCase() === '#ffffff';
        pill.style.color = light ? '#080809' : '#e4e6eb';
        label.textContent = `Friends & groups only · ${count} hidden`;
        action.textContent = peeking ? 'Hide' : 'Peek';
        pill.style.display = count ? '' : 'none';
    }

    // Sits above the first post (below the composer and stories). Placed once per feed so it
    // doesn't jump when Facebook recycles posts while scrolling.
    function place() {
        if (location.pathname !== '/') return pill.remove();
        if (pill.isConnected) return;
        const first = document.querySelector(POST);
        let post = first;
        for (let up = post?.parentElement?.closest(POST); up; up = up.parentElement?.closest(POST)) post = up;
        post?.before(pill);
    }

    let scheduled = false;
    const refresh = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            place();
            update();
        });
    };

    document.addEventListener('mb-feed-hidden', refresh);
    new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true });
    refresh();
})();
