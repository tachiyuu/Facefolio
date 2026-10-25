// Contrast audit: loads feed, notifications, menu and groups and checks every visible text and icon
// against what is actually painted behind it (WCAG: 4.5:1 for text, 3:1 for large text and icons).
// Run it once per theme you care about (Facebook light/dark, Material You on/off, AMOLED).
// Usage: node tools/contrast-audit.js [--pages feed,notifications,menu,groups] [--screens 3] [--limit 15]
'use strict';
const { run, args } = require('./cdp');

const PAGES = {
    feed: 'https://m.facebook.com/',
    notifications: 'https://m.facebook.com/notifications/',
    menu: 'https://m.facebook.com/bookmarks/',
    groups: 'https://m.facebook.com/groups_browse/your_groups/',
};
const opts = args({ pages: Object.keys(PAGES).join(','), screens: 3, limit: 15 });

// Runs in the page: checks what is in the viewport now
function scanViewport() {
    const parse = value => {
        let m = value.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
        if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
        m = value.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
        if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, m[4] === undefined ? 1 : +m[4]];
        return null;
    };
    const over = (top, bottom) => {
        const a = top[3];
        return [0, 1, 2].map(i => top[i] * a + bottom[i] * (1 - a)).concat(1);
    };
    const lum = c => {
        const [r, g, b] = c.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const hex = c => '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    const ICON = /^[\s\u{E000}-\u{F8FF}\u{F0000}-\u{10FFFF}]+$/u;

    // Composites the backgrounds painted at (x, y), top-most first; null when an image or video is behind.
    // Facebook paints most backgrounds on ::before (the bg-s* classes), which elementsFromPoint doesn't
    // return, so each element's ::after and ::before count as layers above its own background.
    const backgroundAt = (x, y, self) => {
        const stack = document.elementsFromPoint(x, y);
        const start = stack.findIndex(el => el === self || self.contains(el));
        // Not at its own centre (clipped), or under something opaque (the pull-to-refresh spinner
        // waits under the page): nobody sees it
        if (start < 0) return 'hidden';
        const opaque = el => [null, '::before', '::after'].some(pseudo => {
            const style = getComputedStyle(el, pseudo);
            return (!pseudo || style.content !== 'none') && (parse(style.backgroundColor) || [0, 0, 0, 0])[3] >= 1;
        });
        if (stack.slice(0, start).some(el => !self.contains(el) && !el.contains(self) && opaque(el))) return 'hidden';
        const layers = [];
        outer:
        for (const el of stack.slice(start)) {
            if (/^(IMG|VIDEO|CANVAS|PICTURE)$/.test(el.tagName)) return null;
            for (const pseudo of ['::after', '::before', null]) {
                const style = getComputedStyle(el, pseudo);
                if (pseudo && style.content === 'none') continue;
                if (style.backgroundImage !== 'none' && style.backgroundImage.includes('url(')) return null;
                const bg = parse(style.backgroundColor);
                if (bg && bg[3] > 0) {
                    layers.push(bg);
                    if (bg[3] >= 1) break outer;
                }
            }
        }
        // A translucent scrim with nothing opaque below is drawn over media (the "+2" on photo grids)
        if (layers.length && layers[layers.length - 1][3] < 1) return null;
        let color = [255, 255, 255, 1]; // WebView default canvas
        for (let i = layers.length - 1; i >= 0; i--) color = over(layers[i], color);
        return color;
    };
    const opacity = el => {
        let o = 1;
        for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= +getComputedStyle(e).opacity;
        return o;
    };
    const path = el => {
        const parts = [];
        for (let e = el; e && parts.length < 3 && e !== document.body; e = e.parentElement) {
            const cls = typeof e.className === 'string' ? e.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
            parts.unshift(e.localName + (e.id ? '#' + e.id : '') + (cls ? '.' + cls : ''));
        }
        return parts.join(' > ');
    };
    const inView = r => r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;

    // elementsFromPoint skips pointer-events: none layers, which Facebook uses a lot
    const hitAll = document.createElement('style');
    hitAll.textContent = '* { pointer-events: auto !important; }';
    document.head.appendChild(hitAll);

    const results = [];
    const check = (el, fgValue, kind, sample) => {
        const r = el.getBoundingClientRect();
        if (!inView(r)) return;
        const style = getComputedStyle(el);
        if (style.visibility !== 'visible') return;
        let fg = parse(fgValue);
        if (!fg || fg[3] === 0) return;
        const o = opacity(el);
        if (o < 0.05) return;
        const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1);
        const y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
        const bg = backgroundAt(x, y, el);
        if (bg === 'hidden') return;
        if (!bg) { // text over a photo: not measurable this way
            results.push({ kind, skipped: true, key: `${Math.round(r.left + scrollX)},${Math.round(r.top + scrollY)},${sample.slice(0, 10)}` });
            return;
        }
        fg = over([fg[0], fg[1], fg[2], fg[3] * o], bg);
        const size = parseFloat(style.fontSize), weight = parseInt(style.fontWeight) || 400;
        const large = kind === 'text' && (size >= 24 || (size >= 18.66 && weight >= 700));
        const need = kind === 'text' && !large ? 4.5 : 3;
        const value = ratio(fg, bg);
        results.push({ kind, ok: value >= need, ratio: Math.round(value * 100) / 100, need,
            fg: hex(fg), bg: hex(bg), sample: sample.slice(0, 40), path: path(el),
            key: `${Math.round(r.left + scrollX)},${Math.round(r.top + scrollY)},${sample.slice(0, 10)}` });
    };

    try {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const seen = new Set();
        for (let node; (node = walker.nextNode());) {
            const text = node.textContent.trim();
            const el = node.parentElement;
            if (!text || !el || seen.has(el) || el.closest('script, style, noscript')) continue;
            seen.add(el);
            if (parseFloat(getComputedStyle(el).fontSize) < 6) continue;
            check(el, getComputedStyle(el).color, ICON.test(text) ? 'icon' : 'text', text);
        }
        document.querySelectorAll('svg').forEach(svg => {
            const shape = [...svg.querySelectorAll('path, circle, rect, ellipse, polygon, use')].find(s => {
                const st = getComputedStyle(s);
                return st.fill !== 'none' || st.stroke !== 'none';
            });
            if (!shape) return;
            const st = getComputedStyle(shape);
            check(svg, st.fill !== 'none' && !st.fill.startsWith('url') ? st.fill : st.stroke, 'icon', '<svg>');
        });
    } finally {
        hitAll.remove(); // never leave the page with every element clickable
    }
    return results;
}

