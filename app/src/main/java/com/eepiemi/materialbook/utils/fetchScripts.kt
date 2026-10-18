package com.eepiemi.materialbook.utils

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
        append(fallbackContent(script.resourceId))
    }
}

// Runs the scripts once per page, as soon as the DOM exists. Injected at document start where
// supported (so the feed filter sees items as they appear and ads never flash), and again after
// load as a fallback, which the flag turns into a no-op.
fun wrapScripts(scripts: String): String = """
    (function() {
        if (window.top !== window || window.__mbInjected) return;
        window.__mbInjected = true;
        const run = () => {
$scripts
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
        else run();
    })();
""".trimIndent()
