<p align="center">
  <img src="./assets/facefolio-mark.svg" alt="Facefolio" width="112">
</p>

<h1 align="center">Facefolio</h1>

<p align="center">
  A lightweight, ad-free Facebook client for Android with Material You theming,<br>
  feed filters, distraction-free reading, and privacy-focused design.
</p>

<p align="center">
  <a href="https://github.com/tachiyuu/Facefolio/releases/latest"><img alt="Download" height="40" src="./assets/download.svg"></a>
</p>

Facefolio is a modern, fast wrapper around the mobile Facebook website (`m.facebook.com`) in an Android
WebView. It transforms Facebook into a clean, respectful social space by removing ads, sponsored posts, suggested clutter, and applying native Material You dynamic colors.

## Features

Every feature is fully customizable through the in-app settings sheet.

### Feed & Clutter Control

| Setting | Default | What it does |
|---|---|---|
| Remove ads | On | Hides posts labelled as sponsored (multi-language and SVG icons), and Reels ads. |
| Show in feed → Suggested posts | Hidden | Hides home-feed posts that carry a *Follow* or *Join* button or *Suggested for you* labels. |
| Show in feed → People you may know | Hidden | Hides *People you may know* cards in the feed and search. |
| Show in feed → AI-generated posts | Hidden | Hides posts that Facebook labels *AI content* / *AI info*. |
| Show in feed → Reels | Shown | When hidden, removes Reels shelves from the feed. |
| Show in feed → Stories | Shown | When hidden, removes the Stories tray. |
| Show in feed → Marketplace | Shown | When hidden, removes Marketplace suggestions from the feed. |
| Show in feed → Groups | Shown | When hidden, removes group recommendations. |

When posts are hidden, an unobtrusive pill indicates: **"N hidden · Show"**. Tapping *Show* temporarily reveals them dimmed.

### Mindful & Minimal Look

| Setting | Default | What it does |
|---|---|---|
| Pinned tabs | Home, Groups, Notifications | Customizes tabs in the top navigation bar (Home, Groups, Notifications, Friends, Messages, Reels, Marketplace). |
| Hide like & share counts | Off | Hides metrics on the like, comment, and share buttons for a calm reading experience. |
| Quiet badges | Off | Replaces unread count numbers with minimal subtle dots. |
| Material You | On | Adapts Facebook's UI to your wallpaper's Material You colors while preserving proper contrast in Light and Dark modes. |
| AMOLED Black | On | Pure pitch-black background when Facebook dark mode is active. |
| Sticky Navbar | On | Keeps navigation controls pinned while scrolling. |
| Immersive mode | Off | Hides system status and navigation bars for full-screen browsing. |

### Utilities & Privacy

| Setting | Default | What it does |
|---|---|---|
| Download media | On | Convenient download button when viewing photos, videos, stories, or reels. |
| Copy to clipboard | On | Direct copy button for media view. |
| Pinch to zoom | Off | Smooth pinch-to-zoom support for images. |
| Desktop layout | Off | Switch between responsive mobile and full desktop Facebook layouts. |
| Privacy Sanitizer | On | Automatically strips `fbclid` tracking parameters and unwraps `l.facebook.com` redirect hops. |

## Build & Install

- Android 6.0 (API 23) or later.
- Standalone package name: `com.tachiyuu.facefolio`.

```bash
git clone https://github.com/tachiyuu/Facefolio.git
cd Facefolio
./gradlew assembleRelease
```

The APK is generated at `app/build/outputs/apk/release/app-release.apk`.

## Architecture

- `ui/screens/FacefolioWV.kt`: Hosts the multiplatform Compose WebView and coordinates document-start script injections.
- `scripts.js`: Core feed filtering engine (`addFeedFilter`), pinned tab management, and DOM mutation observers.
- `utils/jsBridge`: Type-safe bridges for Theme, Download, Clipboard, and Settings.
- `utils/fbRedirectSanitizer.kt`: Cleans redirect hops and tracking IDs.

## Credits & License

- Forked and evolved from [Materialbook](https://github.com/eepiemi/Materialbook).
- Uses [compose-webview-multiplatform](https://github.com/KevinnZou/compose-webview-multiplatform).
- Licensed under [GNU General Public License v3.0](./LICENSE).
