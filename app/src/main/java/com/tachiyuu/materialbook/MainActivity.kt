package com.tachiyuu.materialbook

import android.os.Bundle
import android.webkit.CookieManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import com.tachiyuu.materialbook.ui.screens.MaterialbookWebView
import com.tachiyuu.materialbook.ui.theme.MaterialbookTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        setContent {
            val intentUrl = intent?.data?.toString()
            MaterialbookTheme {
                MaterialbookWebView(
                    url = intentUrl
                        ?: "https://facebook.com/"
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