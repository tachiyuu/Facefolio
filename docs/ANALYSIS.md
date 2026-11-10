# Facefolio: performance, Facebook dependencies, resilience

Measured on a Pixel 7, release build, home feed, 2026-11-10. Tools: `tools/perf-bench.js`,
`tools/health-check.js`, `tools/feed-audit.js` (need a debuggable build, see `tools/README.md`).

## Where the time goes

10 s of scripted scrolling on the feed:

| Who                               | Main-thread time | Share of busy time |
|-----------------------------------|------------------|--------------------|
| Chromium itself (style, layout, paint, compositing of Facebook's page) | ~1.2-1.9 s | 45-60 % |
| Facebook's own JavaScript         | ~0.6 s           | ~28 %              |
| Facefolio's injected scripts      | ~0.1-0.25 s      | 5-8 %              |

Result: about 80 fps (was about 62 before this round). Facefolio's own share was briefly 1.3 s per 10 s
when the settings button hit-tested its slot on every scroll frame; that now runs only on page changes.

The home page alone has about 7,700 DOM nodes, 33 stylesheets and about 250 network requests.

## Why it feels slower than the Vozforums app

Both apps are the same kind of app: a Kotlin + Jetpack Compose shell around an Android WebView, with
JavaScript injected into the page at `DOCUMENT_START`. The language is not the difference.
The page inside is.

- **voz.vn** is XenForo: server-rendered HTML, little JavaScript, a light DOM, and it never rebuilds the page while
  you read. The Vozforums scripts reshape a static page once.
- **m.facebook.com** is a client-rendered app: a large JavaScript runtime builds and re-builds the feed
  while you scroll (infinite list, recycled nodes, absolutely positioned text sized for its own font,
  videos, ads, tracking). About 90 % of the busy time belongs to Facebook's page, not to Facefolio.
- Every Facefolio feature (filters, count hiding, tab layout) has to react to Facebook's constant DOM changes
  (MutationObserver), while on voz the scripts run once per page.
- Facebook's servers and CDN add latency that no client can remove; ads cannot be blocked by domain the
  way Vozforums does, because Facebook serves them from its own domains.

So yes, Facebook's front end is much heavier to handle. What the app can still do is keep its own
part small (now about 5 %) and avoid making Chromium do extra layout.

## Could the app be rewritten "in Kotlin"?

It already is Kotlin. The JavaScript files in `res/raw` are not a different implementation language
you could swap. They are the only way to change a web page that runs inside a WebView. A fully native app (Kotlin UI
showing feed data) would need Facebook's data, and Facebook offers no public API for reading a user's
News Feed. Scraping its private endpoints breaks its terms, needs its login tokens, and breaks whenever they
change. That is why every third-party Facebook client is a WebView wrapper, Vozforums-style.

## Font in the feed

Be Vietnam Pro was injected into Facebook's pages (FontFace, latin + Vietnamese ranges). A/B on the same
build:

|                       | Font on        | Font off       |
|-----------------------|----------------|----------------|
| first contentful paint| 0.93-1.11 s    | 0.93-1.34 s    |
| scroll fps            | 81 / 88        | 76 / 85        |
| text boxes overflowing| 44 of 264      | 29 of 272 (all Facebook icon glyphs) |

There is no measurable speed difference, but the font made about 15 real text blocks overflow. Facebook lays out
text with sizes computed for its own font, and Be Vietnam Pro is wider. **Decision:** the feed uses
Facebook's font again. Be Vietnam Pro stays in the app's own Compose screens.

Removing it exposed a hidden bug. On about half of cold starts Facebook's server-rendered header kept a stale
Chromium layout: the logo and the composer avatar were sized against the page instead of their box,
so the logo showed huge and clipped. The font's loading had been forcing a full relayout that hid it.
`scripts.js` now forces one relayout on `load` (same frame, no flicker). It was correct in 8 of 8 cold starts after that.

## What depends on Facebook's markup

All of it is named in one place, `window.__mbFB` at the top of `res/raw/scripts.js`:

- the tab bar (`div[role="tablist"]`, `[role="tab"]` and their aria-labels), the feed item container, the
  `theme-color` meta tag, the header button glyphs (private-use icon characters), the logo;
- feed filters match on visible labels ("Sponsored", "Follow", "Suggested for you"…) in several
  languages;
- count hiding matches number formats inside `[role="button"]`.

Stable hooks are preferred (roles, aria attributes, meta tags) over Facebook's generated class names.

## Resilience plan

1. **One place to fix**: selectors and glyphs live only in `window.__mbFB`. `tools/check-scripts.js`
   fails the build check if a script uses a hook that is not declared there.
2. **Self-check in the page**: after the feed loads, `window.__mbHealth` checks that each hook still matches.
   The result goes to the app through `HealthBridge` and shows in Settings as *Facebook compatibility*,
   so a Facebook change is visible to the user instead of failing silently.
3. **Fail open**: a feature whose hook is missing does nothing. The tab layout only applies to the bar it
   can identify (first tab is Home, marked `data-mb-nav`), and the settings button hides when its anchor is
   missing or its slot holds another button. The launcher shortcut opens Settings regardless.
4. **Tools for the next change**: `health-check.js` (hooks), `feed-audit.js` (what each filter hid and
   why), `contrast-audit.js`, `perf-bench.js` (fps and who uses the main thread). Run them after any
   Facebook redesign or before a release.
5. **Keep our share small**: rAF-throttled observers, cached lookups, no style writes when nothing
   changed, no layout reads (hit tests, rect reads) in scroll handlers.

## Possible next steps for speed

- Baseline profile (`androidx.profileinstaller` + a `:baselineprofile` module, as in Vozforums) to speed
  up the first launch of Compose code. This affects app start, not scrolling in the WebView.
- Cap Facefolio's MutationObserver work further by observing the feed container instead of `document.body`
  where the hook is reliable.
