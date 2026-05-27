
function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function initNav() {
  const toggle = qs('[data-nav-toggle]');
  const nav = qs('[data-nav]');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');
  });

  qsa('[data-nav] a').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });
}

function initHeroCarousel() {
  const carousel = qs('[data-hero-carousel]');
  if (!carousel) return;
  const slides = qsa('.hero-slide', carousel);
  const dots = qsa('[data-hero-dot]', carousel);
  const prev = qs('[data-hero-prev]', carousel);
  const next = qs('[data-hero-next]', carousel);
  if (!slides.length) return;

  let index = 0;
  let timer = null;

  function show(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  function start() {
    stop();
    timer = setInterval(() => show(index + 1), 5200);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    show(i);
    start();
  }));

  prev?.addEventListener('click', () => {
    show(index - 1);
    start();
  });

  next?.addEventListener('click', () => {
    show(index + 1);
    start();
  });

  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  show(0);
  start();
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function renderPosterCard(movie) {
  const tags = (movie.tags || []).slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
  return `
    <article class="movie-card">
      <a href="${movie.detailUrl}" class="movie-poster">
        <img src="${movie.coverPath}" alt="${escapeHtml(movie.title)}海报" loading="lazy"
             onerror="this.style.display='none'; this.parentElement.classList.add('poster-fallback')">
        <div class="overlay"></div>
        <div class="poster-info">
          <div class="id-badge">${escapeHtml(movie.id)} · ${escapeHtml(movie.categoryName)}</div>
          <h3 class="poster-title">${escapeHtml(movie.title)}</h3>
          <div class="poster-meta">
            <span class="chip">${escapeHtml(movie.region || '')}</span>
            <span class="chip">${escapeHtml(movie.year || '')}</span>
            <span class="chip">${escapeHtml(movie.type || '')}</span>
          </div>
        </div>
      </a>
      <div class="movie-body">
        <h3 class="movie-title"><a href="${movie.detailUrl}">${escapeHtml(movie.title)}</a></h3>
        <div class="movie-meta">${escapeHtml(movie.genre || '')}</div>
        <div class="movie-excerpt">${escapeHtml(movie.oneLine || '')}</div>
        <div class="movie-links">${tags}<a class="btn-soft" href="${movie.detailUrl}">查看详情</a></div>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initSearchPage() {
  const root = qs('[data-search-page]');
  if (!root || !window.MOVIES_DATA) return;
  const input = qs('[data-search-input]', root);
  const results = qs('[data-search-results]', root);
  const counter = qs('[data-search-count]', root);
  const categoryButtons = qsa('[data-filter-category]', root);

  const params = new URLSearchParams(location.search);
  const qParam = params.get('q') || '';
  if (input) input.value = qParam;

  let activeCategory = 'all';

  function getResults() {
    const query = normalizeText(input ? input.value : qParam);
    return window.MOVIES_DATA.filter(movie => {
      const hay = normalizeText([
        movie.title, movie.region, movie.type, movie.year,
        movie.genre, (movie.tags || []).join(' '), movie.oneLine, movie.categoryName
      ].join(' '));
      const matchQuery = !query || hay.includes(query);
      const matchCategory = activeCategory === 'all' || movie.categorySlug === activeCategory;
      return matchQuery && matchCategory;
    });
  }

  function render() {
    const list = getResults();
    if (counter) counter.textContent = `${list.length} 条结果`;
    if (!results) return;
    if (!list.length) {
      results.innerHTML = '<div class="empty-state">没有找到匹配的影片，试试换一个关键词。</div>';
      return;
    }
    results.innerHTML = list.slice(0, 240).map(renderPosterCard).join('');
  }

  input?.addEventListener('input', render);
  categoryButtons.forEach(btn => btn.addEventListener('click', () => {
    categoryButtons.forEach(item => item.classList.remove('btn'));
    categoryButtons.forEach(item => item.classList.add('btn-soft'));
    btn.classList.remove('btn-soft');
    btn.classList.add('btn');
    activeCategory = btn.dataset.filterCategory || 'all';
    render();
  }));
  render();
}

function initSimpleFilters() {
  qsa('[data-filter-input]').forEach(input => {
    const scope = input.closest('[data-filter-scope]') || document;
    const items = qsa('[data-filter-item]', scope);
    input.addEventListener('input', () => {
      const query = normalizeText(input.value);
      items.forEach(item => {
        const text = normalizeText(item.getAttribute('data-filter-text') || item.textContent || '');
        item.classList.toggle('hidden', query && !text.includes(query));
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initHeroCarousel();
  initSearchPage();
  initSimpleFilters();
});
