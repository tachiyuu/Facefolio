// Health check: loads the home feed in the mobile layout and in the desktop layout (desktop user agent,
// like the app uses in landscape) and prints the in-app self-check (window.__mbHealth) plus any errors
// our scripts logged or threw. The quickest "did Facebook break something?" answer.
// Usage: node tools/health-check.js [--mobile-only] [--wait 20]
'use strict';
const { run, args } = require('./cdp');

const opts = args({ 'mobile-only': false, wait: 20 });
const DESKTOP_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

run(async cdp => {
    let errors = [];
    await cdp.send('Runtime.enable');
    cdp.on('Runtime.consoleAPICalled', p => {
        if (p.type !== 'error' && p.type !== 'warning') return;
        const text = p.args.map(a => a.value ?? a.description).join(' ');
        if (text.includes('[Materialbook]')) errors.push(text.split('\n')[0].slice(0, 200));
    });
    cdp.on('Runtime.exceptionThrown', ({ exceptionDetails: d }) => {
        if (/materialbook-scripts/.test(d.url || '')) errors.push(`line ${d.lineNumber + 1}: ${(d.exception?.description || d.text).split('\n')[0]}`);
    });

    // The self-check finishes when all hooks match or after its 20 s timeout
    const health = () => cdp.evaluate(wait => new Promise(resolve => {
        const end = Date.now() + wait * 1000;
        const poll = () => {
            const h = window.__mbHealth;
            if (!h || h.status !== 'pending' || Date.now() > end)
                resolve(h ? { status: h.status, checks: h.checks, failures: h.failures } : null);
            else setTimeout(poll, 500);
        };
        poll();
    }), opts.wait + 2);

    const layouts = [['mobile', 'https://m.facebook.com/', '']];
    if (!opts['mobile-only']) layouts.push(['desktop', 'https://www.facebook.com/', DESKTOP_UA]);
    let bad = false;
    try {
        for (const [name, url, ua] of layouts) {
            errors = [];
            await cdp.send('Emulation.setUserAgentOverride', { userAgent: ua });
            await cdp.navigate(url, 2000);
            const h = await health();
            const checks = h ? Object.entries(h.checks).map(([k, v]) => `${k}:${v ? 'ok' : 'MISSING'}`).join('  ') : '';
            console.log(`${name.padEnd(8)} ${h ? h.status.toUpperCase().padEnd(8) : 'NO SELF-CHECK (scripts.js did not run?)'} ${checks}`);
            errors.forEach(e => console.log(`         error: ${e}`));
            if (!h || h.status === 'failed' || h.status === 'pending' || errors.length) bad = true;
        }
    } finally {
        // Back to the app's own user agent and the mobile feed
        await cdp.send('Emulation.setUserAgentOverride', { userAgent: '' });
        if (layouts.length > 1) await cdp.navigate('https://m.facebook.com/', 1000);
    }
    console.log(bad ? '\nSomething needs a look: see tools/README.md, "When something broke"' : '\nAll hooks found, no script errors');
    if (bad) process.exitCode = 2;
});
