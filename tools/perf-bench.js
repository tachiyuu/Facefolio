// Perf benchmark: scrolls the home feed for a while under the CPU profiler and splits the main-thread
// time into ours (the injected bundle, facefolio-scripts.js) and Facebook's, plus the browser's
// style/layout/paint work. Lists our hottest functions, which is where a slowdown usually starts.
// Usage: node tools/perf-bench.js [--seconds 10] [--speed 15] [--top 10] [--reload]
'use strict';
const { run, args, sleep } = require('./cdp');

const opts = args({ seconds: 10, speed: 15, top: 10, reload: false });
const OURS = /facefolio-scripts\.js/;

run(async cdp => {
    if (opts.reload || !/^https:\/\/m\.facebook\.com\/(\?|$)/.test(await cdp.evaluate(() => location.href)))
        await cdp.navigate('https://m.facebook.com/', 6000);
    await cdp.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);

    await cdp.send('Performance.enable');
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); // microseconds
    const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));

    const before = await metric();
    await cdp.send('Profiler.start');
    // Scroll a fixed distance per frame in the page, like a steady fling
    const frames = await cdp.evaluate((seconds, speed) => new Promise(resolve => {
        const end = performance.now() + seconds * 1000;
        let frames = 0;
        const step = () => {
            frames++;
            window.scrollBy(0, speed);
            if (performance.now() < end) requestAnimationFrame(step); else resolve(frames);
        };
        requestAnimationFrame(step);
    }), opts.seconds, opts.speed);
    const { profile } = await cdp.send('Profiler.stop');
    const after = await metric();

    // Self time per profile node, from the samples
    const nodes = new Map(profile.nodes.map(n => [n.id, n]));
    const parent = new Map();
    profile.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
    const self = new Map();
    const interval = (profile.endTime - profile.startTime) / profile.samples.length;
    profile.samples.forEach((id, i) => {
        const dt = profile.timeDeltas[i + 1] ?? interval;
        self.set(id, (self.get(id) || 0) + dt / 1000); // ms
    });

    // Native frames (no script) belong to whoever called them
    const category = id => {
        const n = nodes.get(id), f = n.callFrame;
        if (f.functionName === '(idle)') return 'idle';
        if (f.functionName === '(program)') return 'browser';
        if (f.functionName === '(garbage collector)') return 'gc';
        if (f.functionName === '(root)') return 'idle';
        if (OURS.test(f.url)) return 'ours';
        if (f.url === 'mb-tools.js') return 'scroll driver';
        if (f.url) return 'facebook';
        if (f.scriptId !== '0') return 'unattributed'; // inline script without a URL (old build without sourceURL?)
        return parent.has(id) ? category(parent.get(id)) : 'browser';
    };

    const totals = {};
    const hot = { ours: new Map(), unattributed: new Map() };
    for (const [id, ms] of self) {
        const cat = category(id);
        totals[cat] = (totals[cat] || 0) + ms;
        if (hot[cat]) {
            // Group by the nearest frame with a script (a native call is charged to its caller)
            let n = nodes.get(id);
            while (n.callFrame.scriptId === '0' && parent.has(n.id)) n = nodes.get(parent.get(n.id));
            const key = `${n.callFrame.functionName || '(anonymous)'} :${n.callFrame.lineNumber + 1}`;
            hot[cat].set(key, (hot[cat].get(key) || 0) + ms);
        }
    }

    const wall = (profile.endTime - profile.startTime) / 1000;
    const busy = Object.entries(totals).filter(([cat]) => cat !== 'idle').reduce((sum, [, t]) => sum + t, 0);
    const pct = (ms, of) => (of ? (100 * ms / of).toFixed(1) : '0.0') + '%';
    const ms = v => `${v.toFixed(0).padStart(6)} ms`;
    const delta = name => ((after[name] || 0) - (before[name] || 0)) * 1000;

    console.log(`Scrolled ${opts.seconds}s at ${opts.speed}px/frame: ${frames} frames (${(frames / opts.seconds).toFixed(0)} fps)\n`);
    console.log('Main-thread CPU (profiler samples)');
    for (const cat of ['ours', 'facebook', 'unattributed', 'gc', 'browser', 'scroll driver']) {
        if (!totals[cat]) continue;
        console.log(`  ${cat.padEnd(13)} ${ms(totals[cat])}  ${pct(totals[cat], busy).padStart(6)} of busy`);
    }
    console.log(`  ${'busy'.padEnd(13)} ${ms(busy)}  ${pct(busy, wall).padStart(6)} of ${wall.toFixed(0)} ms wall`);
    const js = (totals.ours || 0) + (totals.facebook || 0) + (totals.unattributed || 0);
    console.log(`\nOur share of JavaScript time: ${pct(totals.ours || 0, js)}`);
    if (!totals.ours && totals.unattributed)
        console.log('(No samples carry facefolio-scripts.js; this build predates the sourceURL, so ours is inside "unattributed")');

    console.log('\nRenderer work (Performance metrics, includes style/layout our CSS and DOM writes cause)');
    for (const [label, name] of [['script', 'ScriptDuration'], ['style recalc', 'RecalcStyleDuration'], ['layout', 'LayoutDuration'], ['all tasks', 'TaskDuration']])
        console.log(`  ${label.padEnd(13)} ${ms(delta(name))}`);

    const list = (title, map, count) => {
        if (!map.size) return;
        console.log(`\n${title}`);
        [...map].sort((a, b) => b[1] - a[1]).slice(0, count).forEach(([name, t]) => console.log(`  ${ms(t)}  ${name}`));
    };
    list('Our hottest functions (self time, line in the injected bundle)', hot.ours, opts.top);
    list('Hottest scripts without a URL (Facebook\'s eval\'d code, or ours on a build without the sourceURL)', hot.unattributed, 3);
});
