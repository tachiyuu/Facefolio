package com.eepiemi.materialbook.utils.jsBridge

import android.webkit.JavascriptInterface

// Material You colours for the injected scripts. Facebook's light/dark theme is set in the account,
// not by the system, so each getter takes the page's theme and returns the matching palette.
class MaterialYouBridge(
    private val lightPrimary: Int,
    private val lightOnPrimary: Int,
    private val darkPrimary: Int,
    private val darkOnPrimary: Int
) {

    @JavascriptInterface
    @Suppress("unused")
    fun getMaterialYouPrimaryRgb(dark: Boolean): String {
        return colorToRgb(if (dark) darkPrimary else lightPrimary)
    }

    @JavascriptInterface
    @Suppress("unused")
    fun getMaterialYouOnPrimaryRgb(dark: Boolean): String {
        return colorToRgb(if (dark) darkOnPrimary else lightOnPrimary)
    }

    @JavascriptInterface
    @Suppress("unused")
    fun getMaterialYouPrimaryRgbString(dark: Boolean): String {
        return colorToRgbString(if (dark) darkPrimary else lightPrimary)
    }

    @JavascriptInterface
    @Suppress("unused")
    fun getMaterialYouOnPrimaryRgbString(dark: Boolean): String {
        return colorToRgbString(if (dark) darkOnPrimary else lightOnPrimary)
    }

    private fun colorToRgb(color: Int): String {
        val r = (color shr 16) and 0xFF
        val g = (color shr 8) and 0xFF
        val b = color and 0xFF
        return """{"r":$r,"g":$g,"b":$b}"""
    }

    private fun colorToRgbString(color: Int): String {
        val r = (color shr 16) and 0xFF
        val g = (color shr 8) and 0xFF
        val b = color and 0xFF
        return "rgb($r, $g, $b)"
    }
}
