// Quiet badges: unread counts on the mobile header become a small dot. A badge is three stacked
// layers (ring, fill, number) sharing a "*.jewel.hidden" key; keep only the fill, shrunk to a dot.
// Round badges are ::before circles sized by --diameter; wider "pill" badges (e.g. "9+") fill
// their layer, so those are scaled down around their centre instead.
(() => {
    const BADGE = '[data-hidden-ref-key$=".jewel.hidden"]';
    const FILL = `${BADGE} + ${BADGE}:has(+ ${BADGE})`;

    const style = document.createElement('style');
    style.textContent = `
        ${BADGE}:has([data-markup-text-ref-key]), ${BADGE}:has(+ ${BADGE} + ${BADGE}) {
            visibility: hidden !important;
        }
        ${FILL} { --diameter: 9px !important; }
        ${FILL}[data-hidden-ref-key$=".pill.jewel.hidden"] { transform: scale(0.38, 0.48); }
    `;
    document.head.appendChild(style);
})();
