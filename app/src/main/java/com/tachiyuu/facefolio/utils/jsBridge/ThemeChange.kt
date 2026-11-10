package com.tachiyuu.facefolio.utils.jsBridge

import android.webkit.JavascriptInterface
import androidx.core.graphics.toColorInt

class ThemeChange(
    private val setThemeColor: (Int) -> Unit,
    private val onReady: () -> Unit = {}
) {
    @JavascriptInterface
    @Suppress("unused")
    fun onThemeColorChanged(newColor: String?) {
        if (newColor.isNullOrBlank()) return
        runCatching { setThemeColor(newColor.toColorInt()) }
    }

    @JavascriptInterface
    @Suppress("unused")
    fun onReady() {
        onReady.invoke()
    }
}
