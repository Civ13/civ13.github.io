'use strict';
(function () {
  const choice = document.querySelector('#map-choice');
  const controls = document.querySelector('#map-controls');
  const count = document.querySelector('#map-count');
  const cards = Array.from(document.querySelectorAll('.map-card'));
  if (!choice || !controls || !count || !cards.length) return;
  function filter() {
    let visible = 0;
    for (const card of cards) {
      card.hidden = choice.value !== 'all' && card.dataset.map !== choice.value;
      if (!card.hidden) visible++;
    }
    count.textContent = `${visible} of ${cards.length} authored maps shown`;
  }
  for (const card of cards) {
    const button = card.querySelector('.load-overview');
    const image = card.querySelector('.overview');
    const status = card.querySelector('.image-status');
    if (!button || !image || !status) continue;
    const loadLabel = button.textContent;
    button.addEventListener('click', () => {
      button.hidden = true;
      button.textContent = loadLabel;
      status.textContent = 'Loading the pinned wiki overview…';
      image.src = image.dataset.src;
      image.hidden = false;
    });
    image.addEventListener('load', () => { status.textContent = 'Static overview loaded. Use the original layer links for detail.'; });
    image.addEventListener('error', () => {
      image.hidden = true;
      button.textContent = loadLabel.replace(/^Load /, 'Retry ');
      button.hidden = false;
      status.textContent = 'The overview could not load. You can still open the pinned wiki guide or original image link.';
    });
    button.hidden = false;
  }
  choice.addEventListener('change', filter);
  filter();
  controls.hidden = false;
})();
