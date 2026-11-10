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
Items 1-3 done 2026-11-10:
- Groups underline removed; tab bar fixed on Notifications/Friends/Groups; gear hides where its slot
  holds a button. `/messages/` is Facebook's own "Switch over to Messenger" page (not ours); its status
  bar stays light on a dark page, a possible small polish.
- Benchmarks: health-check all OK; feed-audit hides ads/suggested as expected; perf-bench 80 fps
  (baseline 62), our share of main-thread busy time 5% (place() hit-testing per scroll frame had made it
  1.3 s per 10 s; now only on DOM changes).

4. **Docs**: `docs/mockup/facefolio-m3.html` still says frame 0 is a system splash with the icon in a
   160 dp circle; it is now plain surface colour with the Compose tile easing in. Write `docs/ANALYSIS.md`
   (UI bottlenecks, Facebook dependencies, resilience plan: central `window.__mbFB` selectors, health
   reporting, fail-open, tools/). Update `CHANGE.md`.
5. **Locales**: new strings exist only in `values/` and `values-vi/`; other locales fall back to English.
6. Light theme and AMOLED / Material You checks of the tab bar.

## Notes
- adb: `C:/Users/theng/AppData/Local/Android/Sdk/platform-tools` (not on PATH; `tools/cdp.js` needs it).
- Release id `com.tachiyuu.facefolio` (logged in), debug `com.tachiyuu.facefolio.test`.
- `scratch/` is untracked probe scripts, not part of the app.
