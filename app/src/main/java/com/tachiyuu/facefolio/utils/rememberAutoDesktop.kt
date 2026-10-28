package com.tachiyuu.facefolio.utils

import android.content.res.Configuration
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration

// Desktop layout is used automatically in landscape and on large screens. Keyed on the configuration:
// the activity handles rotation itself (configChanges), so this must update when the phone turns.
@Composable
fun rememberAutoDesktop(): Boolean {
    val configuration = LocalConfiguration.current
    return remember(configuration.orientation, configuration.smallestScreenWidthDp) {
        configuration.orientation == Configuration.ORIENTATION_LANDSCAPE ||
            configuration.smallestScreenWidthDp >= 600
    }
}
