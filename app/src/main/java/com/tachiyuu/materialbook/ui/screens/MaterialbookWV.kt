package com.tachiyuu.materialbook.ui.screens

import android.content.Intent
import android.view.View
import android.webkit.CookieManager
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.LocalActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBars
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalResources
import androidx.core.graphics.ColorUtils
import androidx.core.net.toUri
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.multiplatform.webview.web.LoadingState
import com.multiplatform.webview.web.WebView
import com.multiplatform.webview.web.rememberSaveableWebViewState
import com.multiplatform.webview.web.rememberWebViewNavigator
import com.tachiyuu.materialbook.R
import com.tachiyuu.materialbook.ui.components.NetworkErrorDialog
import com.tachiyuu.materialbook.ui.components.settings.SettingsDialog
import com.tachiyuu.materialbook.ui.theme.materialbookColorScheme
import com.tachiyuu.materialbook.ui.viewmodel.MainViewModel
import com.tachiyuu.materialbook.ui.viewmodel.SettingsViewModel
import com.tachiyuu.materialbook.utils.DESKTOP_USER_AGENT
import com.tachiyuu.materialbook.utils.ExternalRequestInterceptor
import com.tachiyuu.materialbook.utils.fileChooserWebViewParams
import com.tachiyuu.materialbook.utils.jsBridge.ClipboardBridge
import com.tachiyuu.materialbook.utils.jsBridge.DownloadBridge
import com.tachiyuu.materialbook.utils.jsBridge.MaterialbookSettings
import com.tachiyuu.materialbook.utils.jsBridge.ThemeChange
import com.tachiyuu.materialbook.utils.jsBridge.MaterialYouBridge
import com.tachiyuu.materialbook.utils.rememberAutoDesktop
import com.tachiyuu.materialbook.utils.rememberImeHeight
import com.tachiyuu.materialbook.utils.wrapScripts
import androidx.webkit.ScriptHandler
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import kotlinx.coroutines.delay

