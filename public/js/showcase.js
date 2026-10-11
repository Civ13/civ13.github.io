'use strict';
// Ordinary content and image links remain usable without JavaScript.
const finder = document.querySelector('.mode-finder');
if (finder) {
  finder.hidden = false;
  const search = document.querySelector('#mode-search');
  const style = document.querySelector('#mode-style');
  const cards = [...document.querySelectorAll('.mode-card')];
  function filterModes() {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      card.hidden = !((style.value === 'all' || card.dataset.style === style.value) && terms.every(term => card.dataset.search.includes(term)));
      if (!card.hidden) visible++;
    }
    document.querySelector('#mode-count').textContent = `${visible} of ${cards.length} modes shown`;
    document.querySelector('#mode-empty').hidden = visible > 0;
  }
  search.addEventListener('input', filterModes);
  style.addEventListener('change', filterModes);
  filterModes();
}
const viewer = document.querySelector('#screenshot-viewer');
if (viewer && typeof viewer.showModal === 'function') {
  let opener;
  for (const link of document.querySelectorAll('.gallery-link')) {
    link.addEventListener('click', event => {
      event.preventDefault();
      opener = link;
      const full = document.querySelector('#screenshot-full');
      full.src = link.href;
      full.alt = link.dataset.caption;
      document.querySelector('#screenshot-caption').textContent = link.dataset.caption;
      viewer.showModal();
    });
  }
  document.querySelector('#gallery-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => opener?.focus());
}
