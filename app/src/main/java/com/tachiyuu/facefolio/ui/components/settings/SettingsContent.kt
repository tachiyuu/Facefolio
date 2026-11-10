package com.tachiyuu.facefolio.ui.components.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.BurstMode
import androidx.compose.material.icons.filled.Camera
import androidx.compose.material.icons.filled.Diversity1
import androidx.compose.material.icons.filled.EmojiPeople
import androidx.compose.material.icons.filled.Padding
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material.icons.filled.Try
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Circle
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.DesktopWindows
import androidx.compose.material.icons.outlined.FileDownload
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.Palette
import androidx.compose.material.icons.outlined.PanoramaWideAngle
import androidx.compose.material.icons.outlined.Pinch
import androidx.compose.material.icons.outlined.PushPin
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.rememberCoroutineScope
import com.tachiyuu.facefolio.utils.jsBridge.HealthBridge
import kotlinx.coroutines.launch
import androidx.lifecycle.viewmodel.compose.viewModel
import com.tachiyuu.facefolio.R
import com.tachiyuu.facefolio.data.local.SettingsDataStore.Companion.PINNABLE_TABS
import com.tachiyuu.facefolio.ui.viewmodel.SettingsViewModel
import com.tachiyuu.facefolio.utils.rememberAutoDesktop

