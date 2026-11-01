'use strict';
(function () {
  function normalize(value) {
    return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/_/g, ' ').trim();
  }

  function matches(text, category, query, selectedCategory) {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return (selectedCategory === 'all' || selectedCategory === category) && terms.every(term => normalize(text).includes(term));
  }

  // The same matching contract is tested offline without a browser or network.
  if (typeof module !== 'undefined' && module.exports) module.exports = { matches };
  if (typeof document === 'undefined') return;
  const finder = document.querySelector('#help-finder');
  const search = document.querySelector('#help-search');
  const category = document.querySelector('#help-category');
  const count = document.querySelector('#help-count');
  const empty = document.querySelector('#help-empty');
  const cards = Array.from(document.querySelectorAll('.help-resource'));
  if (!finder || !search || !category || !count || !empty || !cards.length) return;

  function filter() {
    let visible = 0;
    for (const card of cards) {
      card.hidden = !matches(card.textContent + ' ' + card.dataset.keywords, card.dataset.category, search.value, category.value);
      if (!card.hidden) visible++;
    }
    count.textContent = `${visible} of ${cards.length} guide links shown`;
    empty.hidden = visible !== 0;
  }

  search.addEventListener('input', filter);
  category.addEventListener('change', filter);
  filter();
  finder.hidden = false;
})();
