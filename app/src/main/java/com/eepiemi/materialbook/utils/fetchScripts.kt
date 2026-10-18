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
