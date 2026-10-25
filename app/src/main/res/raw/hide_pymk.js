// Hide "People You May Know" suggestions on the Facebook search page
(function() {
  const hidePymk = () => {
    if (!window.location.href.includes('facebook.com/search/')) return;

    const imgArea = document.querySelector('[data-mcomponent="ImageArea"]');
    const suggCont = imgArea?.nextElementSibling;

    if (suggCont) suggCont.style.display = 'none';
  };

  hidePymk();

  window.onDomChange(hidePymk);
})();


// Hide "People You May Know" cards in the feed (see addFeedFilter in scripts.js)
(() => {
  const LABELS = new Set([
    'People you may know', 'Những người bạn có thể biết', 'Những người bạn có thể quen',
    'Personas que quizás conozcas', 'Personen, die du kennen könntest',
    'Vous connaissez peut-être', 'Pessoas que talvez conheças', 'Pessoas que você talvez conheça'
  ].map(window.normalizeFeedLabel));

  window.addFeedFilter((unit, labels) =>
    labels.slice(0, 4).some(text => LABELS.has(text)),
    'pymk'
  );
})();