@Composable
fun SettingsContent(
    modifier: Modifier,
    viewModel: SettingsViewModel = viewModel(),
    onSettingChanged: () -> Unit = {}
) {
    var isFilterOptionsOpen by rememberSaveable { mutableStateOf(false) }
    var isPinnedTabsOpen by rememberSaveable { mutableStateOf(false) }

    // Settings states
    val removeAds = viewModel.removeAds.collectAsState()
    val hideCounts = viewModel.hideCounts.collectAsState()
    val quietBadges = viewModel.quietBadges.collectAsState()

    val materialYou = viewModel.materialYou.collectAsState()
    val amoledBlack = viewModel.amoledBlack.collectAsState()
    val stickyNavbar = viewModel.stickyNavbar.collectAsState()
    val immersiveMode = viewModel.immersiveMode.collectAsState()

    val enableDownloadContent = viewModel.enableDownloadContent.collectAsState()
    val enableCopyToClipboard = viewModel.enableCopyToClipboard.collectAsState()
    val pinchToZoom = viewModel.pinchToZoom.collectAsState()
    val desktopLayout = viewModel.desktopLayout.collectAsState()

    val isAutoDesktop = rememberAutoDesktop()

    // Summary of active feed filters
    val activeHiddenFilters = listOf(
        viewModel.hideSuggested.collectAsState().value to R.string.suggested_posts,
        viewModel.hideReels.collectAsState().value to R.string.reels,
        viewModel.hideStories.collectAsState().value to R.string.stories,
        viewModel.hidePeopleYouMayKnow.collectAsState().value to R.string.people_you_may_know,
        viewModel.hideAiContent.collectAsState().value to R.string.ai_content,
        viewModel.hideGroups.collectAsState().value to R.string.groups,
        viewModel.hideMarketplace.collectAsState().value to R.string.marketplace,
    ).filter { it.first }.map { stringResource(it.second).lowercase() }

    val pinnedTabs = viewModel.pinnedTabs.collectAsState().value
    val pinnedSummary = (listOf(R.string.tab_home) + PINNABLE_TABS.filter { it in pinnedTabs }.map { tabName(it) })
        .map { stringResource(it) }
        .joinToString(", ")

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        // --- Group 1: Feed & Mindfulness (Bảng tin & Giảm xao nhãng) ---
        SettingsSection(stringResource(R.string.section_feed))
        SettingsGroup(
            items = listOf(
                SettingsItem(
                    icon = Icons.Outlined.Shield,
                    title = stringResource(R.string.remove_ads_title),
                    supportingText = stringResource(R.string.hide_sponsored_ads_from_your_feed),
                    isActive = removeAds.value,
                    onClick = {
                        viewModel.setRemoveAds(!removeAds.value)
                        onSettingChanged()
                    },
                ),
                SettingsItem(
                    icon = Icons.Outlined.VisibilityOff,
                    title = stringResource(R.string.hide_counts_title),
                    supportingText = stringResource(R.string.hide_counts_summary),
                    isActive = hideCounts.value,
                    onClick = {
                        viewModel.setHideCounts(!hideCounts.value)
                        onSettingChanged()
                    }
                ),
                SettingsItem(
                    icon = Icons.Outlined.Tune,
                    title = stringResource(R.string.feed_filters_title),
                    supportingText = if (activeHiddenFilters.isEmpty()) {
                        stringResource(R.string.show_in_feed_all_shown)
                    } else {
                        stringResource(R.string.show_in_feed_hidden_summary, activeHiddenFilters.joinToString(", "))
                    },
                    badgeText = if (activeHiddenFilters.isNotEmpty()) stringResource(R.string.filters_hidden_count, activeHiddenFilters.size) else null,
                    isActive = null,
                    onClick = { isFilterOptionsOpen = true }
                ),
                SettingsItem(
                    icon = Icons.Outlined.NotificationsNone,
                    title = stringResource(R.string.quiet_badges_title),
                    supportingText = stringResource(R.string.quiet_badges_summary),
                    isActive = quietBadges.value,
                    onClick = {
                        viewModel.setQuietBadges(!quietBadges.value)
                        onSettingChanged()
                    }
                ),
                SettingsItem(
                    icon = Icons.Outlined.PushPin,
                    title = stringResource(R.string.pinned_tabs_title),
                    supportingText = pinnedSummary,
                    badgeText = stringResource(R.string.tabs_count, pinnedTabs.size + 1),
                    isActive = null,
                    onClick = { isPinnedTabsOpen = true }
                )
            )
        )

        // --- Group 2: Visuals & Navigation (Giao diện & Hiển thị) ---
        SettingsSection(stringResource(R.string.section_look))
        SettingsGroup(
            items = listOf(
                SettingsItem(
                    icon = Icons.Outlined.Palette,
                    title = stringResource(R.string.material_you_title),
                    supportingText = stringResource(R.string.enable_material_you_theming_for_facebook),
                    isActive = materialYou.value,
                    onClick = {
                        viewModel.setMaterialYou(!materialYou.value)
                        onSettingChanged()
                    }
                ),
                SettingsItem(
                    icon = Icons.Outlined.Circle,
                    title = stringResource(R.string.amoled_black_title),
                    supportingText = stringResource(R.string.enable_pure_black_theme_for_amoled_displays),
                    isActive = amoledBlack.value,
                    onClick = {
                        viewModel.setAmoledBlack(!amoledBlack.value)
                        onSettingChanged()
                    }
                ),
                SettingsItem(
                    icon = Icons.Default.Padding,
                    title = stringResource(R.string.sticky_navbar_title),
                    supportingText = stringResource(R.string.keep_the_navigation_bar_visible_while_scrolling),
                    isActive = stickyNavbar.value,
                    onClick = {
                        viewModel.setStickyNavbar(!stickyNavbar.value)
                        onSettingChanged()
                    }
                ),
                SettingsItem(
                    icon = Icons.Outlined.PanoramaWideAngle,
                    title = stringResource(R.string.immersive_mode_title),
                    supportingText = stringResource(R.string.hide_system_bars_for_a_fullscreen_experience),
                    isActive = immersiveMode.value,
                    onClick = {
                        viewModel.setImmersiveMode(!immersiveMode.value)
                        onSettingChanged()
                    }
                )
            )
        )

        // --- Group 3: Tools & Advanced (Tiện ích & Nâng cao) ---
        SettingsSection(stringResource(R.string.section_advanced))
        SettingsGroup(
            items = listOf(
                SettingsItem(
                    icon = Icons.Outlined.FileDownload,
                    title = stringResource(R.string.download_content_title),
                    supportingText = stringResource(R.string.enable_download_button_on_media_view),
                    isActive = enableDownloadContent.value,
                    onClick = {
                        viewModel.setEnableDownloadContent(!enableDownloadContent.value)
                        onSettingChanged()
                    },
                ),
                SettingsItem(
                    icon = Icons.Outlined.ContentCopy,
                    title = stringResource(R.string.copy_to_clipboard_title),
                    supportingText = stringResource(R.string.enable_copy_to_clipboard_button_on_media_view),
                    isActive = enableCopyToClipboard.value,
                    onClick = {
                        viewModel.setEnableCopyToClipboard(!enableCopyToClipboard.value)
                        onSettingChanged()
                    },
                ),
                SettingsItem(
                    icon = Icons.Outlined.Pinch,
                    title = stringResource(R.string.pinch_to_zoom_title),
                    supportingText = stringResource(R.string.use_two_fingers_to_zoom_in_or_out),
                    isActive = pinchToZoom.value,
                    onClick = {
                        viewModel.setPinchToZoom(!pinchToZoom.value)
                        onSettingChanged()
                    }
                ),
                compatibilityItem(),
                SettingsItem(
                    icon = Icons.Outlined.DesktopWindows,
                    title = stringResource(R.string.desktop_layout_title),
                    supportingText = stringResource(R.string.force_desktop_layout_may_not_be_suitable_for_smaller_display),
                    isActive = desktopLayout.value,
                    onClick = {
                        if (!isAutoDesktop) {
                            viewModel.setDesktopLayout(!desktopLayout.value)
                            onSettingChanged()
                        }
                    }
                )
            )
        )
    }

    // Dialog for Detailed Feed Content Filters
    if (isFilterOptionsOpen) {
        DetailedFeedFiltersDialog(
            viewModel = viewModel,
            onSettingChanged = onSettingChanged,
            onDismiss = { isFilterOptionsOpen = false }
        )
    }

    // Dialog for Pinned Navigation Tabs
    if (isPinnedTabsOpen) {
        ToggleSheet(
            title = stringResource(R.string.pinned_tabs_title),
            hint = stringResource(R.string.pinned_tabs_hint),
            onDismiss = { isPinnedTabsOpen = false }
        ) {
                PINNABLE_TABS.forEach { tab ->
                    val isPinned = tab in pinnedTabs
                    FilterSwitchRow(
                        icon = tabIcon(tab),
                        title = stringResource(tabName(tab)),
                        checked = isPinned,
                        activeSubtitle = stringResource(R.string.state_shown),
                        inactiveSubtitle = stringResource(R.string.state_hidden),
                        onToggle = {
                            viewModel.togglePinnedTab(tab)
                            onSettingChanged()
                        }
                    )
                }
        }
    }
}

