package com.tachiyuu.materialbook.ui.viewmodel

import android.content.res.Resources
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.ViewModel
import com.tachiyuu.materialbook.R
import com.tachiyuu.materialbook.utils.Script
import com.tachiyuu.materialbook.utils.fetchScripts


class MainViewModel(
    resources: Resources,
    settings: SettingsViewModel
): ViewModel() {

    private val _themeColor = mutableStateOf(Color.Transparent)
    val themeColor: State<Color> = _themeColor

    private val _scripts = mutableStateOf<String?>(null)
    val scripts: State<String?> = _scripts

    init {
        _scripts.value = buildScripts(resources, settings)
    }

    fun setThemeColor(color: Color) {
        _themeColor.value = color
    }

    private fun buildScripts(
        resources: Resources,
        settings: SettingsViewModel
    ): String {
        val scripts = listOf(
            Script(true, R.raw.scripts, "scripts.js"), // always apply
            Script(settings.removeAds.value, R.raw.adblock, "adblock.js"),
            Script(settings.enableDownloadContent.value, R.raw.download_content, "download_content.js"),
            Script(settings.enableCopyToClipboard.value, R.raw.copy_to_clipboard, "copy_to_clipboard.js"),
            Script(settings.stickyNavbar.value, R.raw.sticky_navbar, "sticky_navbar.js"),
            Script(!settings.pinchToZoom.value, R.raw.pinch_to_zoom, "pinch_to_zoom.js"),
            Script(settings.materialYou.value, R.raw.material_you, "material_you.js"),
            Script(settings.amoledBlack.value, R.raw.amoled_black, "amoled_black.js"),
            Script(settings.hideSuggested.value, R.raw.hide_suggested, "hide_suggested.js"),
            Script(settings.hideReels.value, R.raw.hide_reels, "hide_reels.js"),
            Script(settings.hideStories.value, R.raw.hide_stories, "hide_stories.js"),
            Script(settings.hidePeopleYouMayKnow.value, R.raw.hide_pymk, "hide_pymk.js"),
            Script(settings.hideGroups.value, R.raw.hide_groups, "hide_groups.js"),
            Script(settings.hideMarketplace.value, R.raw.hide_marketplace, "hide_marketplace.js"),
            Script(settings.hideAiContent.value, R.raw.hide_ai_content, "hide_ai_content.js"),
            Script(settings.hideCounts.value, R.raw.hide_counts, "hide_counts.js"),
            Script(settings.quietBadges.value, R.raw.quiet_badges, "quiet_badges.js"),
            Script(true, R.raw.feed_pill, "feed_pill.js") // shows itself only once the feed filter hid something
        )

        // Settings the scripts read directly
        val pinnedTabs = settings.pinnedTabs.value.joinToString(",") { "\"$it\"" }
        val config = "window.__mbPinnedTabs = [$pinnedTabs];\n"

        return config +
            fetchScripts(
                scripts = scripts,
                fallbackContent = { resId ->
                    resources.openRawResource(resId).bufferedReader()
                        .use { it.readText() }
                }
            )
    }

    // Rebuilds the bundle from the current settings; true if it changed, so the page needs a reload
    fun refresh(
        resources: Resources,
        settings: SettingsViewModel
    ): Boolean {
        val scripts = buildScripts(resources, settings)
        if (scripts == _scripts.value) return false
        _scripts.value = scripts
        return true
    }
}