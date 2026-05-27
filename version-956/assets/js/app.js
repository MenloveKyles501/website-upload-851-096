(function () {
  var header = document.querySelector('[data-header]');
  var toggle = document.querySelector('[data-nav-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  function updateHeader() {
    if (!header) {
      return;
    }
    if (window.scrollY > 20) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
      document.body.classList.toggle('nav-open');
    });
  }

  document.querySelectorAll('img').forEach(function (image) {
    image.addEventListener('error', function () {
      image.classList.add('is-hidden');
    });
  });

  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var index = 0;
    var timer = null;

    function showSlide(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function startTimer() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, 5000);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        startTimer();
      });
    });

    showSlide(0);
    startTimer();
  });

  document.querySelectorAll('[data-movie-library]').forEach(function (library) {
    var scope = library.closest('section') || document;
    var panel = scope.querySelector('[data-filter-panel]') || scope;
    var search = panel.querySelector('[data-search]');
    var fields = Array.prototype.slice.call(panel.querySelectorAll('[data-filter-field]'));
    var sort = panel.querySelector('[data-sort]');
    var count = panel.querySelector('[data-result-count]');
    var cards = Array.prototype.slice.call(library.querySelectorAll('[data-movie-card]'));

    function populateFilters() {
      fields.forEach(function (select) {
        var field = select.getAttribute('data-filter-field');
        var values = cards
          .map(function (card) {
            return card.dataset[field] || '';
          })
          .filter(Boolean)
          .filter(function (value, position, array) {
            return array.indexOf(value) === position;
          })
          .sort(function (a, b) {
            if (/^\d{4}$/.test(a) && /^\d{4}$/.test(b)) {
              return Number(b) - Number(a);
            }
            return a.localeCompare(b, 'zh-Hans-CN');
          });

        values.forEach(function (value) {
          var option = document.createElement('option');
          option.value = value;
          option.textContent = value;
          select.appendChild(option);
        });
      });
    }

    function applyFilters() {
      var keyword = search ? search.value.trim().toLowerCase() : '';
      var activeFilters = fields.map(function (select) {
        return {
          field: select.getAttribute('data-filter-field'),
          value: select.value
        };
      });
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = [
          card.dataset.title,
          card.dataset.tags,
          card.dataset.summary,
          card.dataset.year,
          card.dataset.region,
          card.dataset.type,
          card.dataset.category
        ].join(' ').toLowerCase();

        var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchesFilters = activeFilters.every(function (item) {
          return !item.value || card.dataset[item.field] === item.value;
        });
        var isVisible = matchesKeyword && matchesFilters;
        card.classList.toggle('is-hidden', !isVisible);
        if (isVisible) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = visible;
      }
    }

    function applySort() {
      if (!sort) {
        return;
      }
      var mode = sort.value;
      var sortedCards = cards.slice();

      if (mode === 'year-desc') {
        sortedCards.sort(function (a, b) {
          return (Number(b.dataset.year) || 0) - (Number(a.dataset.year) || 0);
        });
      }

      if (mode === 'title-asc') {
        sortedCards.sort(function (a, b) {
          return (a.dataset.title || '').localeCompare(b.dataset.title || '', 'zh-Hans-CN');
        });
      }

      if (mode === 'default') {
        sortedCards = cards.slice();
      }

      sortedCards.forEach(function (card) {
        library.appendChild(card);
      });
    }

    populateFilters();
    applyFilters();

    if (search) {
      search.addEventListener('input', applyFilters);
    }
    fields.forEach(function (select) {
      select.addEventListener('change', applyFilters);
    });
    if (sort) {
      sort.addEventListener('change', function () {
        applySort();
        applyFilters();
      });
    }
  });

  document.querySelectorAll('[data-category-list]').forEach(function (list) {
    var input = document.querySelector('[data-category-search]');
    var cards = Array.prototype.slice.call(list.querySelectorAll('[data-category-card]'));

    if (!input) {
      return;
    }

    input.addEventListener('input', function () {
      var keyword = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var text = ((card.dataset.title || '') + ' ' + (card.dataset.summary || '')).toLowerCase();
        card.classList.toggle('is-hidden', keyword && text.indexOf(keyword) === -1);
      });
    });
  });
})();
