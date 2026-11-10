(function() {

    if (window.isDesktopMode()) {
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

          const forceFixed = el => {
            if (el?.classList.contains('xixxii4')) {
              el.style.setProperty('position', 'fixed', 'important');
            }
          };

          waitForBanner().then(banner => {
            const style = document.createElement('style');
            style.textContent = `
              div[role="banner"].xixxii4,
              div[role="banner"] .xixxii4 {
                position: fixed !important;
              }
            `;
            document.head.appendChild(style);

            forceFixed(banner);
            banner.querySelectorAll('.xixxii4').forEach(forceFixed);

            new MutationObserver(mutations => {
              for (const m of mutations) {
                if (m.type === 'childList') {
                  m.addedNodes.forEach(n => {
                    forceFixed(n);
                    n.querySelectorAll?.('.xixxii4')?.forEach(forceFixed);
                  });
                } else if (m.type === 'attributes' && m.attributeName === 'class') {
                  forceFixed(m.target);
                }
              }
            }).observe(banner, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
          });
        })();
        return;
    }

    let resizeObs = null;
    const observedElements = new WeakSet();

    // Prevent pull-to-refresh spinner container from occupying layout space or hovering over navbar
    const spinnerStyle = document.createElement('style');
    spinnerStyle.textContent = `
        .pull-to-refresh-spinner-container {
            display: none !important;
        }
    `;
    (document.head || document.documentElement).appendChild(spinnerStyle);

    const applyStyles = () => {
        const navbar = document.querySelector('div[data-tti-phase="-1"][data-mcomponent="MContainer"][data-type="container"][data-focusable="true"].m');
        const tabbar = document.querySelector('div[role="tablist"]');
        const scroller = document.querySelector('div[data-type="vscroller"][data-is-pull-to-refresh-allowed="true"]') ||
                         document.querySelector('div[data-type="vscroller"]');

        const hasLogo = !!navbar?.querySelector(window.__mbFB?.logo || 'div[aria-label*="Facebook"]');
        const hasFeed = !!tabbar?.querySelector('div[aria-label*="feed"]');

        // Sticky navbar only applies to the main feed where both logo navbar and feed tabs exist.
        // On other pages (Groups, Notifications, Messages), clear any sticky overrides to preserve native layouts.
        if (!hasLogo || !hasFeed) {
            if (navbar && navbar.style.position === 'fixed') {
                navbar.style.position = '';
                navbar.style.top = '';
                navbar.style.zIndex = '';
                navbar.style.backgroundColor = '';
            }
            if (tabbar && tabbar.style.position === 'fixed') {
                tabbar.style.position = '';
                tabbar.style.top = '';
                tabbar.style.zIndex = '';
                tabbar.style.backgroundColor = '';
            }
            if (scroller) {
                scroller.style.paddingTop = '';
                for (const child of scroller.children) {
                    if (child.style?.marginTop) child.style.marginTop = '';
                }
            }
            return;
        }

        // Observe navbar and tabbar resizes so cold-start font/image loads don't cause layout jumps
        if (typeof ResizeObserver !== 'undefined') {
            if (!resizeObs) {
                resizeObs = new ResizeObserver(() => applyStyles());
            }
            if (navbar && !observedElements.has(navbar)) {
                resizeObs.observe(navbar);
                observedElements.add(navbar);
            }
            if (tabbar && !observedElements.has(tabbar)) {
                resizeObs.observe(tabbar);
                observedElements.add(tabbar);
            }
        }

        const rawNavHeight = navbar ? parseFloat(getComputedStyle(navbar).height) || parseFloat(navbar.style.height) || 0 : 0;
        const rawTabHeight = tabbar ? parseFloat(getComputedStyle(tabbar).height) || parseFloat(tabbar.style.height) || 0 : 0;

        // Sensible fallback (44px navbar, 48px tabbar) so offset is never 0 during cold start
        const navbarHeight = rawNavHeight >= 20 ? rawNavHeight : (hasLogo ? 44 : 0);
        const tabbarHeight = rawTabHeight >= 20 ? rawTabHeight : (hasFeed ? 48 : 0);

        const isDark = document.documentElement.classList.contains('dark-mode') ||
                       (document.querySelector('meta[name="theme-color"]')?.getAttribute('content') === '#242526');
        const headerBg = isDark ? '#242526' : '#ffffff';

        if (hasLogo && navbar) Object.assign(navbar.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            marginTop: '0',
            width: '100%',
            backgroundColor: headerBg,
            zIndex: '1000',
            pointerEvents: 'auto'
        });

        if (hasFeed && tabbar) Object.assign(tabbar.style, {
            position: 'fixed',
            top: hasLogo ? navbarHeight + 'px' : '',
            left: '0',
            width: '100%',
            backgroundColor: headerBg,
            zIndex: '999',
            pointerEvents: 'auto'
        });

        if (scroller) {
            const offset = (hasLogo ? navbarHeight : 0) + (hasFeed ? tabbarHeight : 0);

            // Find the active scroll content child
            let scrollContent = null;
            for (const child of scroller.children) {
                if (child.tagName === 'DIV' &&
                    !child.classList.contains('pull-to-refresh-spinner-container') &&
                    child !== navbar && child !== tabbar &&
                    getComputedStyle(child).position !== 'fixed') {
                    scrollContent = child;
                    break;
                }
            }

            if (scrollContent) {
                // Clear obsolete marginTop on other children to avoid stale shifted elements
                for (const child of scroller.children) {
                    if (child !== scrollContent && child !== navbar && child !== tabbar && child.style?.marginTop) {
                        child.style.marginTop = '';
                    }
                }
                const targetMargin = offset + 'px';
                if (scrollContent.style.marginTop !== targetMargin) {
                    scrollContent.style.marginTop = targetMargin;
                }
            } else if (scroller.style.paddingTop !== offset + 'px') {
                scroller.style.paddingTop = offset + 'px';
            }

            if (window.isFeed()) scroller.style.paddingBottom = '0';
        }

        Object.assign(document.body.style, {
            paddingTop: '0',
            marginTop: '0',
            overflow: 'visible',
            height: '100%'
        });
    };

    applyStyles();
    window.onDomChange(applyStyles);
})();
