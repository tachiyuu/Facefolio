package com.eepiemi.materialbook.ui.components.settings

import android.content.Intent
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
import androidx.compose.material.icons.filled.BurstMode
import androidx.compose.material.icons.filled.Camera
import androidx.compose.material.icons.filled.Diversity1
import androidx.compose.material.icons.filled.EmojiPeople
import androidx.compose.material.icons.filled.Padding
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material.icons.filled.Try
import androidx.compose.material.icons.outlined.Circle
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.DesktopWindows
import androidx.compose.material.icons.outlined.FileDownload
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.Palette
import androidx.compose.material.icons.outlined.PanoramaWideAngle
import androidx.compose.material.icons.outlined.Pinch
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.core.net.toUri
import androidx.lifecycle.viewmodel.compose.viewModel
import com.eepiemi.materialbook.R
import com.eepiemi.materialbook.ui.viewmodel.SettingsViewModel
import com.eepiemi.materialbook.utils.rememberAutoDesktop

@Composable
fun SettingsContent(
    modifier: Modifier,
    viewModel: SettingsViewModel = viewModel()
) {
    val context = LocalContext.current
    var isOpenDialog by rememberSaveable { mutableStateOf(false) }

    val removeAds = viewModel.removeAds.collectAsState()
    val enableDownloadContent = viewModel.enableDownloadContent.collectAsState()
    val enableCopyToClipboard = viewModel.enableCopyToClipboard.collectAsState()
    val desktopLayout = viewModel.desktopLayout.collectAsState()
    val immersiveMode = viewModel.immersiveMode.collectAsState()
    val stickyNavbar = viewModel.stickyNavbar.collectAsState()
    val pinchToZoom = viewModel.pinchToZoom.collectAsState()
    val materialYou = viewModel.materialYou.collectAsState()
    val amoledBlack = viewModel.amoledBlack.collectAsState()

    val hideCounts = viewModel.hideCounts.collectAsState()
    val quietBadges = viewModel.quietBadges.collectAsState()

    val isAutoDesktop = rememberAutoDesktop()

    // "Show in feed" row says what is currently hidden
    val hiddenInFeed = listOf(
        viewModel.hideSuggested.collectAsState().value to R.string.suggested_posts,
        viewModel.hidePeopleYouMayKnow.collectAsState().value to R.string.people_you_may_know,
        viewModel.hideReels.collectAsState().value to R.string.reels,
        viewModel.hideStories.collectAsState().value to R.string.stories,
        viewModel.hideMarketplace.collectAsState().value to R.string.marketplace,
        viewModel.hideGroups.collectAsState().value to R.string.groups,
    ).filter { it.first }.map { stringResource(it.second).lowercase() }

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        SettingsSection(stringResource(R.string.section_feed))
        SettingsGroup(
            items = listOf(
                SettingsItem(
                    icon = Icons.Outlined.Shield,
                    title = stringResource(R.string.remove_ads_title),
                    supportingText = stringResource(R.string.hide_sponsored_ads_from_your_feed),
                    isActive = removeAds.value,
                    onClick = { viewModel.setRemoveAds(!removeAds.value) },
                ),
                SettingsItem(
                    icon = Icons.Outlined.GridView,
                    title = stringResource(R.string.show_in_feed_title),
                    supportingText = if (hiddenInFeed.isEmpty()) stringResource(R.string.show_in_feed_all_shown)
                        else stringResource(R.string.show_in_feed_hidden_summary, hiddenInFeed.joinToString(", ")),
                    isActive = null,
                    onClick = { isOpenDialog = true },
                )
            )
        )

        SettingsSection(stringResource(R.string.section_fewer_distractions))
        SettingsGroup(
            items = listOf(
                SettingsItem(
                    icon = Icons.Outlined.VisibilityOff,
                    title = stringResource(R.string.hide_counts_title),
                    supportingText = stringResource(R.string.hide_counts_summary),
                    isActive = hideCounts.value,
                    onClick = { viewModel.setHideCounts(!hideCounts.value) }
                ),
                SettingsItem(
                    icon = Icons.Outlined.NotificationsNone,
                    title = stringResource(R.string.quiet_badges_title),
                    supportingText = stringResource(R.string.quiet_badges_summary),
                    isActive = quietBadges.value,
                    onClick = { viewModel.setQuietBadges(!quietBadges.value) }
                )
            )
        )

        SettingsSection(stringResource(R.string.section_look))
        SettingsGroup(
            items = listOf(
                SettingsItem(
                    icon = Icons.Outlined.Palette,
                    title = stringResource(R.string.material_you_title),
                    supportingText = stringResource(R.string.enable_material_you_theming_for_facebook),
                    isActive = materialYou.value,
                    onClick = { viewModel.setMaterialYou(!materialYou.value) }
                ),
                SettingsItem(
                    icon = Icons.Outlined.Circle,
                    title = stringResource(R.string.amoled_black_title),
                    supportingText = stringResource(R.string.enable_pure_black_theme_for_amoled_displays),
                    isActive = amoledBlack.value,
                    onClick = { viewModel.setAmoledBlack(!amoledBlack.value) }
                ),
                SettingsItem(
                    icon = Icons.Default.Padding,
                    title = stringResource(R.string.sticky_navbar_title),
                    supportingText = stringResource(R.string.keep_the_navigation_bar_visible_while_scrolling),
                    isActive = stickyNavbar.value,
                    onClick = { viewModel.setStickyNavbar(!stickyNavbar.value) }
                ),
                SettingsItem(
                    icon = Icons.Outlined.PanoramaWideAngle,
                    title = stringResource(R.string.immersive_mode_title),
                    supportingText = stringResource(R.string.hide_system_bars_for_a_fullscreen_experience),
                    isActive = immersiveMode.value,
                    onClick = { viewModel.setImmersiveMode(!immersiveMode.value) }
                )
            )
        )

        SettingsSection(stringResource(R.string.section_advanced))
        SettingsGroup(
            items = listOf(
                SettingsItem(
                    icon = Icons.Outlined.FileDownload,
                    title = stringResource(R.string.download_content_title),
                    supportingText = stringResource(R.string.enable_download_button_on_media_view),
                    isActive = enableDownloadContent.value,
                    onClick = { viewModel.setEnableDownloadContent(!enableDownloadContent.value) },
                ),
                SettingsItem(
                    icon = Icons.Outlined.ContentCopy,
                    title = stringResource(R.string.copy_to_clipboard_title),
                    supportingText = stringResource(R.string.enable_copy_to_clipboard_button_on_media_view),
                    isActive = enableCopyToClipboard.value,
                    onClick = { viewModel.setEnableCopyToClipboard(!enableCopyToClipboard.value) },
                ),
                SettingsItem(
                    icon = Icons.Outlined.Pinch,
                    title = stringResource(R.string.pinch_to_zoom_title),
                    supportingText = stringResource(R.string.use_two_fingers_to_zoom_in_or_out),
                    isActive = pinchToZoom.value,
                    onClick = { viewModel.setPinchToZoom(!pinchToZoom.value) }
                ),
                SettingsItem(
                    icon = Icons.Outlined.DesktopWindows,
                    title = stringResource(R.string.desktop_layout_title),
                    supportingText = stringResource(R.string.force_desktop_layout_may_not_be_suitable_for_smaller_display),
                    isActive = desktopLayout.value,
                    onClick = { if (!isAutoDesktop) viewModel.setDesktopLayout(!desktopLayout.value) }
                )
            )
        )

        Box(modifier = Modifier.fillMaxWidth()) {
            TextButton(
                modifier = Modifier.align(Alignment.Center),
                onClick = {
                    val bmacUrl = "https://buymeacoffee.com/eepiemi"
                    val intent = Intent(Intent.ACTION_VIEW, bmacUrl.toUri())
                    context.startActivity(intent)
                }
            ) {
                Text(
                    stringResource(R.string.support_my_work),
                    modifier = Modifier.padding(4.dp),
                    maxLines = 1
                )
            }
        }

    }

    if(isOpenDialog) {
        HideOptionsDialog(
            viewModel = viewModel,
            onDismiss = {
                @Suppress("AssignedValueIsNeverRead")
                isOpenDialog = false
            }
        )
    }

}

