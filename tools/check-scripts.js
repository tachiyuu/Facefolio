// Static check of the injected scripts, no phone needed: every script parses, and every
// window.__mbFB reference names a hook that exists (a typo there yields undefined, which fails silently).
// Usage: node tools/check-scripts.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const RAW = path.join(ROOT, 'app/src/main/res/raw');
const VIEWMODEL = path.join(ROOT, 'app/src/main/java/com/tachiyuu/facefolio/ui/viewmodel/MainViewModel.kt');
const problems = [];

// The hooks block at the top of scripts.js, evaluated on its own
const main = fs.readFileSync(path.join(RAW, 'scripts.js'), 'utf8');
const start = main.indexOf('window.__mbFB = ');
const end = main.indexOf('\n});', start);
if (start < 0 || end < 0) throw new Error('window.__mbFB block not found in scripts.js');
const sandbox = { window: {} };
vm.runInNewContext(main.slice(start, end + 4), sandbox);
const FB = sandbox.window.__mbFB;

const resolve = keys => keys.reduce((obj, key) => (obj == null ? undefined : obj[key]), FB);
const lineOf = (src, index) => src.slice(0, index).split('\n').length;

for (const file of fs.readdirSync(RAW).filter(f => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(RAW, file), 'utf8');

    // Parsed the way fetchScripts.kt wraps it: inside a function, in its own try block
    try { new vm.Script(`(() => { try {\n${src}\n} catch (e) {} })`, { filename: file }); }
    catch (e) { problems.push(`${file}: does not parse: ${e.message}`); continue; }

    for (const m of src.matchAll(/__mbFB((?:\??\.[A-Za-z_$][\w$]*)+)/g)) {
        const keys = m[1].split('.').map(k => k.replace('?', '')).filter(Boolean);
        if (resolve(keys) === undefined) problems.push(`${file}:${lineOf(src, m.index)}: window.__mbFB.${keys.join('.')} does not exist`);
    }
    for (const m of src.matchAll(/\{([^{}]*)\}\s*=\s*window\.__mbFB((?:\.[\w$]+)*)/g)) {
        const base = m[2].split('.').filter(Boolean);
        for (const part of m[1].split(',').map(s => s.trim()).filter(Boolean)) {
            const key = part.split(':')[0].trim();
            if (resolve([...base, key]) === undefined)
                problems.push(`${file}:${lineOf(src, m.index)}: window.__mbFB.${[...base, key].join('.')} does not exist`);
        }
    }
}

// The other scripts rely on scripts.js running first
const order = [...fs.readFileSync(VIEWMODEL, 'utf8').matchAll(/R\.raw\.(\w+)/g)].map(m => m[1]);
if (order[0] !== 'scripts') problems.push(`MainViewModel.kt: scripts.js must be the first script, found ${order[0]}`);

// Feed filter rules without a name show up as "unnamed" in the feed audit
for (const file of fs.readdirSync(RAW).filter(f => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(RAW, file), 'utf8');
    for (const m of src.matchAll(/addFeedFilter\(/g)) {
        // Find the call's closing parenthesis and look for a string literal as its last argument
        let depth = 0, i = m.index + m[0].length - 1;
        for (; i < src.length; i++) {
            if (src[i] === '(') depth++;
            else if (src[i] === ')' && --depth === 0) break;
        }
        if (!/,\s*['"][\w-]+['"]\s*$/.test(src.slice(m.index, i))) problems.push(`${file}:${lineOf(src, m.index)}: addFeedFilter rule has no name`);
    }
}

if (problems.length) {
    problems.forEach(p => console.log('FAIL ' + p));
    process.exitCode = 1;
} else {
    console.log(`OK: ${fs.readdirSync(RAW).filter(f => f.endsWith('.js')).length} scripts parse, all window.__mbFB references resolve, feed rules are named`);
}
