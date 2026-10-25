// Feed audit: scrolls the home feed and reports every feed item, which rule hid it (data-mb-rule,
// set by addFeedFilter in scripts.js) and any ad that is still visible. Also prints the self-check.
// Usage: node tools/feed-audit.js [--scrolls 20] [--reload] [--all]
'use strict';
const { run, args, sleep } = require('./cdp');

const opts = args({ scrolls: 20, reload: false, all: false });

// Runs in the page: records the outermost feed items not seen yet, and refreshes the ones already seen
// (an item can be hidden after its labels load). Facebook recycles items far off screen, so this runs
// after every scroll step and the records accumulate on the Node side.
function scan() {
    const FB = window.__mbFB;
    window.__mbAuditIds = window.__mbAuditIds || new WeakMap();
    window.__mbAuditNext = window.__mbAuditNext || 1;
    const ids = window.__mbAuditIds;

    // Ad signals that do not depend on adblock.js, so an ad its rule misses still shows up
    const AD_WORDS = /^(sponsored|ad|ads|paid partnership)$/;
    const AD_MARKUP = 'a[href*="/ads/about"], a[href*="/ad_preferences"], a[href*="l.facebook.com/l.php"][href*="ad_id"]';

    const outer = el => {
        let unit = el, parent;
        while ((parent = unit.parentElement?.closest(FB.feedItem))) unit = parent;
        return unit;
    };
    const units = new Set([...document.querySelectorAll(FB.feedItem)].map(outer));

    return [...units].map(unit => {
        if (!ids.has(unit)) ids.set(unit, window.__mbAuditNext++);
        const labels = window.feedLabels ? window.feedLabels(unit) : [];
        const adSignals = [];
        if (labels.some(t => AD_WORDS.test(t))) adSignals.push('label');
        if (unit.querySelector(AD_MARKUP)) adSignals.push('markup');
        const rect = unit.getBoundingClientRect();
        return {
            id: ids.get(unit),
            hidden: unit.hasAttribute('data-mb-hidden'),
            rule: unit.getAttribute('data-mb-rule'),
            header: unit.querySelector('[role="tab"]') !== null,
            height: Math.round(rect.height),
            labels: labels.slice(0, 6),
            adSignals,
        };
    });
}

run(async cdp => {
    if (opts.reload) await cdp.navigate('https://m.facebook.com/', 6000);
    const url = await cdp.evaluate(() => location.href);
    if (!/^https:\/\/m\.facebook\.com\/(\?|$)/.test(url)) {
        console.log(`Not on the home feed (${url}); loading it`);
        await cdp.navigate('https://m.facebook.com/', 6000);
    }
    await cdp.evaluate(() => window.scrollTo(0, 0));

    const items = new Map();
    const collect = async () => (await cdp.evaluate(scan)).forEach(r => items.set(r.id, r));

    await collect();
    for (let i = 0; i < opts.scrolls; i++) {
        await cdp.evaluate(() => window.scrollBy(0, Math.round(innerHeight * 0.8)));
        await sleep(900);
        await collect();
        process.stdout.write(`\rScrolling ${i + 1}/${opts.scrolls}, ${items.size} items seen`);
    }
    await sleep(1500); // late labels
    await collect();
    process.stdout.write('\n\n');

    const health = await cdp.evaluate(() => {
        const h = window.__mbHealth;
        if (h && h.run) h.run();
        return h ? { status: h.status, checks: h.checks, failures: h.failures } : null;
    });

    // Facebook rebuilds recycled posts as new nodes; the same labels mean the same post (latest record wins)
    const unique = new Map();
    [...items.values()].filter(r => !r.header).sort((a, b) => a.id - b.id)
        .forEach(r => unique.set(r.labels.length ? r.labels.join('|') : 'id' + r.id, r));
    const all = [...unique.values()].sort((a, b) => a.id - b.id);
    const hidden = all.filter(r => r.hidden);
    const leaked = all.filter(r => !r.hidden && r.adSignals.length);
    const byRule = {};
    hidden.forEach(r => { byRule[r.rule || '(no rule)'] = (byRule[r.rule || '(no rule)'] || 0) + 1; });

    console.log('Self-check (window.__mbHealth):', health
        ? `${health.status.toUpperCase()}  ` + Object.entries(health.checks).map(([k, v]) => `${k}:${v ? 'ok' : 'MISSING'}`).join('  ')
        : 'not present (old build or scripts.js failed)');
    console.log(`Items: ${all.length} seen, ${hidden.length} hidden, ${all.length - hidden.length} shown`);
    console.log('Hidden by rule:', Object.keys(byRule).length ? Object.entries(byRule).map(([k, v]) => `${k} ${v}`).join(', ') : 'none');
    if (!all.length) console.log('WARNING: no feed items matched window.__mbFB.feedItem, the feed selector is probably broken');

    // Icon font glyphs (private use area) print as boxes; drop them
    const text = r => r.labels.map(t => t.replace(/[\u{E000}-\u{F8FF}\u{F0000}-\u{10FFFF}]/gu, '').trim()).filter(Boolean).join(' | ');
    const line = r => `  #${String(r.id).padEnd(4)} ${(r.hidden ? 'hidden:' + r.rule : 'shown').padEnd(18)} ${String(r.height).padStart(5)}px  ${text(r).slice(0, 90)}`;
    console.log(`\nVisible ads: ${leaked.length ? leaked.length + ' (adblock missed these)' : 'none'}`);
    leaked.forEach(r => console.log(line(r) + `  [${r.adSignals.join(',')}]`));

    console.log(`\n${opts.all ? 'All items' : 'Hidden items'}:`);
    (opts.all ? all : hidden).forEach(r => console.log(line(r)));
    if (!opts.all) console.log('\n(--all lists the shown items too)');
    if (leaked.length || (health && health.status === 'failed')) process.exitCode = 2;
});
