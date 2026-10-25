<p align="center">
  <img src="./assets/materialbook-mark.svg" alt="Materialbook" width="112">
</p>

<h1 align="center">Materialbook</h1>

<p align="center">
  A lightweight Facebook client for Android with Material You theming,<br>
  ad blocking and filters for suggested content.
</p>

<p align="center">
  <a href="https://github.com/tachiyuu/Materialbook/releases/latest"><img alt="Download" height="40" src="./assets/download.svg"></a>
</p>

Materialbook is a wrapper around the mobile Facebook website (`m.facebook.com`) in an Android
WebView. It changes how the site looks and what it shows by injecting scripts bundled with the
app. It is not affiliated with Meta.

This repository is a fork of [eepiemi/Materialbook](https://github.com/eepiemi/Materialbook).

## Features

Every feature is a setting. The default value is shown for each one.

### Feed

| Setting | Default | What it does |
|---|---|---|
| Remove ads | On | Hides posts labelled as sponsored (in many languages, including labels Facebook draws as SVG), and the same in Reels. |
| Show in feed → Suggested posts | Hidden | Hides home-feed posts that carry a *Follow* or *Join* button or a *Suggested for you* label, i.e. posts from people, pages and groups you don't follow. |
| Show in feed → People you may know | Hidden | Hides *People you may know* cards in the feed and on the search page. |
| Show in feed → AI-generated posts | Hidden | Hides posts that Facebook labels *AI content* / *AI info*. |
| Show in feed → Reels | Shown | When hidden, removes Reels shelves from the feed. |
| Show in feed → Stories | Shown | When hidden, removes the Stories tray. |
| Show in feed → Marketplace | Shown | When hidden, removes Marketplace suggestions from the feed. |
| Show in feed → Groups | Shown | When hidden, removes group suggestions on the search page and the groups section on post and group pages. |

When posts are hidden, a single line above the feed shows how many: **"N hidden · Show"**. Tapping
*Show* reveals them (dimmed) until you tap *Hide*.

### Fewer distractions

| Setting | Default | What it does |
|---|---|---|
| Pinned tabs | Home, Groups, Notifications | Chooses which tabs appear in the top bar. Home is always shown. Can be pinned: Groups, Notifications, Friends, Messages, Reels, Marketplace. Groups is a tab added by the app; it opens *Your Groups*. |
| Hide like & share counts | Off | Hides the numbers on the like, comment and share buttons. The buttons still work. |
| Quiet badges | Off | Replaces unread counts on the tabs with a small dot, and shows no badge on the tab you are already on. |

### Look

| Setting | Default | What it does |
|---|---|---|
| Material You | On | Replaces Facebook's blues with your wallpaper's Material You colours. It follows Facebook's own light/dark setting, and every replacement colour keeps the contrast of the colour it replaces, so text stays readable in both themes. |
| AMOLED Black | On | Turns Facebook's dark theme pure black. Only applies when Facebook's dark mode is on. |
| Sticky Navbar | On | Keeps the top bar and tabs visible while scrolling. |
| Immersive mode | Off | Hides the system status and navigation bars. |

The app icon is a themed icon: on Android 12 and later it takes its colours from your wallpaper,
and it supports Android's monochrome themed icons.

### Advanced

| Setting | Default | What it does |
|---|---|---|
| Download contents | On | Adds a download button when viewing a photo, video, story or reel. |
| Copy to clipboard | On | Adds a button that copies the image you are viewing to the clipboard. |
| Pinch to zoom | Off | When off, page zoom is locked except on photos. |
| Desktop layout | Off | Loads the desktop Facebook site. It is switched on automatically in landscape and on screens at least 600dp wide, and switched back afterwards. |

### Other behaviour

- Links to other websites open in your browser. Facebook's redirect (`l.facebook.com`) is removed and
  the `fbclid` tracking parameter is stripped.
- Google sign-in pages open inside the app, so you can log in to Facebook with Google.
- A settings button (⚙) sits in the header of the home feed.
- The app contains no analytics or tracking of its own. All scripts are bundled in the APK; nothing
  is downloaded at runtime apart from Facebook itself.

## Install

Download the APK from [Releases](https://github.com/tachiyuu/Materialbook/releases/latest).

- Requires Android 6.0 (API 23) or later.
- The package name is `com.tachiyuu.materialbook` (since 1.1.3). It installs as a separate app from
  the original Materialbook and from version 1.1.2 of this fork, which used the original's package name.

## Build from source

```bash
git clone https://github.com/tachiyuu/Materialbook.git
```

Open the folder in Android Studio and run the `app` configuration, or build from the command line:

```bash
./gradlew assembleRelease
```

The APK is written to `app/build/outputs/apk/release/`.

## How it works

- `ui/screens/MaterialbookWV.kt` hosts the WebView and injects the scripts from `app/src/main/res/raw/`
  at document start (with a fallback after page load).
- `scripts.js` is always loaded. It contains the shared feed filter (`addFeedFilter`): each hiding
  feature is a small rule that receives a feed item and its visible labels, and the filter hides the
  whole item. It also contains the pinned-tabs layout and a shared page observer (`onDomChange`).
- Each setting enables one script (`adblock.js`, `hide_suggested.js`, `material_you.js`, …), see
  `ui/viewmodel/MainViewModel.kt`.

## Credits

- [eepiemi/Materialbook](https://github.com/eepiemi/Materialbook), the original app this fork is based on
- [KevinnZou/compose-webview-multiplatform](https://github.com/KevinnZou/compose-webview-multiplatform)

## License

[GNU General Public License v3.0](./LICENSE)