private fun tabName(tab: String) = when (tab) {
    "groups" -> R.string.groups
    "notifications" -> R.string.tab_notifications
    "friends" -> R.string.tab_friends
    "messages" -> R.string.tab_messages
    "reels" -> R.string.reels
    else -> R.string.marketplace
}

private fun tabIcon(tab: String) = when (tab) {
    "groups" -> Icons.Filled.Diversity1
    "notifications" -> Icons.Outlined.NotificationsNone
    "friends" -> Icons.Filled.EmojiPeople
    "messages" -> Icons.Outlined.ChatBubbleOutline
    "reels" -> Icons.Filled.Camera
    else -> Icons.Filled.Storefront
}

// Modal bottom sheet: reachable with one thumb, dismissible by drag, and an explicit Done
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ToggleSheet(title: String, hint: String, onDismiss: () -> Unit, rows: @Composable () -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val scope = rememberCoroutineScope()
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(
            modifier = Modifier
                .verticalScroll(rememberScrollState())
                .padding(bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(horizontal = 24.dp)
            )
            Text(
                text = hint,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(start = 24.dp, end = 24.dp, bottom = 12.dp)
            )
            rows()
            Button(
                onClick = { scope.launch { sheetState.hide() }.invokeOnCompletion { onDismiss() } },
                modifier = Modifier
                    .align(Alignment.End)
                    .padding(horizontal = 24.dp, vertical = 8.dp)
            ) { Text(stringResource(R.string.done)) }
        }
    }
}

// Result of the in-page check that Facebook's markup still has what the features hook into
@Composable
private fun compatibilityItem(): SettingsItem {
    val health by HealthBridge.state.collectAsState()
    val broken = health.failures.mapNotNull { HOOK_FEATURES[it] }.distinct().map { stringResource(it) }
    return SettingsItem(
        icon = Icons.Outlined.VerifiedUser,
        title = stringResource(R.string.compat_title),
        supportingText = when (health.status) {
            "ok" -> stringResource(R.string.compat_ok)
            "failed" -> stringResource(R.string.compat_failed, broken.ifEmpty { health.failures }.joinToString(", "))
            else -> stringResource(R.string.compat_pending)
        },
        isActive = health.status == "ok",
        showTrailing = false,
        onClick = {}
    )
}

// Self-check hook names (scripts.js) -> the feature that stops working without it
private val HOOK_FEATURES = mapOf(
    "feedItems" to R.string.feed_filters_title,
    "headerTabs" to R.string.pinned_tabs_title,
    "themeColor" to R.string.material_you_title,
    "theme" to R.string.amoled_black_title,
    "logo" to R.string.sticky_navbar_title,
    "homeGlyph" to R.string.facefolio_settings,
    "headerActions" to R.string.facefolio_settings,
    "stickyBanner" to R.string.sticky_navbar_title,
    "actionBar" to R.string.desktop_layout_title,
)

