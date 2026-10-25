(function() {
  // The palette matching Facebook's theme, not the system's: a light page needs the darker light-scheme tones
  const DARK = window.isFacebookDark();
  const MATERIALYOU_PRIMARY = window.MaterialYouBridge.getMaterialYouPrimaryRgbString(DARK);
  const MATERIALYOU_ONPRIMARY = window.MaterialYouBridge.getMaterialYouOnPrimaryRgbString(DARK);
  const MATERIALYOU_PRIMARY_RGB = JSON.parse(window.MaterialYouBridge.getMaterialYouPrimaryRgb(DARK));
  const MATERIALYOU_ONPRIMARY_RGB  = JSON.parse(window.MaterialYouBridge.getMaterialYouOnPrimaryRgb(DARK));

  const backgroundColorRegex = /background-color\s*:\s*(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
  const backgroundRegex = /background\s*:\s*(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
  const colorRegex = /color\s*:\s*(rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)|rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)|#([0-9a-fA-F]{6}))\s*;/gi;
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

  // Mechanism to prevent some parts of the code infinitely triggering the MO, causing the function to loop
  const processedStyles = new WeakSet();

  const recolorColor = (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
    if ((r && g && b && isFacebookBlue(+r, +g, +b)) ||
    (hex && isFacebookBlue(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)))) || hex === 'e8eaee') return `color:${MATERIALYOU_PRIMARY};`;
    if (Ar && Ag && Ab && isFacebookBlue(+Ar, +Ag, +Ab)) return `color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, ${+Aa});`;
    if (gr === 'rgb(17, 17, 18)') return `color:#111112; caret-color:${MATERIALYOU_PRIMARY};`; // hacky communication between amoled_black.js and this file
    return m;
  };

  const recolorBackgroundColor = (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
    if ((r && g && b && isFacebookBlue(+r, +g, +b)) ||
    (hex && isFacebookBlue(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))))) return `background-color:${MATERIALYOU_PRIMARY};`;
    if (Ar && Ag && Ab && isFacebookBlue(+Ar, +Ag, +Ab)) return `background-color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, ${+Aa});`;
    if (gr === 'rgb(102, 106, 114)') return `background-color: ${MATERIALYOU_PRIMARY};`;
    if (hex === '252f3c') return `background-color: transparent;`;
    return m;
  };

  const recolorBackground = (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
    if ((r && g && b && isFacebookBlue(+r, +g, +b)) ||
    (hex && isFacebookBlue(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))))) return `background:${MATERIALYOU_PRIMARY};`;
    if (Ar && Ag && Ab && isFacebookBlue(+Ar, +Ag, +Ab)) return `background: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, ${+Aa});`;
    return m;
  };

  const recolorBorder = (m, px, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
    if ((r && g && b && isFacebookBlue(+r, +g, +b)) ||
    (hex && isFacebookBlue(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))))) return `border: ${px} solid ${MATERIALYOU_PRIMARY};`;
    if (Ar && Ag && Ab && isFacebookBlue(+Ar, +Ag, +Ab)) return `border: ${px} solid rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, ${+Aa});`;
    if (gr === 'rgb(102, 106, 114)') return `border: ${px} solid ${MATERIALYOU_PRIMARY};`;
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
    if (nbc && isFacebookBlue(...[1, 3, 5].map(i => parseInt(nbc.slice(i, i + 2), 16)))) el.style.setProperty('--nbc', MATERIALYOU_PRIMARY);
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
        style.innerHTML = style.innerHTML?.replace(backgroundColorRegex, (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
          if ((r && g && b && isFacebookBlue(+r, +g, +b)) ||
          (hex && isFacebookBlue(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))))) return `background-color:${MATERIALYOU_PRIMARY};`;
          if (Ar && Ag && Ab && isFacebookBlue(+Ar, +Ag, +Ab)) return `background-color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, ${+Aa});`;
          if (gr === 'rgba(0,152,124,1.0)') return `background-color:${MATERIALYOU_ONPRIMARY};`;
          if (gr === 'rgba(231,243,255,1.0)') return `background-color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.098);`;
          if (gr === 'rgba(235,245,255,1.0)') return `background-color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.2);`;
          if (gr === 'rgba(37,47,60,1.0)') return `background-color: rgb(${Object.values(MATERIALYOU_PRIMARY_RGB).map(c => Math.round(c * 0.49)).join(', ')});`;
          if (hex === '252f3c') return `background-color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.49);`;
          return m;
        });

        style.innerHTML = style.innerHTML?.replace(borderColorRegex, (m, gr, Ar, Ag, Ab, Aa, r, g, b, hex) => {
          if ((r && g && b && isFacebookBlue(+r, +g, +b)) ||
          (hex && isFacebookBlue(...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))))) return `border-color:${MATERIALYOU_PRIMARY};`;
          if (Ar && Ag && Ab && isFacebookBlue(+Ar, +Ag, +Ab)) return `border-color: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, ${+Aa});`;
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
    const style = document.createElement('style');
    style.textContent = `
      ::selection {
        background: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.5);
        color: ${MATERIALYOU_ONPRIMARY};
      }

      .wbloks_11 { --wbloks-fig-blue-tint-10: ${MATERIALYOU_ONPRIMARY} !important; }
      .wbloks_70, ._al7j a, ._aqwl { color: ${MATERIALYOU_PRIMARY}; }
      ._al7j ._al65, ._9nqa:checked + ._9nqb, .pull-to-refresh-spinner, .loading-bar-animation { background-color: ${MATERIALYOU_PRIMARY}; }
      .revamped-progress-bar-color .loading-bar-animation { background: ${MATERIALYOU_PRIMARY}; }
      .pull-to-refresh-spinner-icon { color: ${MATERIALYOU_ONPRIMARY}; }

      :root, .__fb-light-mode:root, .__fb-light-mode, .__fb-dark-mode:root, .__fb-dark-mode {
        --primary-button-background: ${MATERIALYOU_PRIMARY} !important;
        --blue-link: ${MATERIALYOU_PRIMARY} !important;
        --focus-ring-blue: ${MATERIALYOU_PRIMARY} !important;
        --accent: ${MATERIALYOU_PRIMARY} !important;
        --primary-icon: ${MATERIALYOU_PRIMARY} !important;
        --primary-deemphasized-button-text: ${MATERIALYOU_PRIMARY} !important;
        --highlight-bg: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.2) !important;
        --primary-deemphasized-button-background: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.2) !important;
        --primary-deemphasized-button-pressed-overlay: rgba(${MATERIALYOU_PRIMARY_RGB.r}, ${MATERIALYOU_PRIMARY_RGB.g}, ${MATERIALYOU_PRIMARY_RGB.b}, 0.15) !important;
      }

      /* Tint mobile Facebook logo and active navigation tabs */
      svg path[fill="#0866FF"], svg path[fill="#1877F2"], [fill="#1877f2"], [fill="#0866ff"] {
        fill: ${MATERIALYOU_PRIMARY} !important;
      }
      div[role="tab"][aria-selected="true"] svg, div[role="tab"][aria-selected="true"] path {
        fill: ${MATERIALYOU_PRIMARY} !important;
      }
      div[role="tab"][aria-selected="true"] {
        border-bottom-color: ${MATERIALYOU_PRIMARY} !important;
      }
      /* Tint buttons and interactive links */
      [data-mcomponent="MContainer"] [role="button"][style*="background"] {
        border-color: ${MATERIALYOU_PRIMARY} !important;
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