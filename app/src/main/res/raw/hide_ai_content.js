// Hide posts Facebook labels as AI-generated ("AI content" / "AI info" next to the author)
(() => {
    const LABELS = new Set([
        'AI content', 'AI info', 'Made with AI', 'AI-generated', 'AI generated',
        'Nội dung AI', 'Thông tin về AI', 'Được tạo bằng AI', 'Tạo bằng AI'
    ].map(window.normalizeFeedLabel));

    // Only the header, where Facebook puts the label: a post merely mentioning "AI info" stays
    window.addFeedFilter((unit, labels) => labels.slice(0, 8).some(text => LABELS.has(text)));
})();