@Composable
private fun DetailedFeedFiltersDialog(
    viewModel: SettingsViewModel,
    onSettingChanged: () -> Unit,
    onDismiss: () -> Unit
) {
    val hideSuggested = viewModel.hideSuggested.collectAsState()
    val hideReels = viewModel.hideReels.collectAsState()
    val hideStories = viewModel.hideStories.collectAsState()
    val hidePeopleYouMayKnow = viewModel.hidePeopleYouMayKnow.collectAsState()
    val hideGroups = viewModel.hideGroups.collectAsState()
    val hideMarketplace = viewModel.hideMarketplace.collectAsState()
    val hideAiContent = viewModel.hideAiContent.collectAsState()

        ToggleSheet(
            title = stringResource(R.string.feed_filters_title),
            hint = stringResource(R.string.show_in_feed_hint),
            onDismiss = onDismiss
        ) {
            FilterSwitchRow(
                icon = Icons.Filled.Try,
                title = stringResource(R.string.suggested_posts),
                checked = hideSuggested.value,
                activeSubtitle = stringResource(R.string.state_hidden),
                inactiveSubtitle = stringResource(R.string.state_shown),
                onToggle = {
                    viewModel.setHideSuggested(!hideSuggested.value)
                    onSettingChanged()
                }
            )
            FilterSwitchRow(
                icon = Icons.Filled.Camera,
                title = stringResource(R.string.reels),
                checked = hideReels.value,
                activeSubtitle = stringResource(R.string.state_hidden),
                inactiveSubtitle = stringResource(R.string.state_shown),
                onToggle = {
                    viewModel.setHideReels(!hideReels.value)
                    onSettingChanged()
                }
            )
            FilterSwitchRow(
                icon = Icons.Filled.BurstMode,
                title = stringResource(R.string.stories),
                checked = hideStories.value,
                activeSubtitle = stringResource(R.string.state_hidden),
                inactiveSubtitle = stringResource(R.string.state_shown),
                onToggle = {
                    viewModel.setHideStories(!hideStories.value)
                    onSettingChanged()
                }
            )
            FilterSwitchRow(
                icon = Icons.Filled.EmojiPeople,
                title = stringResource(R.string.people_you_may_know),
                checked = hidePeopleYouMayKnow.value,
                activeSubtitle = stringResource(R.string.state_hidden),
                inactiveSubtitle = stringResource(R.string.state_shown),
                onToggle = {
                    viewModel.setHidePeopleYouMayKnow(!hidePeopleYouMayKnow.value)
                    onSettingChanged()
                }
            )
            FilterSwitchRow(
                icon = Icons.Filled.AutoAwesome,
                title = stringResource(R.string.ai_content),
                checked = hideAiContent.value,
                activeSubtitle = stringResource(R.string.state_hidden),
                inactiveSubtitle = stringResource(R.string.state_shown),
                onToggle = {
                    viewModel.setHideAiContent(!hideAiContent.value)
                    onSettingChanged()
                }
            )
            FilterSwitchRow(
                icon = Icons.Filled.Storefront,
                title = stringResource(R.string.marketplace),
                checked = hideMarketplace.value,
                activeSubtitle = stringResource(R.string.state_hidden),
                inactiveSubtitle = stringResource(R.string.state_shown),
                onToggle = {
                    viewModel.setHideMarketplace(!hideMarketplace.value)
                    onSettingChanged()
                }
            )
            if (!viewModel.desktopLayout.collectAsState().value) {
                FilterSwitchRow(
                    icon = Icons.Filled.Diversity1,
                    title = stringResource(R.string.groups),
                    checked = hideGroups.value,
                    activeSubtitle = stringResource(R.string.state_hidden),
                    inactiveSubtitle = stringResource(R.string.state_shown),
                    onToggle = {
                        viewModel.setHideGroups(!hideGroups.value)
                        onSettingChanged()
                    }
                )
            }
        }
}

@Composable
private fun FilterSwitchRow(
    icon: ImageVector,
    title: String,
    checked: Boolean,
    activeSubtitle: String,
    inactiveSubtitle: String,
    onToggle: () -> Unit
) {
    Row(
        modifier = Modifier
            .clickable { onToggle() }
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(
                    if (checked) MaterialTheme.colorScheme.primaryContainer
                    else MaterialTheme.colorScheme.surfaceContainerHigh
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                icon,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = if (checked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Column(Modifier.weight(1F)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = if (checked) activeSubtitle else inactiveSubtitle,
                style = MaterialTheme.typography.bodySmall,
                color = if (checked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
            )
        }

        SettingsSwitch(checked = checked, onCheckedChange = { onToggle() })
    }
}
