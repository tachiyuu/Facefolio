// "N hidden · Show" line at the top of the home feed. Counts the items the feed filter hid
// (data-mb-hidden, see scripts.js) and lets the user peek at them for a moment.
// Deliberately quiet: no card, border or icon, Facebook's secondary text colour, and the same
// background as the posts around it, so it reads as a caption rather than one more thing to look at.
(() => {
    const ID = 'mb-feed-pill';
    const ITEM = '[data-mb-hidden=""]';
    const POST = 'div[data-tracking-duration-id]';

    const style = document.createElement('style');
    style.textContent = `
        #${ID} {
            display: flex; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box;
            width: 100%; min-height: 36px; margin: 0; padding: 0 16px;
            border: 0; border-radius: 0; font: inherit; font-size: 13px; line-height: 1;
            background: var(--mb-row-bg, transparent); color: var(--mb-row-fg, #65676b);
            pointer-events: auto !important; /* Facebook's page root is pointer-events: none */
        }
        #${ID} span:last-of-type { font-weight: 600; }
    `;
    document.head.appendChild(style);

    const row = document.createElement('button');
    row.id = ID;
    row.setAttribute('data-mb-ui', ''); // the feed filter ignores changes inside the app's own UI
    row.innerHTML = '<span></span><span aria-hidden="true">·</span><span></span>';
    const [label, , action] = row.querySelectorAll('span');

    // Facebook's page-level handlers would otherwise also act on the tap
    row.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        document.documentElement.classList.toggle('mb-peek');
        update();
    });

    // Post cards paint their background with a ::before; borrow it so the row blends in. Re-read on
    // every update, not once: themes repaint cards after load (AMOLED turns them black), and a colour
    // captured earlier left a grey strip between black posts.
    let cardSource = null;
    function matchCards() {
        if (!cardSource?.isConnected) return;
        const card = getComputedStyle(cardSource, '::before').backgroundColor;
        const bg = card && card !== 'rgba(0, 0, 0, 0)' ? card : (window.isFacebookDark() ? '#242526' : '#ffffff');
        const fg = window.isFacebookDark() ? '#b0b3b8' : '#65676b';
        if (row.style.getPropertyValue('--mb-row-bg') !== bg) row.style.setProperty('--mb-row-bg', bg);
        if (row.style.getPropertyValue('--mb-row-fg') !== fg) row.style.setProperty('--mb-row-fg', fg);
    }

    // Writes only on change: every write is a DOM mutation, which would wake this observer (and the
    // feed filter's) again on the next frame, forever
    const set = (el, key, value) => { if (el[key] !== value) el[key] = value; };

    function update() {
        const count = document.querySelectorAll(ITEM).length;
        const peeking = document.documentElement.classList.contains('mb-peek');
        set(label, 'textContent', `${count} hidden`);
        set(action, 'textContent', peeking ? 'Hide' : 'Show');
        if (row.getAttribute('aria-label') !== `${count} hidden`) row.setAttribute('aria-label', `${count} hidden`);
        set(row.style, 'display', count ? '' : 'none');
        matchCards();
    }

    // Sits right above the first post (below the composer and stories). Placed once per feed so it
    // doesn't jump when Facebook recycles posts while scrolling.
    function place() {
        if (location.pathname !== '/') return row.remove();
        if (row.isConnected) return;
        let post = document.querySelector(POST);
        for (let up = post?.parentElement?.closest(POST); up; up = up.parentElement?.closest(POST)) post = up;
        if (!post) return;
        cardSource = post;
        // Above the post's thin divider, so the line joins the composer card instead of
        // sitting between two dividers as a section of its own
        const divider = post.previousElementSibling;
        (divider && divider.offsetHeight <= 12 ? divider : post).before(row);
    }

    const refresh = () => {
        place();
        update();
    };

    document.addEventListener('mb-feed-hidden', refresh);
    window.onDomChange(refresh);
    refresh();
})();
