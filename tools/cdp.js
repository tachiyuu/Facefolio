// Minimal Chrome DevTools Protocol client for the Materialbook WebView (Node 22+: global fetch and WebSocket).
// Needs a debuggable build (see README.md) and adb on PATH.
'use strict';
const { execFileSync } = require('child_process');

const PACKAGE = process.env.MB_PACKAGE || 'com.tachiyuu.materialbook';
const PORT = Number(process.env.MB_PORT || 9333);

const adb = (...args) => execFileSync('adb', args, { encoding: 'utf8' }).trim();

// Forwards the app's DevTools socket to localhost:PORT and returns the Facebook page target
async function findPage() {
    const pid = adb('shell', 'pidof', PACKAGE).split(/\s+/)[0];
    if (!pid) throw new Error(`${PACKAGE} is not running; open the app first`);
    const sockets = adb('shell', 'cat', '/proc/net/unix');
    if (!sockets.includes(`webview_devtools_remote_${pid}`))
        throw new Error(`No DevTools socket for ${PACKAGE} (pid ${pid}). Is this a debuggable build? See tools/README.md`);
    adb('forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`);
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = targets.find(t => t.type === 'page' && /facebook\.com/.test(t.url));
    if (!page) throw new Error('No facebook.com page in the WebView: ' + targets.map(t => t.url).join(', '));
    return page;
}

async function connect() {
    const page = await findPage();
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
        ws.addEventListener('open', resolve, { once: true });
        ws.addEventListener('error', () => reject(new Error('WebSocket connection failed')), { once: true });
    });

    let nextId = 1;
    const pending = new Map();
    const listeners = new Map();
    ws.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data);
        if (msg.id && pending.has(msg.id)) {
            const { resolve, reject, method } = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
            else resolve(msg.result);
        } else if (msg.method) {
            (listeners.get(msg.method) || []).forEach(fn => fn(msg.params));
        }
    });

    const send = (method, params = {}) => new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject, method });
        ws.send(JSON.stringify({ id, method, params }));
    });
    const on = (method, fn) => listeners.set(method, [...(listeners.get(method) || []), fn]);
    const once = (method, timeout = 30000) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeout);
        on(method, params => { clearTimeout(timer); resolve(params); });
    });

    // Evaluates a function in the page: evaluate((a, b) => ..., a, b). Arguments must be JSON-serialisable.
    const evaluate = async (fn, ...args) => {
        // The sourceURL keeps the tools' own code apart from the app's in CPU profiles
        const expression = `(${fn})(...${JSON.stringify(args)})\n//# sourceURL=mb-tools.js`;
        const { result, exceptionDetails } = await send('Runtime.evaluate',
            { expression, returnByValue: true, awaitPromise: true });
        if (exceptionDetails) throw new Error('In page: ' + (exceptionDetails.exception?.description || exceptionDetails.text));
        return result.value;
    };

    // Loads a URL and waits until the injected scripts ran and the page settled
    const navigate = async (url, settle = 4000) => {
        await send('Page.enable');
        const loaded = once('Page.loadEventFired', 45000);
        await send('Page.navigate', { url });
        await loaded;
        await sleep(settle);
    };

    return { page, send, on, evaluate, navigate, close: () => ws.close() };
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// --name value / --flag arguments
function args(defaults) {
    const out = { ...defaults };
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
        const key = argv[i].replace(/^--/, '');
        if (!(key in defaults)) throw new Error(`Unknown option --${key}. Options: ${Object.keys(defaults).map(k => '--' + k).join(' ')}`);
        if (typeof defaults[key] === 'boolean') out[key] = true;
        else out[key] = typeof defaults[key] === 'number' ? Number(argv[++i]) : argv[++i];
    }
    return out;
}

// Runs main(cdp) and reports errors without a stack trace for the expected ones
function run(main) {
    connect()
        .then(async cdp => { try { await main(cdp); } finally { cdp.close(); } })
        .catch(e => { console.error('Error:', e.message); process.exitCode = 1; });
}

module.exports = { connect, run, args, sleep, adb };
