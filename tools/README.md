# Maintenance tools

Facebook changes its markup without notice, and nothing crashes when it does: a feature just stops
working. These scripts drive the app's WebView over the Chrome DevTools Protocol, so after a Facebook
update you can see in a minute what broke. They need Node 22+ (no npm install) and `adb` on `PATH`.

## Setup

1. Build a debuggable app. WebView inspection is only on in debuggable builds:
   - the debug build (`./gradlew installDebug`, package `com.tachiyuu.materialbook.test`, a separate app
     you sign in to once), run the tools with `MB_PACKAGE=com.tachiyuu.materialbook.test`, or
   - the release build with `isDebuggable = true` added to `buildTypes.release` in
     `app/build.gradle.kts`, installed over the normal app (same signing key, keeps the login).
     **Don't commit that line.**
2. Connect the phone (USB debugging on), open the app, wait for the feed.
3. Run a tool from the repository root. Each one finds the app's process and forwards
   `localabstract:webview_devtools_remote_<pid>` to `tcp:9333` itself (`MB_PORT` changes the port).

## Tools

| Command | What it tells you |
|---|---|
| `node tools/check-scripts.js` | **No phone needed.** Every script in `res/raw` parses, every `window.__mbFB` reference names a hook that exists (a typo gives `undefined` and fails silently), feed rules are named, `scripts.js` is injected first. Run it before each build. |
| `node tools/health-check.js` | **Start here.** Loads the feed in the mobile and the desktop layout (desktop user agent, as the app uses in landscape) and prints the self-check per hook plus any error our scripts logged or threw. `--mobile-only` skips desktop. |
| `node tools/feed-audit.js` | Scrolls the feed (`--scrolls 20`) and lists every hidden item with the rule that hid it (`ads`, `suggested`, `reels`, `pymk`, `ai`, `marketplace`), plus **visible ads** that slipped through, and the self-check result. `--all` lists shown items too, `--reload` starts from a fresh feed. |
| `node tools/contrast-audit.js` | Loads feed, notifications, menu and groups (`--pages feed,menu`) and measures every visible text and icon against what is painted behind it: 4.5:1 for text, 3:1 for large text and icons (WCAG AA). Failures are grouped by colour pair with a sample and a short element path. Text over photos is skipped. Run it in each theme you care about (Facebook light/dark, Material You, AMOLED). |
| `node tools/perf-bench.js` | Scrolls the feed for `--seconds 10` under the CPU profiler and splits main-thread time into ours (the injected bundle, `materialbook-scripts.js`), Facebook's, GC and browser work, plus our hottest functions with their line in the bundle. |

Exit code 2 means the tool found a problem (visible ads, a failed self-check, contrast failures).

Things that are expected and not ours: Facebook's green photo glyph in the composer (#45bd62 on white,
2.4:1) fails the icon threshold; "scroll driver" in the benchmark is the tool's own scrolling.

## Self-check in the app

`scripts.js` checks after the home feed loads that its key Facebook hooks still match: mobile checks
feed items, header tabs, the theme-color meta, that the palette the scripts chose matches Facebook's
theme (`theme`), the logo and the home icon glyph; desktop checks the
header actions, the sticky banner class and the post action bar. The result is in `window.__mbHealth`
(`status: ok | failed | skipped | pending`, and the failing hook names); failures are also logged with
`console.warn`. It costs one check every half second while the feed loads (20 s at most) and nothing
after. `health-check.js` and `feed-audit.js` print it, or in DevTools run `__mbHealth.run()`.

## When something broke

1. Run `health-check.js`: a MISSING hook names what Facebook changed. Then `feed-audit.js`: visible
   ads mean the ad rule missed.
2. Look the hook up in `window.__mbFB` at the top of `app/src/main/res/raw/scripts.js`; the selectors
   and icon glyph codes the scripts depend on live there, so a Facebook change is usually one edit.
3. Inspect the live page in `chrome://inspect` on the PC to find the new markup, update the constant,
   run `check-scripts.js`, rebuild, and run the tools again.
4. Before a release: `check-scripts.js`, `health-check.js`, `feed-audit.js`, and `contrast-audit.js` in
   the themes you changed; `perf-bench.js` when you touched code that runs while scrolling.
