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
Paused 2026-11-10 mid-way through items 1-3; the fixes below are committed but the benchmarks are not run.

1. ~~Groups tab underline~~: done (our border removed).
2. **Other pages**: done for Notifications (tabs had collapsed to 0 width beside the title row; gear
   covered "mark all read"), Friends and Groups (our tab CSS now applies only to the main bar, marked
   `data-mb-nav`, so Groups' own sub-tabs are Facebook's). Still to look at: `/messages/` shows only a blue
   "Messages" header and an empty page; check whether that is Facebook's page or ours (compare with
   scripts disabled). Re-check the home screen once more right after a cold start (one capture showed
   a dark gear while the feed was still a skeleton).
3. **Benchmarks**: not run yet. Re-run with a debuggable build (temporarily `isDebuggable = true` in
   release, never commit it): `node tools/health-check.js --mobile-only`, `node tools/feed-audit.js`,
   `node tools/perf-bench.js --seconds 10`. Baseline: 62 fps, browser 80% of busy time.
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
