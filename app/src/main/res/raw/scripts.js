
// Desktop mode identifier
(() => {
    window.isDesktopMode = () => {
        return document.querySelector('html[id="facebook"]') !== null;
    }
})();

// Feed identifier
(() => {
    window.isFeed = () => {
        const isHomeUrl = window.location.pathname === '/' &&
            (window.location.hostname === 'm.facebook.com' || window.location.hostname === 'www.facebook.com');

        if (window.isDesktopMode()) return isHomeUrl;

        const hasSpecialButton = Array.from(document.querySelectorAll('[role="button"] span'))
            .some(span => span.textContent === '󱥆');

        return isHomeUrl && hasSpecialButton;
    };
})();

// Feed filter: hides whole feed items matched by any registered rule (ads, suggested posts, ...).
// Rules get the item and its short labels, so they don't depend on Facebook's markup or obfuscation.
(() => {
    const UNIT = '[aria-posinset], div[data-tracking-duration-id], div.vertically-snappable, article';
    const MARK = 'data-mb-hidden';
    const rules = [];

    const style = document.createElement('style');
    // html.mb-peek (set by the feed pill) shows hidden items again, dimmed
    style.textContent = `
        html:not(.mb-peek) [${MARK}] { display: none !important; }
        html.mb-peek [${MARK}=""] { opacity: 0.5; }
    `;
    document.head.appendChild(style);

    const normalize = text => text
        .replace(/[\u200B-\u200F\uFEFF]/g, '')
        .replace(/^[\s·•.]+|[\s·•.]+$/g, '')
        .toLowerCase();

    // Short texts of an item in document order. Labels may be plain text or
    // <svg><use href="#id"> pointing at a hidden <text> elsewhere in the page.
    // Facebook pads items with aria-hidden decoy texts, those are skipped.
    function labels(unit) {
        const out = [];
        const walker = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        for (let node; (node = walker.nextNode());) {
            let text = null;
            if (node.nodeType === Node.TEXT_NODE) {
                if (!node.parentElement.closest('[aria-hidden="true"]')) text = node.textContent;
            }
            else if (node.localName === 'use') {
                const ref = (node.getAttribute('href') || node.getAttribute('xlink:href') || '').slice(1);
                text = ref && document.getElementById(ref)?.textContent;
            }
            if (text && text.length <= 40) {
                const clean = normalize(text);
                if (clean) out.push(clean);
            }
        }
        return out;
    }

    // Items can nest (e.g. an article inside a positioned feed item): always act on the outermost one
    function outerUnit(el) {
        let unit = el.closest(UNIT), outer = null;
        while (unit) {
            outer = unit;
            unit = unit.parentElement?.closest(UNIT);
        }
        return outer;
    }

    function check(unit) {
        if (!unit.isConnected || unit.hasAttribute(MARK)) return;
        if (unit.querySelector('[role="tab"]')) return; // the mobile header is a feed item too

        const texts = labels(unit);
        if (!rules.some(rule => rule(unit, texts))) return;
        unit.setAttribute(MARK, '');

        // Mobile feed draws a thin separator before each post
        const separator = unit.previousElementSibling;
        if (separator && !separator.matches(UNIT) && separator.offsetHeight <= 12) separator.setAttribute(MARK, 'separator');
        hiddenChanged = true;
    }

    // Changes inside an item re-check only that item. Anything added outside items (new posts,
    // the hidden <svg> holding label text) re-checks every item. Batched per frame.
    const pending = new Set();
    let sweep = false, scheduled = false, hiddenChanged = false;

    const flush = () => {
        scheduled = false;
        if (sweep) document.querySelectorAll(UNIT).forEach(u => pending.add(outerUnit(u)));
        sweep = false;
        pending.forEach(check);
        pending.clear();
        if (hiddenChanged) document.dispatchEvent(new Event('mb-feed-hidden'));
        hiddenChanged = false;
    };

    const schedule = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(flush);
    };

    new MutationObserver(mutations => {
        if (!rules.length) return;
        for (const m of mutations) {
            const target = m.target.nodeType === 1 ? m.target : m.target.parentElement;
            const unit = target && outerUnit(target);
            if (unit) pending.add(unit);
            else if (m.addedNodes.length) sweep = true;
        }
        if (sweep || pending.size) schedule();
    }).observe(document.body, { childList: true, subtree: true, characterData: true });

    // rule(unit, labels) => true to hide the item. labels are passed through normalizeFeedLabel.
    window.normalizeFeedLabel = normalize;
    window.addFeedFilter = rule => {
        rules.push(rule);
        sweep = true;
        schedule();
    };
})();


