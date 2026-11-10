package com.tachiyuu.facefolio

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.LaunchedEffect
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowCompat
import com.tachiyuu.facefolio.ui.screens.FacefolioWebView
import com.tachiyuu.facefolio.ui.theme.FacefolioTheme
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class MainActivity : ComponentActivity() {
    private val newUrl = MutableStateFlow<String?>(null)
    private val settingsRequest = MutableStateFlow(false)

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (intent.action == ACTION_SETTINGS) settingsRequest.value = true
        else newUrl.value = intent.data?.toString()
    }

    // Set by the first composed frame: the system splash is held until then, so it never ends on a blank window
    @Volatile private var firstFrameDrawn = false

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        splash.setKeepOnScreenCondition { !firstFrameDrawn }
        // Same colour as SplashLoading's background: remove at once, no fade between two identical frames
        splash.setOnExitAnimationListener { it.remove() }
        WindowCompat.setDecorFitsSystemWindows(window, false)
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        // Opt into the highest supported refresh rate (90Hz / 120Hz+) at the current physical resolution
        (if (Build.VERSION.SDK_INT >= 30) display else @Suppress("DEPRECATION") windowManager.defaultDisplay)?.let { d ->
            val cur = d.mode
            val best = d.supportedModes
                .filter { it.physicalWidth == cur.physicalWidth && it.physicalHeight == cur.physicalHeight }
                .maxByOrNull { it.refreshRate }
            if (best != null && best.refreshRate > 60f) {
                window.attributes = window.attributes.apply {
                    preferredDisplayModeId = best.modeId
                    preferredRefreshRate = best.refreshRate
                }
            }
        }

        if (Build.VERSION.SDK_INT >= 35) {
            window.decorView.requestedFrameRate = View.REQUESTED_FRAME_RATE_CATEGORY_HIGH.toFloat()
        }

        if (savedInstanceState == null && intent?.action == ACTION_SETTINGS) settingsRequest.value = true
        // Long-press launcher shortcut: a way into settings that doesn't depend on Facebook's header
        ShortcutManagerCompat.setDynamicShortcuts(this, listOf(
            ShortcutInfoCompat.Builder(this, "settings")
                .setShortLabel(getString(R.string.settings_shortcut))
                .setIcon(IconCompat.createWithResource(this, R.mipmap.ic_launcher))
                .setIntent(Intent(this, MainActivity::class.java).setAction(ACTION_SETTINGS))
                .build()
        ))

        setContent {
            val intentUrl = intent?.data?.toString()
            LaunchedEffect(Unit) { firstFrameDrawn = true }
            FacefolioTheme {
                FacefolioWebView(
                    url = intentUrl ?: "https://facebook.com/",
                    incomingUrl = newUrl.asStateFlow(),
                    settingsRequest = settingsRequest
                )
            }
        }
    }

    companion object {
        const val ACTION_SETTINGS = "com.tachiyuu.facefolio.action.SETTINGS"
    }

    // WebView writes cookies to disk lazily; save them before the app may be killed so settings
    // stored in cookies (Facebook's dark mode, language) and fresh sign-ins survive
    override fun onPause() {
        super.onPause()
        CookieManager.getInstance().flush()
    }
}
