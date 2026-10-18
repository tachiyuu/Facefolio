// Hide suggested content from the home feed: posts from people/pages/groups you don't follow
// carry a "Follow" / "Join" button or a "Suggested for you" label in their header.
(function() {
    'use strict';

    const LABELS = new Set([
        'Suggested for you', 'Follow', 'Join', 'Join group', 'Join now', 'Your group suggestions',
        'Gợi ý cho bạn', 'Theo dõi', 'Tham gia', 'Tham gia nhóm', 'Nhóm gợi ý cho bạn',
        'Sugerido para ti', 'Seguir', 'Unirte', 'Für dich vorgeschlagen', 'Folgen', 'Beitreten',
        'Suggéré pour vous', 'Suivre', 'Rejoindre', 'Disarankan untuk Anda', 'Ikuti', 'Gabung',
        'おすすめ', 'フォロー', '推荐', '关注', 'Önerilen', 'Takip Et', 'แนะนำสำหรับคุณ', 'ติดตาม'
    ].map(window.normalizeFeedLabel));

    // Only the header: a friend's post that merely says "Follow" in its text must stay
    const HEADER_LABELS = 12;

    window.addFeedFilter((unit, labels) =>
        location.pathname === '/' &&
        labels.slice(0, HEADER_LABELS).some(text => LABELS.has(text))
    );
})();
