package com.tachiyuu.materialbook.utils

import androidx.annotation.RawRes

data class Script(
    val isEnabled: Boolean,
    @param:RawRes val resourceId:  Int,
    val scriptTitle: String
)

// Scripts are bundled in res/raw so local changes always apply
// (fetching them from the upstream repo would override this fork's versions).
fun fetchScripts(
    scripts: List<Script>,
    fallbackContent: (Int) -> String
): String = buildString {
    scripts.filter { it.isEnabled }.forEach { script ->
        // One failing script must not stop the ones after it
        append("try {\n")
        append(fallbackContent(script.resourceId))
        append("\n} catch (e) { console.error('[Materialbook] ${script.scriptTitle}', e); }\n")
    }
}

// Runs the scripts once per page, as soon as the DOM exists. Injected at document start where
// supported (so the feed filter sees items as they appear and ads never flash), and again after
// load as a fallback, which the flag turns into a no-op. The sourceURL names the bundle in DevTools
// and CPU profiles (tools/perf-bench.js tells our time from Facebook's by it).
// Facebook's server HTML carries a placeholder theme-color (#FFFFFF, upper case) that its own script
// replaces with the account's theme (#ffffff light, #242526 dark) right around DOMContentLoaded. The
// scripts pick their palette from it once, so on the placeholder they wait for that, 500 ms at most;
// otherwise a dark account intermittently got the light palette (and no AMOLED).
fun wrapScripts(scripts: String): String = """
    (function() {
        if (window.top !== window || window.__mbInjected) return;
        window.__mbInjected = true;
        const run = () => {
$scripts
        };
        const whenThemeKnown = () => {
            const meta = document.querySelector('meta[name="theme-color"]');
            if (!meta || meta.getAttribute('content') !== '#FFFFFF') return run();
            let started = false;
            const start = () => {
                if (started) return;
                started = true;
                observer.disconnect();
                run();
            };
            const observer = new MutationObserver(start);
            observer.observe(meta, { attributes: true, attributeFilter: ['content'] });
            setTimeout(start, 500);
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', whenThemeKnown, { once: true });
        else whenThemeKnown();
    })();
    //# sourceURL=materialbook-scripts.js
""".trimIndent()
