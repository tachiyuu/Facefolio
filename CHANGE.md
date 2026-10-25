## Materialbook - v1.1.5

* Fix: with Facebook's dark mode on, the app sometimes loaded a page with its light-mode colours: light Material You accents on dark cards, and AMOLED Black not applied. It now always uses the colours of the theme Facebook shows.
* Fix: settings that turn a feature on or off (AMOLED Black, Quiet badges, the hide options, pinned tabs) now apply when you close the settings sheet. Before, they only applied with *Apply immediately* or after restarting the app.
* For maintainers: the app checks after the feed loads that the parts of Facebook's page it relies on are still there, and tools in `tools/` audit the feed, contrast and performance on a connected phone.

## Materialbook - v1.1.4

* Fix: the automatic desktop layout (used in landscape and on large screens) never switched back to the mobile layout. Once the app had been opened in landscape, it stayed in desktop layout. It now switches back, also when the phone is rotated while the app is open.

## Materialbook - v1.1.3

* The app has its own package name, `com.tachiyuu.materialbook`. It installs as a separate app from the original, so you need to log in again and re-select your settings.
* Removed the *Support my work* button from settings.

## Materialbook - v1.1.2

First release of this fork, based on eepiemi/Materialbook 1.0.0.

**Feed**
* One shared feed filter for all hiding features. Ads are detected from their label, including labels Facebook draws as SVG.
* Suggested posts and People you may know are hidden by default.
* New settings: hide AI-generated posts (on by default), hide Marketplace suggestions.
* A "N hidden · Show" line above the feed shows how many posts were hidden and lets you view them.

**Top bar**
* Pinned tabs: choose which tabs are shown (default Home, Groups, Notifications). Groups is a new tab that opens Your Groups.
* New settings: hide like & share counts, quiet badges.

**Look**
* Material You follows Facebook's own light/dark setting, and replacement colours keep the contrast of the colours they replace.
* AMOLED Black no longer applies on Facebook's light theme.
* New app icon.
* Redesigned settings: grouped sections, switches with check/cross marks, a "Show in feed" dialog.

**Fixes**
* With Sticky Navbar on, the logo bar could be pushed below the tabs.
* Settings stored in cookies (such as Facebook's dark mode) and logins are saved when the app goes to the background.
* Google sign-in pages open inside the app.
* External links no longer get double-encoded.

**Size and performance**
* Scripts are bundled in the app instead of downloaded from GitHub at runtime; the Ktor network library is removed.
* Less work per page change in the injected scripts.
* The WebView no longer uses an extra hardware layer.
