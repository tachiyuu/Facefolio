package com.tachiyuu.facefolio.utils.jsBridge

import android.webkit.JavascriptInterface
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

// Result of the in-page self-check (scripts.js, window.__mbHealth): which Facebook hooks still match.
// Settings shows it, so a Facebook change reads as "this feature needs an update" instead of silence.
data class FacebookHealth(val status: String = "pending", val failures: List<String> = emptyList())

object HealthBridge {
    private val _state = MutableStateFlow(FacebookHealth())
    val state: StateFlow<FacebookHealth> = _state.asStateFlow()

    @JavascriptInterface
    @Suppress("unused")
    fun report(status: String?, failures: String?) {
        // "skipped" (logged out, not the feed) says nothing new; keep the last real result
        if (status !in setOf("ok", "failed")) return
        _state.value = FacebookHealth(status!!, failures.orEmpty().split(',').filter { it.isNotBlank() })
    }
}