// Header tabs (mobile): hideHeaderTab(name, glyph) removes a tab such as reels or marketplace.
// Facebook places each tab at a fixed x offset, so the remaining ones are spread out again.
(() => {
    const hidden = [];
    const barStyle = document.createElement('style');
    document.head.appendChild(barStyle);

    function relayout() {
        const tablist = document.querySelector('div[role="tablist"]');
        if (!tablist) return;
        const tabs = [...tablist.querySelectorAll('div[role="tab"]')];
        const visible = tabs.filter(tab => {
            const label = (tab.getAttribute('aria-label') || '').toLowerCase();
            const text = tab.textContent;
            const hide = hidden.some(([name, glyph]) => label.startsWith(name) || text.includes(glyph));
            if (hide && tab.style.display !== 'none') tab.style.display = 'none';
            return !hide;
        });
        // Tabs no longer cover the whole bar, so give the bar the tabs' own background
        // (painted by a ::before, like most of Facebook's mobile backgrounds). Facebook rewrites the
        // bar's inline style, so this goes in a stylesheet.
        const background = visible[0] && getComputedStyle(visible[0], '::before').backgroundColor;
        const rule = background ? `div[role="tablist"] { background-color: ${background} !important; }` : '';
        if (barStyle.textContent !== rule) barStyle.textContent = rule;
        const slot = tablist.offsetWidth / visible.length;
        visible.forEach((tab, i) => {
            const left = Math.round(i * slot + (slot - tab.offsetWidth) / 2) + 'px';
            if (tab.style.marginLeft !== left) tab.style.marginLeft = left;
        });
    }

    let scheduled = false;
    new MutationObserver(() => {
        if (!hidden.length || scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => { scheduled = false; relayout(); });
    }).observe(document.body, { childList: true, subtree: true });

    window.hideHeaderTab = (name, glyph) => {
        hidden.push([name, glyph]);
        relayout();
    };
})();


(function() {
    if (!window.isDesktopMode()) return;

    document.documentElement.style.fontSize = '18px';


    // Do not stick the navbar by default
    (() => {
      const waitForBanner = () => new Promise(resolve => {
        const existing = document.querySelector('div[role="banner"]');
        if (existing) return resolve(existing);

        new MutationObserver((mutations, obs) => {
          for (const { addedNodes } of mutations) {
            for (const node of addedNodes) {
              if (node.nodeType === 1 && node.matches('div[role="banner"]')) {
                obs.disconnect();
                return resolve(node);
              }
            }
          }
        }).observe(document.body, { childList: true, subtree: true });
      });

      const forceAbsolute = el => {
        if (el?.classList.contains('xixxii4')) {
          el.style.setProperty('position', 'absolute', 'important');
        }
      };

      waitForBanner().then(banner => {
        const style = document.createElement('style');
        style.textContent = `
          div[role="banner"].xixxii4,
          div[role="banner"] .xixxii4 {
            position: absolute !important;
          }
        `;
        document.head.appendChild(style);

        forceAbsolute(banner);
        banner.querySelectorAll('.xixxii4').forEach(forceAbsolute);

        new MutationObserver(mutations => {
          for (const m of mutations) {
            if (m.type === 'childList') {
              m.addedNodes.forEach(n => {
                forceAbsolute(n);
                n.querySelectorAll?.('.xixxii4')?.forEach(forceAbsolute);
              });
            } else if (m.type === 'attributes' && m.attributeName === 'class') {
              forceAbsolute(m.target);
            }
          }
        }).observe(banner, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      });
    })();


    // Remove "send" button to save space
    // Remove the third element in the interaction bar if nb is 4
    (function() {
      const parentSelector = '.xbmvrgn.x1diwwjn';
      const childSelector = '.x10b6aqq.x1yrsyyn.xs83m0k';

      function checkAndRemoveThird(parent) {
        const children = parent.querySelectorAll(childSelector);
        if (children.length === 4) children[2].remove();
      }

      document.querySelectorAll(parentSelector).forEach(checkAndRemoveThird);

      const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              if (node.matches(parentSelector)) {
                checkAndRemoveThird(node);
              }
              node.querySelectorAll(parentSelector).forEach(checkAndRemoveThird);
            }
          });
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    })();
})();


