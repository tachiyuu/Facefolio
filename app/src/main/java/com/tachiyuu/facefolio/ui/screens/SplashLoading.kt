package com.tachiyuu.facefolio.ui.screens

import android.provider.Settings
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.Matrix
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.lerp
import com.tachiyuu.facefolio.R
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.hypot

// M3 easing tokens
private val Emphasized = CubicBezierEasing(0.2f, 0f, 0f, 1f)
private val EmphasizedDecelerate = CubicBezierEasing(0.05f, 0.7f, 0.1f, 1f)
private val EmphasizedAccelerate = CubicBezierEasing(0.3f, 0f, 0.8f, 0.15f)

// The launcher mark, 108-unit viewport, one contour per path so the shine can measure each stroke
private val MARK_PATHS = listOf(
    "M32,68V47a11,11 0,0 1,22 0v21" to 7f,
    "M54,47a11,11 0,0 1,22 0v21" to 7f,
    "M28,74c9,-4 17,-4 26,0c9,-4 17,-4 26,0" to 5f,
).map { (d, w) -> PathParser().parsePathString(d).toPath() to w }

private val TILE_START = 96.dp
private val TILE_END = 112.dp
private val RADIUS_START = 28.dp
private val RADIUS_END = 32.dp
private val ICON_START = 120.dp // the 108-unit mark is drawn at this size inside the tile...
private val ICON_END = 140.dp   // ...settling at ~60% of the tile, like a launcher icon

/**
 * Launch splash, drawn on the exact colour of the system splash (which is only that colour), so there is
 * nothing to mismatch at the hand-off. The tile and mark ease in from frame one, the name follows, a
 * shine says "alive" while Facebook loads, and a hairline appears only if loading passes 1.2 s. Once
 * [ready] the mark recedes and the page opens through a circle growing from it; [onFinished] follows.
 *
 * [entrance] false (a reload from settings) starts already settled.
 */