@Composable
fun MaterialbookWebView(
    url: String,
    settingsVM: SettingsViewModel = viewModel()
) {
    val context = LocalContext.current
    val activity = LocalActivity.current
    val resources = LocalResources.current

    val state = rememberSaveableWebViewState(url)
    val navigator = rememberWebViewNavigator(
        requestInterceptor = ExternalRequestInterceptor { externalUrl ->
            val intent = Intent(Intent.ACTION_VIEW, externalUrl.toUri())
            runCatching {
                context.startActivity(intent)
            }.onFailure {
                Toast.makeText(
                    context,
                    resources.getString(R.string.not_supported),
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    )

    LaunchedEffect(navigator) {
        val bundle = state.viewState
        if (bundle == null) {
            navigator.loadUrl(url)
        }
    }

    // allow exiting while scrolling to top.
    var exitScroll by remember { mutableStateOf(false) }
    BackHandler {
        if (exitScroll) {
            activity?.finish()
        } else {
            navigator.evaluateJavaScript("backHandlerNB();") {
                val backHandled = it.removeSurrounding("\"")
                when (backHandled) {
                    "false" -> {
                        if (navigator.canGoBack) {
                            navigator.navigateBack()
                        } else {
                            activity?.finish()
                        }
                    }
                    "exit" -> activity?.finish()
                    "scrolling" -> exitScroll = true
                }
            }
        }
    }

    LaunchedEffect(exitScroll) {
        if (exitScroll) {
            delay(800)
            exitScroll = false
        }
    }

    val isDesktop by settingsVM.desktopLayout.collectAsState()
    val isAutoRevert by settingsVM.isRevertDesktop.collectAsState()
    val isAutoDesktop = rememberAutoDesktop()

    // Automatic desktop layout in landscape / on large screens, switched back afterwards. Re-run on
    // rotation; after start-up the page is already loaded, so it reloads with the new user agent.
    var autoDesktopChecked by remember { mutableStateOf(false) }
    LaunchedEffect(isAutoDesktop) {
        val desktop = when {
            isAutoDesktop && !isDesktop -> true
            !isAutoDesktop && isAutoRevert -> false
            else -> null
        }
        if (desktop != null) {
            settingsVM.setRevertDesktop(desktop)
            settingsVM.setDesktopLayout(desktop)
            if (autoDesktopChecked) {
                state.nativeWebView.settings.userAgentString = if (desktop) DESKTOP_USER_AGENT else ""
                navigator.reload()
            }
        }
        autoDesktopChecked = true
    }

    var isLoading by rememberSaveable { mutableStateOf(true) }
    val isError = state.errorsForCurrentRequest.lastOrNull()?.isFromMainFrame == true

    val viewModel: MainViewModel = viewModel {
        MainViewModel(
            resources = resources,
            settings = settingsVM
        )
    }

    val themeColor by viewModel.themeColor
    // Manual handling to fix visual & padding bug on settings dialog.
    var isImmersiveMode by rememberSaveable { mutableStateOf(settingsVM.immersiveMode.value) }

    fun setWindow(immersive: Boolean) {
        val window = activity?.window ?: return
        val windowInsetsController = WindowInsetsControllerCompat(window, window.decorView)

        if (immersive) {
            windowInsetsController.hide(WindowInsetsCompat.Type.systemBars())
            windowInsetsController.systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        } else {
            val isLight = ColorUtils.calculateLuminance(themeColor.toArgb()) > 0.5
            windowInsetsController.show(WindowInsetsCompat.Type.systemBars())
            windowInsetsController.isAppearanceLightStatusBars = isLight
            windowInsetsController.isAppearanceLightNavigationBars = isLight
        }
        isImmersiveMode = immersive
    }

    LaunchedEffect(isImmersiveMode, themeColor.value) {
        setWindow(isImmersiveMode)
    }

    val userScripts by viewModel.scripts
    val loadingState = state.loadingState
    var webView by remember { mutableStateOf<android.webkit.WebView?>(null) }
    var documentStartScript by remember { mutableStateOf<ScriptHandler?>(null) }
    var pendingReload by remember { mutableStateOf(false) }

    // Register the scripts to run at document start, then reload if settings asked for it
    LaunchedEffect(webView, userScripts, pendingReload) {
        val view = webView ?: return@LaunchedEffect
        val scripts = userScripts ?: return@LaunchedEffect
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            documentStartScript?.remove()
            documentStartScript = WebViewCompat.addDocumentStartJavaScript(
                view, wrapScripts(scripts), setOf("https://*.facebook.com")
            )
        }
        if (pendingReload) {
            pendingReload = false
            navigator.reload()
        }
    }

    LaunchedEffect(loadingState, userScripts) {
        if (loadingState is LoadingState.Finished) {
            userScripts?.let { scripts ->
                navigator.evaluateJavaScript(wrapScripts(scripts)) {
                    isLoading = false
                }
            }
        }
    }

    if (isError && isLoading) {
        NetworkErrorDialog { activity?.finish() }
        return
    }

    val colorScheme = MaterialTheme.colorScheme
    val originalColor = remember { mutableStateOf(themeColor) }

    var settingsToggle by rememberSaveable { mutableStateOf(false) }
    if (settingsToggle) {
        setWindow(false)
        SettingsDialog(
            onDismiss = {
                setWindow(settingsVM.immersiveMode.value)
                viewModel.setThemeColor(originalColor.value)
                settingsToggle = false
            },
            onReload = {
                isLoading = true
                viewModel.setThemeColor(Color.Transparent)
                setWindow(settingsVM.immersiveMode.value)
                viewModel.refresh(
                    resources = resources,
                    settings = settingsVM
                )
                pendingReload = true
            }
        )
    }

    LaunchedEffect(settingsToggle) {
        if (settingsToggle) {
            originalColor.value = themeColor
            viewModel.setThemeColor(colorScheme.background)
        }
    }

    if (isLoading) {
        SplashLoading(
            if (loadingState is LoadingState.Loading) {
                loadingState.progress
            } else {
                0.8F
            }
        )
    }


    LaunchedEffect(isDesktop) {
        val userAgent = if (isDesktop) DESKTOP_USER_AGENT else ""
        state.nativeWebView.settings.userAgentString = userAgent
    }

    // needed to consume extra padding when keyboard is open
    val barsInsets = WindowInsets.systemBars.asPaddingValues()
    val imeHeight = rememberImeHeight()

    val lightScheme = remember { materialbookColorScheme(context, darkTheme = false) }
    val darkScheme = remember { materialbookColorScheme(context, darkTheme = true) }

    WebView(
        modifier = Modifier
            .fillMaxSize()
            .background(themeColor)
            .then(
                if (isImmersiveMode) {
                    Modifier.padding(bottom = imeHeight)
                } else {
                    Modifier.padding(
                        top = barsInsets.calculateTopPadding(),
                        bottom = maxOf(barsInsets.calculateBottomPadding(), imeHeight)
                    )
                }
            ),
        state = state,
        navigator = navigator,
        platformWebViewParams = fileChooserWebViewParams(),
        captureBackPresses = false,
        onCreated = { createdWebView ->
            webView = createdWebView

            val cookieManager = CookieManager.getInstance()
            cookieManager.setAcceptCookie(true)
            cookieManager.setAcceptThirdPartyCookies(createdWebView, true)
            cookieManager.flush()

            state.webSettings.apply {
                isJavaScriptEnabled = true

                androidWebSettings.apply {
                    //isDebugInspectorInfoEnabled = true
                    domStorageEnabled = true
                    hideDefaultVideoPoster = true
                    mediaPlaybackRequiresUserGesture = false
                }
            }

            createdWebView.apply {
                addJavascriptInterface(
                    MaterialbookSettings { settingsToggle = true },
                    "SettingsBridge"
                )
                addJavascriptInterface(
                    ThemeChange { if (!settingsToggle) viewModel.setThemeColor(Color(it)) },
                    "ThemeBridge"
                )
                addJavascriptInterface(
                    DownloadBridge(context),
                    "DownloadBridge"
                )
                addJavascriptInterface(
                    ClipboardBridge(context),
                    "ClipboardBridge"
                )
                addJavascriptInterface(
                    MaterialYouBridge(
                        lightPrimary = lightScheme.primary.toArgb(),
                        lightOnPrimary = lightScheme.onPrimary.toArgb(),
                        darkPrimary = darkScheme.primary.toArgb(),
                        darkOnPrimary = darkScheme.onPrimary.toArgb()
                    ),
                    "MaterialYouBridge"
                )

                overScrollMode = View.OVER_SCROLL_NEVER
                isVerticalScrollBarEnabled = false
                isHorizontalScrollBarEnabled = false

                settings.setSupportZoom(true)
                settings.builtInZoomControls = true
                settings.displayZoomControls = false
            }
        }
    )
}