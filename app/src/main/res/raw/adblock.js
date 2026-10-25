// Hide sponsored posts and reels: any feed item labelled as an ad (see addFeedFilter in scripts.js)
(function() {
    'use strict';

    const LABELS = new Set([
        "Sponsored", "Ad", "Ads", "Gesponsert", "Anzeige", "Sponsorlu", "Sponsorowane",
        "Geborg", "Bersponsor", "Ditaja", "Disponsori", "Giisponsoran", "Sponzorováno",
        "Sponsoreret", "Publicidad", "Patrocinado", "May Sponsor", "Sponsorisé", "Sponsorisée",
        "Sponzorirano", "Sponsorizzato", "Imedhaminiwa", "Hirdetés", "Gesponsord", "Sponset",
        "Sponsorizat", "Sponzorované", "Sponsoroitu", "Sponsrat", "Được tài trợ", "Quảng cáo",
        "Χορηγούμενη", "Спонсорирано", "Спонзорирано", "Спонзорисано", "Реклама", "Oglas", "Peye",
        "במימון", "سپانسرڈ", "دارای پشتیبانی مالی", "ممول", "प्रायोजित", "স্পনসর্ড", "ਪ੍ਰਯੋਜਿਤ",
        "પ્રાયોજિત", "ପ୍ରାୟୋଜିତ", "ಪ್ರಾಯೋಜಿಸಲಾಗಿದೆ", "സ്‌പോൺസർ ചെയ്‌തത്", "ได้รับการสนับสนุน",
        "광고", "贊助", "赞助内容", "広告"
    ].map(window.normalizeFeedLabel));

    // Markup-level ad signals: "why this ad" links, and the mobile feed's grey (#8a8d91) ad tag
    const AD_MARKUP = 'a[href*="/ads/about"], a[href*="/ad_preferences"], ' +
        'div.native-text.rslh > span.f5[style*="color:#8a8d91"]:not([data-nosnippet])';

    window.addFeedFilter((unit, labels) =>
        labels.some(text => LABELS.has(text)) || unit.querySelector(AD_MARKUP) !== null,
        'ads'
    );
})();
