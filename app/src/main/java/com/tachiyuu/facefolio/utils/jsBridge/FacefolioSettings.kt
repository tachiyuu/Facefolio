package com.tachiyuu.facefolio.utils.jsBridge

import android.webkit.JavascriptInterface

class FacefolioSettings (
    private val toggleSettings: () -> Unit,
) {
    @JavascriptInterface
    @Suppress("unused")
    fun onSettingsToggle() = toggleSettings()
}