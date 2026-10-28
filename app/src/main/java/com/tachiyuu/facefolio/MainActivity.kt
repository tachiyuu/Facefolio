package com.tachiyuu.facefolio

import android.content.Intent
import android.os.Bundle
import android.webkit.CookieManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import com.tachiyuu.facefolio.ui.screens.FacefolioWebView
import com.tachiyuu.facefolio.ui.theme.FacefolioTheme
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class MainActivity : ComponentActivity() {
    private val newUrl = MutableStateFlow<String?>(null)

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        newUrl.value = intent.data?.toString()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        setContent {
            val intentUrl = intent?.data?.toString()
            FacefolioTheme {
                FacefolioWebView(
                    url = intentUrl ?: "https://facebook.com/",
                    incomingUrl = newUrl.asStateFlow()
                )
            }
        }
    }

    // WebView writes cookies to disk lazily; save them before the app may be killed so settings
    // stored in cookies (Facebook's dark mode, language) and fresh sign-ins survive
    override fun onPause() {
        super.onPause()
        CookieManager.getInstance().flush()
    }
}
