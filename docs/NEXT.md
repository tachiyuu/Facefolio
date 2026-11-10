# Next steps

Where the M3 rebuild / stability pass stands (2026-11-10) and what is left.

## Done
- Launch: icon-less system splash (`Theme.Facefolio.Starting`, `splash_blank.xml`) held until the first
  Compose frame, then `SplashLoading` (tile 96→112 dp, shine, circle reveal). Same colour on both sides.
- Offline screen (`OfflineScreen.kt`) replaces `NetworkErrorDialog`; Settings rebuilt (LargeTopAppBar,
  compatibility indicator fed by `HealthBridge`, bottom sheets); launcher shortcut to Settings.
- WebView: no extra hardware layer, bundle not re-sent after load when DOCUMENT_START is supported.
- Fonts: Be Vietnam Pro via FontFace API (`tools/build-font-script.py` regenerates `raw/be_vietnam_pro.js`).
- Tab bar: evenly spaced, Groups tab icon centred. Counts hidden, including "Name and N others".

## Left to do
All six items of the 2026-11-10 list are done (see `docs/ANALYSIS.md` for measurements). Open:

1. **Lint translations**: `./gradlew :app:lintRelease` fails on `MissingTranslation`, and this predates this work
   (older strings missing in de/fr/pt and others; pl has only the new strings). CI runs `assembleDebug` only.
   Either translate the rest or mark the gap as a warning in `lint { }`.
2. **Light theme**: not checked on device. Facebook only follows its own account setting (it ignores the
   system and emulated colour scheme), so this needs the account switched to light mode by the user.
3. **Messages page**: Facebook's "Switch over to Messenger" page keeps a light status bar on a dark page.
4. **Baseline profile** (as in Vozforums) for faster first launch of the Compose code.

## Notes
- adb: `C:/Users/theng/AppData/Local/Android/Sdk/platform-tools` (not on PATH; `tools/cdp.js` needs it).
- Release id `com.tachiyuu.facefolio` (logged in), debug `com.tachiyuu.facefolio.test`.
- `scratch/` is untracked probe scripts, not part of the app.