@Composable
fun SplashLoading(
    ready: Boolean,
    progress: Float,
    onFinished: () -> Unit,
    entrance: Boolean = true,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val reduceMotion = remember {
        Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
    }
    val finished by rememberUpdatedState(onFinished)

    var shown by remember { mutableStateOf(!entrance) }
    var alive by remember { mutableStateOf(!entrance) }
    var slow by remember { mutableStateOf(false) }
    var exiting by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        shown = true
        if (entrance) { delay(640); alive = true; delay(560) } else delay(1200)
        slow = true
    }

    val settle by animateFloatAsState(
        if (shown) 1f else 0f, tween(if (reduceMotion) 0 else 520, easing = Emphasized), label = "settle"
    )
    val fade by animateFloatAsState(
        if (shown) 1f else 0f, tween(if (reduceMotion) 0 else 240, easing = EmphasizedDecelerate), label = "fade"
    )
    val wordAlpha by animateFloatAsState(
        if (shown && !exiting) 1f else 0f,
        if (exiting) tween(150, easing = LinearEasing) else tween(360, 140, EmphasizedDecelerate),
        label = "wordAlpha"
    )
    val wordRise by animateFloatAsState(
        if (shown) 0f else 1f, tween(480, 140, EmphasizedDecelerate), label = "wordRise"
    )
    val hairAlpha by animateFloatAsState(
        if (slow && !ready && !exiting) 1f else 0f, tween(300, easing = LinearEasing), label = "hair"
    )
    val shownProgress by animateFloatAsState(
        progress.coerceIn(0.05f, 1f), tween(400, easing = Emphasized), label = "progress"
    )

    val markScale = remember { Animatable(1f) }
    val markAlpha = remember { Animatable(1f) }
    val reveal = remember { Animatable(0f) } // 0 = closed, 1 = hole covers the screen

    LaunchedEffect(ready) {
        if (!ready || exiting) return@LaunchedEffect
        exiting = true
        if (reduceMotion) {
            reveal.snapTo(1f)
        } else {
            launch { markScale.animateTo(0.71f, tween(420, easing = EmphasizedAccelerate)) }
            launch { markAlpha.animateTo(0f, tween(200, easing = LinearEasing)) }
            delay(60)
            reveal.animateTo(1f, tween(620, easing = EmphasizedDecelerate))
        }
        finished()
    }

    val shine = if (alive && !exiting && !reduceMotion) {
        rememberInfiniteTransition(label = "shine").animateFloat(
            -0.3f, 1.3f, infiniteRepeatable(tween(2400, easing = Emphasized), RepeatMode.Restart), label = "shinePos"
        ).value
    } else null

    val background = colorResource(R.color.splash_background)
    val tileColor = colorResource(R.color.splash_icon_background)
    val markColor = colorResource(R.color.splash_icon)
    val shineColor = lerp(markColor, Color.White, 0.55f)
    val trackColor = MaterialTheme.colorScheme.surfaceContainerHighest
    val barColor = MaterialTheme.colorScheme.primary

    Box(
        modifier = modifier
            .fillMaxSize()
            // Offscreen so the reveal can punch a transparent hole down to the WebView beneath
            .graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }
            .drawBehind {
                drawRect(background)
                if (reveal.value > 0f) {
                    drawCircle(
                        Color.Black,
                        radius = hypot(size.width, size.height) / 2f * 1.05f * reveal.value,
                        blendMode = BlendMode.Clear
                    )
                }
            },
        contentAlignment = Alignment.Center
    ) {
        Canvas(
            Modifier
                .size(ICON_END)
                .graphicsLayer {
                    scaleX = markScale.value; scaleY = markScale.value
                    alpha = markAlpha.value * fade
                }
        ) {
            val tile = lerp(TILE_START, TILE_END, settle).toPx()
            drawRoundRect(
                tileColor,
                topLeft = Offset((size.width - tile) / 2f, (size.height - tile) / 2f),
                size = Size(tile, tile),
                cornerRadius = CornerRadius(lerp(RADIUS_START, RADIUS_END, settle).toPx())
            )
            drawMark(lerp(ICON_START, ICON_END, settle), markColor, shineColor, shine)
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .padding(top = TILE_END + 96.dp)
                .offset(y = 8.dp * wordRise)
                .graphicsLayer { alpha = wordAlpha }
        ) {
            Text(
                stringResource(R.string.app_name),
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(
                stringResource(R.string.splash_tagline),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // Hairline progress, only once loading is noticeably slow
        Canvas(
            Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 96.dp)
                .width(96.dp)
                .height(3.dp)
                .graphicsLayer { alpha = hairAlpha }
        ) {
            val r = CornerRadius(size.height / 2f)
            drawRoundRect(trackColor, cornerRadius = r)
            drawRoundRect(barColor, size = Size(size.width * shownProgress, size.height), cornerRadius = r)
        }
    }
}

// Draws the mark scaled so its 108-unit viewport spans [area], centred in the canvas
private fun DrawScope.drawMark(area: Dp, color: Color, shineColor: Color, shine: Float?) {
    val unit = area.toPx() / 108f
    val origin = (size.width - area.toPx()) / 2f
    translate(origin, origin) {
        val scale = Matrix().apply { scale(unit, unit) }
        MARK_PATHS.forEach { (source, width) ->
            val path = Path().apply { addPath(source); transform(scale) }
            val stroke = Stroke(width * unit, cap = StrokeCap.Round, join = StrokeJoin.Round)
            drawPath(path, color, style = stroke)
            if (shine != null) {
                // A short bright segment travelling along the stroke
                val measure = PathMeasure().apply { setPath(path, false) }
                val len = measure.length
                val start = ((shine - 0.15f) * len).coerceIn(0f, len)
                val end = ((shine + 0.15f) * len).coerceIn(0f, len)
                if (end > start) {
                    val seg = Path()
                    measure.getSegment(start, end, seg, true)
                    drawPath(seg, shineColor, alpha = 0.55f, style = stroke)
                }
            }
        }
    }
}