// Scroll to top on back-press at feed
(() => {
    window.backHandlerNB = () => {

        const dialogs = document.querySelectorAll('div[role="dialog"]');
        const isMenu = document.querySelector('div[role="menu"]')

        function scrollToTop() {
            if (window.scrollY !== 0) {
              // to interrupt any current scroll event.
              document.body.style.overflow = 'hidden';
              setTimeout(() => {
                 document.body.style.overflow = '';
                 window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 30);
              return "scrolling";
           } else return "exit";
        }

        if (window.isDesktopMode()) {
            if (window.isFeed() && !isMenu && dialogs.length === 1)
                return scrollToTop();
            else if (isMenu || dialogs.length > 1) {
                const escapeEvent = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    code: 'Escape',
                    keyCode: 27,
                    which: 27,
                    bubbles: true,
                    cancelable: true
                });
                window.dispatchEvent(escapeEvent);
                return "true";
            } else return "false"
        } else if (window.isFeed() && !isMenu && !dialogs.length) {
            return scrollToTop();
        } else return "false";
    }
})();

// Enable press and hold caption selection and apply custom selection color
(() => {
  const makeSelectable = (el) => {
    if (el.closest('div[role="button"]')) return;
    el.style.userSelect = 'text';
    el.style.pointerEvents = 'auto';
  };

  const updateText = () => {
    document.querySelectorAll('.native-text').forEach(makeSelectable);
  };

  const selectionStyle = document.createElement('style');
  selectionStyle.textContent = `
    .native-text::selection {
      background: #ccc;
      color: black;
    }
  `;
  document.head.appendChild(selectionStyle);

  updateText();

  new MutationObserver(updateText).observe(document.body, {
    childList: true,
    subtree: true
  });
})();

// Enhance Loading Overlay Script
(function() {
    function applyOverlayStyle() {
        const overlays = document.querySelectorAll('.loading-overlay');
        overlays.forEach(overlay => {
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        });
    }
    applyOverlayStyle();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length)
                applyOverlayStyle();
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();

// Hide facebook download button and other distractions at login page
(function() {
  function removeDistr() {
    document.querySelector('div[data-bloks-name="bk.components.Flexbox"][style*="background: rgb(255, 255, 255)"].wbloks_1')?.parentElement?.remove();

    document.querySelectorAll(
      'div[data-bloks-name="bk.components.Flexbox"][style*="padding-top: 20px; padding-bottom: 20px"],' +
      'div[data-bloks-name="bk.components.Flexbox"][style*="padding-left: 4px; padding-right: 4px; padding-bottom: 4px"],' +
      'div[data-bloks-name="bk.components.Flexbox"][style*="padding: 10px 12px; background: rgb(255, 255, 255)"],' +
      'div[data-bloks-name="bk.components.Flexbox"][style*="padding: 20px"]'
    )?.forEach(distr => distr.remove());
  }

  removeDistr();

  new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'childList' && m.addedNodes.length) {
        removeDistr();
        break;
      }
    }
  }).observe(document.body, {
    childList: true,
    subtree: true
  });
})();

// Make the loading bar's background transparent
(() => {
    const style = document.createElement('style');
    style.textContent = `
    .revamped-progress-bar-color .loading-bar-background { background: transparent; }
    .loading-bar-background { background-color: transparent; }
    `;
    document.head.appendChild(style);
})();

