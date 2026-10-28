## Facefolio - v1.0.0

* Rebranded and decoupled into **Facefolio** (`com.tachiyuu.facefolio`), an independent, distraction-free Facebook client.
* Modernized package namespace and code structure into `com.tachiyuu.facefolio`.
* Removed broken legacy Playwright test suites and credentials remnants from upstream; added fast unit test suite for redirect sanitization and script injection bundling.
* Restructured data extraction & backup rules (`backup_rules.xml`) to safeguard user preference state without leaking session tokens.
* Modernized WebView bridge architecture (`FacefolioSettings`) with backward compatibility support.
* Added native Vietnamese localization (`values-vi/strings.xml`).
* Verified R8/ProGuard shrinking and resource optimization: release APK weighs only 1.2 MB.

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