run(async cdp => {
    const startUrl = await cdp.evaluate(() => location.href);
    let failedPages = 0;
    const theme = await cdp.evaluate(() => ({
        facebook: document.documentElement.getAttribute('data-mb-theme'),
        materialYou: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || null,
    }));
    console.log(`Facebook theme: ${theme.facebook}, accent: ${theme.materialYou}\n`);

    for (const name of opts.pages.split(',')) {
        if (!PAGES[name]) throw new Error(`Unknown page ${name}; pages: ${Object.keys(PAGES).join(', ')}`);
        await cdp.navigate(PAGES[name], 4000);
        const results = new Map();
        for (let s = 0; s < opts.screens; s++) {
            if (s) {
                const moved = await cdp.evaluate(() => { const y = scrollY; scrollBy(0, Math.round(innerHeight * 0.9)); return scrollY !== y; });
                if (!moved) break;
                await new Promise(r => setTimeout(r, 1200));
            }
            (await cdp.evaluate(scanViewport)).forEach(r => results.set(r.key, r));
        }

        const skipped = [...results.values()].filter(r => r.skipped).length;
        const all = [...results.values()].filter(r => !r.skipped);
        const fails = all.filter(r => !r.ok);
        const count = kind => `${all.filter(r => r.kind === kind).length} ${kind}s (${fails.filter(r => r.kind === kind).length} failing)`;
        console.log(`${name.padEnd(14)} ${count('text')}, ${count('icon')}, ${skipped} over images (not measured)`);
        if (fails.length) failedPages++;

        // Same colours on the same kind of element are one problem
        const groups = new Map();
        fails.forEach(r => {
            const key = `${r.kind}|${r.fg}|${r.bg}`;
            const g = groups.get(key) || { ...r, count: 0, samples: new Set() };
            g.count++; g.samples.add(r.sample);
            groups.set(key, g);
        });
        [...groups.values()].sort((a, b) => a.ratio - b.ratio).slice(0, opts.limit).forEach(g => {
            const samples = [...g.samples].map(t => t.replace(/[\u{E000}-\u{F8FF}\u{F0000}-\u{10FFFF}]/gu, '□')).slice(0, 3).join(' / ');
            console.log(`    ${g.kind.padEnd(4)} ${String(g.ratio).padStart(5)}:1 < ${g.need}  ${g.fg} on ${g.bg}  x${g.count}  "${samples}"  ${g.path}`);
        });
        if (groups.size > opts.limit) console.log(`    ... ${groups.size - opts.limit} more colour pairs (--limit)`);
    }

    await cdp.navigate(startUrl, 1000);
    console.log(failedPages ? `\n${failedPages} page(s) with contrast failures` : '\nAll checked text and icons meet WCAG contrast');
    if (failedPages) process.exitCode = 2;
});
