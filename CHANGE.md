## Facefolio - v1.0.1

* **Launch**: the app opens without a visible switch. The system splash shows only the background colour and stays until the app has drawn its first frame; the logo tile then eases in, and the feed opens out of it once Facebook has actually painted.
* **New screens**: an offline screen with Retry replaces the old network error dialog. Settings is rebuilt in Material 3 and shows whether Facebook still has everything the app relies on (*Facebook compatibility*). A long press on the app icon offers a *Settings* shortcut.
* **Feed**: tabs are evenly spaced and stay correct on Notifications, Friends and Groups; Groups' own sub-tabs are no longer hidden. The settings button never covers one of Facebook's buttons. "Name and 90 others" reaction counts are hidden along with the other counts.
* **Smoother**: scrolling is about 80 fps on a Pixel 7 (was about 62). The extra WebView hardware layer is gone, the script bundle is no longer sent twice, and the app's own scripts use about 5% of the main thread while scrolling.
* **Text in the feed uses Facebook's own font again.** Be Vietnam Pro made some post text overflow its box, because Facebook sizes text for its own font; it brought no speed gain. The app's own screens keep Be Vietnam Pro.
* Fix: on some launches the Facebook logo showed huge and clipped and the profile picture beside *What's on your mind?* was stretched.
* New texts are translated into all the app's languages.

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
