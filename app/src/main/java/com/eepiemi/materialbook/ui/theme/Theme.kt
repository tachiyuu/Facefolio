package com.eepiemi.materialbook.ui.theme

import android.content.Context
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    onBackground = Color.White,
    secondary = Color.DarkGray
)
private val LightColorScheme = lightColorScheme(
    onBackground = Color.Black,
    secondary = Color.LightGray
)

// Also used outside Compose theming: Facebook's own light/dark theme is independent of the system
// one, so the injected scripts get both palettes and pick the one matching the page.
fun materialbookColorScheme(context: Context, darkTheme: Boolean, dynamicColor: Boolean = true): ColorScheme =
    when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

@Composable
fun MaterialbookTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = materialbookColorScheme(LocalContext.current, darkTheme, dynamicColor),
        typography = Typography,
        content = content
    )
}