// Hide annoying bottom banners
const observer = new MutationObserver(() => {

  if (location.pathname === '/'
  && document.querySelector('div[role="button"][aria-label*="Facebook"]') === null) return;

  const element = document.querySelector('.bottom.fixed-container');
  if (
    element &&
    !element.hasAttribute('data-shift-on-keyboard-shown')
  ) {
    const heightAttr = element.getAttribute('data-actual-height');
    if (heightAttr && parseInt(heightAttr, 10) < 80) {
      element.style.display = 'none';
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });


// Hold Effect Script
(function() {
  const style = document.createElement('style');
  style.innerHTML = '* { -webkit-tap-highlight-color: rgba(180, 180, 180, 0.35); }';
  document.head.appendChild(style);
})();


/* The below scripts are specific to com.eepiemi.materialbook application. */

(() => {
  const onReady = (fn) => {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', fn);
     else fn();
  };

  onReady(() => {
    const BUTTON_ID = 'custom-settings-btn';
    const ICON_SVG = `
        <svg width="28" height="28" viewBox="0 -960 960 960"  fill="%FILL%">
            <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm112-260q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Z"/>
        </svg>`;

    const getFillColor = () => {
      const color = document.querySelector('meta[name="theme-color"]')?.content?.toLowerCase();
      return color === '#ffffff' ? '#080809' : '#e4e6eb';
    };

    const updateButtonColor = () => {
      const svg = document.querySelector(`#${BUTTON_ID} svg`);
      if (svg) svg.setAttribute('fill', getFillColor());
    };

    const findInsertionPoint = () => {
      const iconSpan = Array.from(document.querySelectorAll('span'))
        .find(span => span.textContent === '󱥊');
      const container = iconSpan?.closest('div[role="button"]')?.parentNode;

      const desktopTarget = document.querySelector(
        '.x6s0dn4.x78zum5.x1s65kcs.x1n2onr6.x1ja2u2z'
      );

      return { container, desktopTarget };
    };

    const createButton = () => {
      const btn = document.createElement('button');
      btn.id = BUTTON_ID;
      btn.setAttribute('style', `
        position: ${findInsertionPoint().desktopTarget === null ? 'fixed' : 'block'};
        top: 8px;
        right: 100px;
        background: transparent;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        pointer-events: auto;
      `);
      btn.innerHTML = ICON_SVG.replace('%FILL%', getFillColor());
      btn.onclick = () => SettingsBridge?.onSettingsToggle?.();
      return btn;
    };

    const insertButton = () => {
      if (document.getElementById(BUTTON_ID)) return;

      const { container, desktopTarget } = findInsertionPoint();
      const button = createButton();

      if (desktopTarget) desktopTarget.insertBefore(button, desktopTarget.firstChild);
      else if (container) container.insertBefore(button, container.firstChild);
    };

    insertButton();

    const observer = new MutationObserver(() => {
      if (!document.getElementById(BUTTON_ID) && isFeed()) {
        insertButton();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // observer for theme-color changes
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      new MutationObserver(updateButtonColor).observe(themeMeta, {
        attributes: true,
        attributeFilter: ['content'],
      });
    }
  });
})();


// Color Extraction Script
(function() {
    const meta = document.querySelector('meta[name="theme-color"]');
    const notify = () => window.ThemeBridge?.onThemeColorChanged?.(meta?.content ?? "null");
    if (meta) {
        notify();
        new MutationObserver(() => notify())
            .observe(meta, { attributes: true, attributeFilter: ['content'] });
    }
})();

// File Download Script
(function() {
    if (window._downloadBridgeInitialized) return;
    window._downloadBridgeInitialized = true;
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function(blob) {
        const reader = new FileReader();
        reader.onloadend = function() {
            if (reader.result)
                DownloadBridge.downloadBase64File(reader.result, blob.type);
        };
        reader.readAsDataURL(blob);
        return originalCreateObjectURL(blob);
    };
})();