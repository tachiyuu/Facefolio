(function() {
  // The palette matching Facebook's theme, not the system's: a light page needs the darker light-scheme tones
  const DARK = window.isFacebookDark();
  const MATERIALYOU_PRIMARY = window.MaterialYouBridge.getMaterialYouPrimaryRgbString(DARK);
  const MATERIALYOU_ONPRIMARY = window.MaterialYouBridge.getMaterialYouOnPrimaryRgbString(DARK);
  const MATERIALYOU_PRIMARY_RGB = JSON.parse(window.MaterialYouBridge.getMaterialYouPrimaryRgb(DARK));
  const MATERIALYOU_ONPRIMARY_RGB  = JSON.parse(window.MaterialYouBridge.getMaterialYouOnPrimaryRgb(DARK));

  const backgroundColorRegex = /background-color\s*:\s*(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
  const backgroundRegex = /background\s*:\s*(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
  const colorRegex = /(?<![-\w])color\s*:\s*(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
  const borderRegex = /border\s*:\s*(\d{1}px)\s+solid\s+(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
  const borderColorRegex = /border-color\s*:\s*(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;

  function isFacebookBlue(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max - min;

    return (
      b > r + 40 &&
      b > g + 20 &&
      saturation > 60 &&
      b > 100
    );
  }

  // ---- Contrast guard ----
  // Facebook's palette is contrast-safe for its own theme. Pasting the Material You primary in verbatim
  // is not: a dark-theme primary is a light pastel, so formulas like "primary at 49%" turned subtle
  // dark surfaces into bright slate ones. So every substitute colour is derived from the colour it
  // replaces:
  // - tone(): surfaces and backgrounds keep the original's luminance, only the hue/saturation becomes
  //   the primary's. Same luminance means the same contrast against anything, in light, dark and AMOLED.
  // - accent(): text, icons and borders use the primary when it has at least the contrast the original
  //   had against the page; otherwise they fall back to tone() of the original.
  const rgbOf = (r, g, b, hex) => hex ? [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)) : [+r, +g, +b];
  const channel = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  const contrast = (a, b) => {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };

  const PRIMARY = [MATERIALYOU_PRIMARY_RGB.r, MATERIALYOU_PRIMARY_RGB.g, MATERIALYOU_PRIMARY_RGB.b];
  const SURFACE = rgbOf(0, 0, 0, (document.querySelector('meta[name="theme-color"]')?.getAttribute('content') || '')
    .replace('#', '').match(/^[0-9a-f]{6}$/i)?.[0] || (DARK ? '242526' : 'ffffff'));

  function rgbToHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }

  function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [r, g, b].map(v => Math.round((v + m) * 255));
  }

  const [HUE, SAT] = rgbToHsl(PRIMARY);
  const toneCache = new Map();

  // The primary's hue with the given colour's luminance (lightness found by bisection)
  function tone(rgb) {
    const key = rgb.join();
    if (toneCache.has(key)) return toneCache.get(key);
    const target = luminance(rgb);
    let lo = 0, hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (luminance(hslToRgb(HUE, SAT, mid)) < target) lo = mid; else hi = mid;
    }
    const result = hslToRgb(HUE, SAT, (lo + hi) / 2);
    toneCache.set(key, result);
    return result;
  }

  const accent = rgb => contrast(PRIMARY, SURFACE) >= contrast(rgb, SURFACE) ? PRIMARY : tone(rgb);
  const css = ([r, g, b], alpha) => alpha == null ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;

  // Mechanism to prevent some parts of the code infinitely triggering the MO, causing the function to loop
  const processedStyles = new WeakSet();

  // Callback arguments from the regexes: gr = whole value, (Ar, Ag, Ab, Aa) = rgba, (r, g, b) = rgb, hex.
  // Text-like roles (colour, borders) use accent(); surfaces (backgrounds) use tone().
  const isBlue = (r, g, b, hex) => (r && g && b && isFacebookBlue(+r, +g, +b)) || (hex && isFacebookBlue(...rgbOf(0, 0, 0, hex)));
  const isBlueRgba = (Ar, Ag, Ab) => Ar && Ag && Ab && isFacebookBlue(+Ar, +Ag, +Ab);

  const recolorColor = (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
    if (isBlue(r, g, b, hex) || hex === 'e8eaee') return `color:${css(accent(rgbOf(r, g, b, hex)))};`;
    if (isBlueRgba(Ar, Ag, Ab)) return `color: ${css(accent([+Ar, +Ag, +Ab]), +Aa)};`;
    if (gr === 'rgb(17, 17, 18)') return `color:#111112; caret-color:${MATERIALYOU_PRIMARY};`; // hacky communication between amoled_black.js and this file
    return m;
  };

  const recolorBackgroundColor = (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
    if (isBlue(r, g, b, hex)) return `background-color:${css(tone(rgbOf(r, g, b, hex)))};`;
    if (isBlueRgba(Ar, Ag, Ab)) return `background-color: ${css(tone([+Ar, +Ag, +Ab]), +Aa)};`;
    if (gr === 'rgb(102, 106, 114)') return `background-color: ${css(tone([102, 106, 114]))};`;
    if (hex === '252f3c') return `background-color: transparent;`;
    return m;
  };

  const recolorBackground = (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
    if (isBlue(r, g, b, hex)) return `background:${css(tone(rgbOf(r, g, b, hex)))};`;
    if (isBlueRgba(Ar, Ag, Ab)) return `background: ${css(tone([+Ar, +Ag, +Ab]), +Aa)};`;
    return m;
  };

  const recolorBorder = (m, px, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
    if (isBlue(r, g, b, hex)) return `border: ${px} solid ${css(accent(rgbOf(r, g, b, hex)))};`;
    if (isBlueRgba(Ar, Ag, Ab)) return `border: ${px} solid ${css(accent([+Ar, +Ag, +Ab]), +Aa)};`;
    if (gr === 'rgb(102, 106, 114)') return `border: ${px} solid ${css(accent([102, 106, 114]))};`;
    return m;
  };

  // Last style each element was recoloured to
  const recolored = new WeakMap();

  function recolorInline(el) {
    const before = el.getAttribute('style');
    if (!before || recolored.get(el) === before) return;
    let style = before;
    if (style.includes('color')) style = style.replace(colorRegex, recolorColor);
    if (style.includes('background-color')) style = style.replace(backgroundColorRegex, recolorBackgroundColor);
    if (style.includes('background')) style = style.replace(backgroundRegex, recolorBackground);
    if (style.includes('border:')) style = style.replace(borderRegex, recolorBorder);
    if (style !== before) el.setAttribute('style', style);
    recolored.set(el, style);
  }

  function recolorNbc(el) {
    const nbc = el.style.getPropertyValue('--nbc');
    if (nbc && isFacebookBlue(...rgbOf(0, 0, 0, nbc.trim().slice(1)))) el.style.setProperty('--nbc', css(accent(rgbOf(0, 0, 0, nbc.trim().slice(1)))));
  }

  // root itself (if it matches) plus its matching descendants
  const within = (root, selector) =>
    root === document ? [...document.querySelectorAll(selector)]
      : (root.matches(selector) ? [root] : []).concat([...root.querySelectorAll(selector)]);

  // root = document for the first pass; afterwards only the nodes that were added or restyled
  function processMaterialYouStyles(root = document) {
    if (root === document) processStyleTags();
    processInline(root);
  }

  function processStyleTags() {
    document.querySelectorAll('style')?.forEach(style => {
      if (processedStyles.has(style)) return;
      processedStyles.add(style);

      if (style.innerHTML) {
        // Facebook's blue-tinted surfaces (unread highlights, selected rows) keep their own luminance
        style.innerHTML = style.innerHTML?.replace(backgroundColorRegex, (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
          if (isBlue(r, g, b, hex)) return `background-color:${css(tone(rgbOf(r, g, b, hex)))};`;
          if (isBlueRgba(Ar, Ag, Ab)) return `background-color: ${css(tone([+Ar, +Ag, +Ab]), +Aa)};`;
          if (gr === 'rgba(0,152,124,1.0)') return `background-color:${MATERIALYOU_ONPRIMARY};`;
          if (gr === 'rgba(231,243,255,1.0)') return `background-color: ${css(tone([231, 243, 255]))};`;
          if (gr === 'rgba(235,245,255,1.0)') return `background-color: ${css(tone([235, 245, 255]))};`;
          if (gr === 'rgba(37,47,60,1.0)' || hex === '252f3c') return `background-color: ${css(tone([37, 47, 60]))};`;
          return m;
        });

        style.innerHTML = style.innerHTML?.replace(borderColorRegex, (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
          if (isBlue(r, g, b, hex)) return `border-color:${css(accent(rgbOf(r, g, b, hex)))};`;
          if (isBlueRgba(Ar, Ag, Ab)) return `border-color: ${css(accent([+Ar, +Ag, +Ab]), +Aa)};`;
          return m;
        });
      }
    });
  }

  function processInline(root) {
    // Inline styles, skipping elements whose style hasn't changed since they were last recoloured
    // (re-scanning the feed's thousands of styled elements on every DOM change was the costliest
    // thing the app did while scrolling)
    within(root, '[style]').forEach(recolorInline);

    within(root, '[style*="--nbc"]').forEach(recolorNbc);

    // Recolor story ring on the profile page + feed FB logo in light mode
    within(root, 'img[src*="vTzapVsBgS_.webp"], img[src*="NtDLSQuICbO.webp"]').forEach(img => {
      if (processedStyles.has(img)) return;
      processedStyles.add(img);
      // Facebook's ".ssr .img" is absolute at 100% of an ancestor wider than the logo's own slot;
      // keep the masked image inside its slot so the logo isn't drawn header-wide.
      img.style.cssText += `
        background-color: ${MATERIALYOU_PRIMARY};
        mask: url(${img.src}) no-repeat center / contain;
        content-visibility: hidden;
        position: static; width: 100%; height: 100%;
      `;
    });

    // Swap FB logo on the login screen
    within(root, 'img[src*="DUiOg0mJTjz.webp"]').forEach(img => {
      size = img.style.maxHeight;
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="${parseInt(size) * 1.5}px" height="${parseInt(size) * 1.5}px">
                    <circle cx="54" cy="54" r="54" fill="${MATERIALYOU_PRIMARY}" />
                    <g transform="translate(0 -6)" fill="none" stroke="${MATERIALYOU_ONPRIMARY}" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M32 74V53a11 11 0 0 1 22 0v21M54 53a11 11 0 0 1 22 0v21" stroke-width="7" />
                      <path d="M28 80c9-4 17-4 26 0c9-4 17-4 26 0" stroke-width="5" />
                    </g>
                   </svg>`;
      img.outerHTML = svg;
    });
  }

  processMaterialYouStyles();

  function materialYouCSS() {
    // Facebook's own blue for this theme is the reference the contrast guard keeps to
    const FB_BLUE = DARK ? [45, 136, 255] : [8, 102, 255];
    const ACCENT = css(accent(FB_BLUE));       // links, icons, indicators
    const FILL = css(tone(FB_BLUE));           // filled buttons: same luminance as Facebook's, so white labels stay readable
    const TINT = a => css(tone(FB_BLUE), a);   // translucent highlights

    const style = document.createElement('style');
    style.textContent = `
      ::selection {
        background: ${TINT(0.5)};
        color: ${MATERIALYOU_ONPRIMARY};
      }

      .wbloks_11 { --wbloks-fig-blue-tint-10: ${MATERIALYOU_ONPRIMARY} !important; }
      .wbloks_70, ._al7j a, ._aqwl { color: ${ACCENT}; }
      ._al7j ._al65, ._9nqa:checked + ._9nqb, .pull-to-refresh-spinner, .loading-bar-animation { background-color: ${ACCENT}; }
      .revamped-progress-bar-color .loading-bar-animation { background: ${ACCENT}; }
      .pull-to-refresh-spinner-icon { color: ${MATERIALYOU_ONPRIMARY}; }

      :root, .__fb-light-mode:root, .__fb-light-mode, .__fb-dark-mode:root, .__fb-dark-mode {
        --primary-button-background: ${FILL} !important;
        --blue-link: ${ACCENT} !important;
        --focus-ring-blue: ${ACCENT} !important;
        --accent: ${ACCENT} !important;
        --primary-icon: ${ACCENT} !important;
        --primary-deemphasized-button-text: ${ACCENT} !important;
        --highlight-bg: ${TINT(0.2)} !important;
        --primary-deemphasized-button-background: ${TINT(0.2)} !important;
        --primary-deemphasized-button-pressed-overlay: ${TINT(0.15)} !important;
      }

      /* Tint mobile Facebook logo and active navigation tabs */
      svg path[fill="#0866FF"], svg path[fill="#1877F2"], [fill="#1877f2"], [fill="#0866ff"] {
        fill: ${ACCENT} !important;
      }
      div[role="tab"][aria-selected="true"] svg, div[role="tab"][aria-selected="true"] path {
        fill: ${ACCENT} !important;
      }
      div[role="tab"][aria-selected="true"] {
        border-bottom-color: ${ACCENT} !important;
      }
      /* Tint buttons and interactive links */
      [data-mcomponent="MContainer"] [role="button"][style*="background"] {
        border-color: ${ACCENT} !important;
      }
    `;
    document.head.appendChild(style);
  }

  materialYouCSS();

  // Incremental: once per frame, only the subtrees that were added and the elements whose style
  // changed (Facebook recolours some elements in place). Our own recolouring writes are style
  // changes too, but recolorInline skips them as already done.
  const added = new Set(), restyled = new Set();
  let scheduled = false;
  const flush = () => {
    scheduled = false;
    if ([...added].some(el => el.tagName === 'STYLE' || el.querySelector('style'))) processStyleTags();
    restyled.forEach(el => { if (!added.has(el)) { recolorInline(el); recolorNbc(el); } });
    added.forEach(el => { if (el.isConnected) processInline(el); });
    added.clear();
    restyled.clear();
  };
  new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'attributes') restyled.add(m.target);
      else m.addedNodes.forEach(n => { if (n.nodeType === 1) added.add(n); });
    }
    if (!scheduled && (added.size || restyled.size)) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style']
  });
})();