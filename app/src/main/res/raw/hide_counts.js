// Hide like / comment / share counts. Only the numbers go: the buttons, their icons and the reaction
// emoji stay and keep working. Facebook renders a count either as its own text ("251") or in one text
// with the button's icon glyph ("\u{F0379} 45"); both live inside a [role="button"].
(() => {
    const MARK = 'data-mb-count';
    // optional icon-font glyphs (private use), then a short number like 12, 1.2K, 1,1 N, 2 Tr
    const COUNT = /^([-\u{F0000}-\u{FFFFD}\s]*)\d[\d.,\s]*(?:[KMBkmb]|N|Tr|tr|nghìn|triệu)?$/u;
    // "12 comments", "5 lượt chia sẻ" written out (some layouts and languages)
    const WORDS = /^\d[\d.,\s]*(?:[KMBkmb]|N|Tr|tr)?\s*(?:comments?|shares?|replies|reactions?|bình luận|lượt chia sẻ|chia sẻ|phản hồi|lượt thích|comentarios?|compartidos?|commentaires?|partages?|kommentare?|mal geteilt)$/iu;

    const style = document.createElement('style');
    style.textContent = `[${MARK}] { display: none !important; }`;
    document.head.appendChild(style);

    // "Name and 90 others" / "Name và 90 người khác": keep the name, drop the count
    const OTHERS = /\s*(?:and|và|,)\s+\d[\d.,\s]*(?:[KMBkmb]|N|Tr|tr)?\s*(?:others?|người khác|người).*$/iu;

    // Buttons whose text hasn't changed since they were last handled are skipped
    const seen = new WeakMap();

    function handle(button) {
        const text = button.textContent;
        if (seen.get(button) === text || text.length > 40) return;
        const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
        for (let node; (node = walker.nextNode());) {
            const value = node.nodeValue.trim();
            if (!value || node.parentElement.closest('[data-ad-preview="message"]')) continue;
            const count = COUNT.exec(value);
            if (count && /\d/.test(value)) {
                const glyphs = count[1].trim();
                if (glyphs) node.nodeValue = glyphs;              // keep the icon, drop the number
                else node.parentElement.setAttribute(MARK, '');   // a text that is only the number
            } else if (OTHERS.test(value)) {
                const name = value.replace(OTHERS, '').trim();
                if (name) node.nodeValue = name; else node.parentElement.setAttribute(MARK, '');
            } else if (WORDS.test(value)) {
                node.parentElement.setAttribute(MARK, '');
            }
        }
        seen.set(button, button.textContent);
    }

    const run = () => document.querySelectorAll('[role="button"]').forEach(handle);
    window.onDomChange(run);
    run();
})();