@Composable
private fun HideOptionsDialog(
    viewModel: SettingsViewModel,
    onDismiss: () -> Unit
) {

    val hideSuggested = viewModel.hideSuggested.collectAsState()
    val hideReels = viewModel.hideReels.collectAsState()
    val hideStories = viewModel.hideStories.collectAsState()
    val hidePeopleYouMayKnow = viewModel.hidePeopleYouMayKnow.collectAsState()
    val hideGroups = viewModel.hideGroups.collectAsState()
    val hideMarketplace = viewModel.hideMarketplace.collectAsState()

    // Switches here mean "shown in feed": on = visible, off = hidden (stored settings are "hide X")
    Dialog(
        onDismissRequest = { onDismiss() }
    ) {

        Column(
            modifier = Modifier
                .clip(RoundedCornerShape(28.dp))
                .background(color = MaterialTheme.colorScheme.surfaceContainer)
                .padding(vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = stringResource(R.string.show_in_feed_title),
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(horizontal = 24.dp)
            )
            Text(
                text = stringResource(R.string.show_in_feed_hint),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(start = 24.dp, end = 24.dp, bottom = 12.dp)
            )

            FeedItemToggle(Icons.Filled.Try, stringResource(R.string.suggested_posts), hideSuggested.value) {
                viewModel.setHideSuggested(!hideSuggested.value)
            }
            FeedItemToggle(Icons.Filled.EmojiPeople, stringResource(R.string.people_you_may_know), hidePeopleYouMayKnow.value) {
                viewModel.setHidePeopleYouMayKnow(!hidePeopleYouMayKnow.value)
            }
            FeedItemToggle(Icons.Filled.Camera, stringResource(R.string.reels), hideReels.value) {
                viewModel.setHideReels(!hideReels.value)
            }
            FeedItemToggle(Icons.Filled.BurstMode, stringResource(R.string.stories), hideStories.value) {
                viewModel.setHideStories(!hideStories.value)
            }
            FeedItemToggle(Icons.Filled.Storefront, stringResource(R.string.marketplace), hideMarketplace.value) {
                viewModel.setHideMarketplace(!hideMarketplace.value)
            }
            if (!viewModel.desktopLayout.collectAsState().value) {
                FeedItemToggle(Icons.Filled.Diversity1, stringResource(R.string.groups), hideGroups.value) {
                    viewModel.setHideGroups(!hideGroups.value)
                }
            }
        }
    }

}

@Composable
private fun FeedItemToggle(
    icon: ImageVector,
    title: String,
    isHidden: Boolean,
    onToggle: () -> Unit
) {
    val shown = !isHidden
    Row(
        modifier = Modifier
            .clickable { onToggle() }
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Icon(
            icon,
            contentDescription = null,
            modifier = Modifier.size(24.dp),
            tint = if (shown) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.outline
        )

        Column(Modifier.weight(1F)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = if (shown) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.outline
            )
            Text(
                text = stringResource(if (shown) R.string.state_shown else R.string.state_hidden),
                style = MaterialTheme.typography.bodySmall,
                color = if (shown) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
            )
        }

        SettingsSwitch(checked = shown, onCheckedChange = { onToggle() })
    }
}