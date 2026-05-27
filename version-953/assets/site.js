
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setText(el, text) {
    if (el) el.textContent = text;
  }

  function hashColor(text) {
    let h = 0;
    for (let i = 0; i < text.length; i++) {
      h = (h * 31 + text.charCodeAt(i)) >>> 0;
    }
    const hue = h % 360;
    return {
      bg: `linear-gradient(160deg, hsla(${hue}, 72%, 38%, .9), hsla(${(hue + 45) % 360}, 72%, 24%, .95))`,
      glow: `radial-gradient(circle at 22% 18%, hsla(${(hue + 20) % 360}, 100%, 84%, .26), transparent 28%), radial-gradient(circle at 80% 22%, hsla(${(hue + 160) % 360}, 100%, 72%, .18), transparent 24%)`
    };
  }

  function renderPoster(el, movie, compact = false) {
    if (!el || !movie) return;
    const c = hashColor(movie.title + movie.id);
    el.style.background = `${c.glow}, ${c.bg}`;
    const year = movie.year || '';
    const label = movie.type ? `${movie.type} · ${movie.region || ''}`.replace(/\s+·\s+$/, '') : (movie.region || '');
    el.innerHTML = `
      <div class="poster-badge">${escapeHtml(year)}</div>
      <div class="poster-title">${compact ? '<span>精选</span>' : ''}${escapeHtml(movie.title)}<div style="font-size:12px;font-weight:600;opacity:.75;margin-top:10px;line-height:1.5">${escapeHtml(label)}</div></div>
    `;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function initHeroSlider() {
    const root = $('[data-hero-slider]');
    if (!root || !window.__HOME_FEATURES__) return;
    const items = window.__HOME_FEATURES__;
    const art = $('[data-hero-art]', root);
    const title = $('[data-hero-title]', root);
    const desc = $('[data-hero-desc]', root);
    const chips = $$('.slider-dots button', root);
    let active = 0;

    function paint(i) {
      const movie = items[i % items.length];
      if (art) {
        const c = hashColor(movie.title);
        art.style.background = `${c.glow}, ${c.bg}`;
      }
      setText(title, movie.title);
      setText(desc, movie.one_line || movie.summary || '');
      chips.forEach((b, idx) => b.classList.toggle('active', idx === i));
      root.querySelectorAll('[data-hero-meta]').forEach((node) => {
        const field = node.getAttribute('data-hero-meta');
        node.textContent = movie[field] || '';
      });
      root.setAttribute('data-current-id', movie.id);
    }

    chips.forEach((btn, idx) => btn.addEventListener('click', () => {
      active = idx;
      paint(active);
    }));
    paint(active);
    window.setInterval(() => {
      active = (active + 1) % items.length;
      paint(active);
    }, 5500);
  }

  function initPlayer() {
    const player = $('[data-player]');
    if (!player) return;
    const video = $('[data-player-video]', player);
    const overlay = $('[data-player-overlay]', player);
    const playBtn = $('[data-player-play]', player);
    const sourceButtons = $$('[data-source-src]', player);
    const sources = sourceButtons.map(btn => btn.getAttribute('data-source-src')).filter(Boolean);
    if (!video || !sources.length) return;

    let current = 0;
    let hlsInstance = null;

    function destroyHls() {
      if (hlsInstance && typeof hlsInstance.destroy === 'function') {
        hlsInstance.destroy();
      }
      hlsInstance = null;
    }

    function loadSource(url) {
      destroyHls();
      overlay && overlay.classList.remove('hidden');
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          overlay && overlay.classList.remove('hidden');
        });
        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          if (!data || !data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hlsInstance.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hlsInstance.recoverMediaError();
          } else {
            destroyHls();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else {
        video.src = url;
      }
    }

    function selectSource(idx) {
      current = idx;
      sourceButtons.forEach((btn, i) => btn.classList.toggle('active', i === idx));
      loadSource(sources[current]);
    }

    sourceButtons.forEach((btn, idx) => {
      btn.addEventListener('click', () => selectSource(idx));
    });

    playBtn && playBtn.addEventListener('click', async () => {
      try {
        overlay && overlay.classList.add('hidden');
        await video.play();
      } catch (err) {
        console.warn(err);
      }
    });

    video.addEventListener('click', async () => {
      if (video.paused) {
        try {
          overlay && overlay.classList.add('hidden');
          await video.play();
        } catch (err) {
          console.warn(err);
        }
      }
    });
    video.addEventListener('pause', () => overlay && overlay.classList.remove('hidden'));
    video.addEventListener('play', () => overlay && overlay.classList.add('hidden'));
    selectSource(0);
  }

  function initSearch() {
    const app = $('[data-search-app]');
    if (!app || !window.MOVIE_INDEX) return;
    const params = new URLSearchParams(location.search);
    const input = $('[data-search-input]', app);
    const select = $('[data-search-sort]', app);
    const results = $('[data-search-results]', app);
    const counter = $('[data-search-count]', app);
    const query = (params.get('q') || '').trim();
    if (input) input.value = query;

    function render(list) {
      if (!results) return;
      if (!list.length) {
        results.innerHTML = `
          <div class="panel center" style="grid-column:1/-1">
            <h3>没有找到匹配影片</h3>
            <p>请尝试其他关键词，或使用地区、类型、年份进行筛选。</p>
          </div>`;
      } else {
        results.innerHTML = list.map(movie => movieCard(movie, '../')).join('');
      }
      if (counter) counter.textContent = `${list.length} 条结果`;
      $$("[data-poster]", results).forEach((el) => {
        const movieId = el.getAttribute('data-id');
        const movie = list.find(x => x.id === movieId);
        if (movie) renderPoster(el, movie, true);
      });
    }

    function apply() {
      const q = (input?.value || '').trim().toLowerCase();
      const sort = select?.value || 'relevance';
      let list = window.MOVIE_INDEX.filter(movie => {
        const bag = [movie.title, movie.region, movie.type, movie.genre, movie.one_line, movie.summary, movie.tags.join(' ')].join(' ').toLowerCase();
        return !q || bag.includes(q);
      });
      if (sort === 'year-desc') {
        list.sort((a, b) => (b.year || 0) - (a.year || 0));
      } else if (sort === 'year-asc') {
        list.sort((a, b) => (a.year || 0) - (b.year || 0));
      } else {
        list.sort((a, b) => {
          const scoreA = relevanceScore(a, q);
          const scoreB = relevanceScore(b, q);
          return scoreB - scoreA;
        });
      }
      render(list.slice(0, 200));
      const url = new URL(location.href);
      if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
      history.replaceState({}, '', url);
    }

    input && input.addEventListener('input', apply);
    select && select.addEventListener('change', apply);
    apply();
  }

  function relevanceScore(movie, q) {
    const text = [movie.title, movie.genre, movie.region, movie.type, movie.one_line, movie.summary].join(' ').toLowerCase();
    if (!q) return movie.year || 0;
    let score = 0;
    if (movie.title.toLowerCase().includes(q)) score += 1000;
    if ((movie.genre || '').toLowerCase().includes(q)) score += 300;
    if ((movie.region || '').toLowerCase().includes(q)) score += 150;
    if ((movie.type || '').toLowerCase().includes(q)) score += 120;
    if ((movie.one_line || '').toLowerCase().includes(q)) score += 90;
    if ((movie.summary || '').toLowerCase().includes(q)) score += 40;
    if ((movie.tags || []).join(' ').toLowerCase().includes(q)) score += 80;
    score += Math.max(0, 60 - Math.abs((movie.year || 0) - 2026));
    return score;
  }

  function initBrowse() {
    const root = $('[data-browse-page]');
    if (!root) return;
    const buttons = $$('.filter-bar button', root);
    const cards = $$('.movie-item', root);
    const search = $('[data-browse-search]', root);
    const sort = $('[data-browse-sort]', root);
    const info = $('[data-browse-info]', root);

    function apply() {
      const active = buttons.find(btn => btn.classList.contains('active'))?.dataset.filter || 'all';
      const q = (search?.value || '').trim().toLowerCase();
      const mode = sort?.value || 'year-desc';
      const visible = [];
      cards.forEach(card => {
        const bag = card.dataset.bag || '';
        const okType = active === 'all' || bag.includes(`|type:${active}|`)
          || bag.includes(`|region:${active}|`)
          || bag.includes(`|year:${active}|`);
        const okQuery = !q || bag.toLowerCase().includes(q);
        const show = okType && okQuery;
        card.classList.toggle('hidden', !show);
        if (show) visible.push(card);
      });
      if (mode === 'year-asc') {
        visible.sort((a, b) => +a.dataset.year - +b.dataset.year);
      } else if (mode === 'year-desc') {
        visible.sort((a, b) => +b.dataset.year - +a.dataset.year);
      }
      if (info) info.textContent = `${visible.length} 条`; 
    }
    buttons.forEach(btn => btn.addEventListener('click', () => {
      buttons.forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      apply();
    }));
    search && search.addEventListener('input', apply);
    sort && sort.addEventListener('change', apply);
    apply();
  }

  function movieCard(movie, root = './') {
    const posterId = `poster-${movie.id}`;
    const desc = movie.one_line || movie.summary || '';
    const tags = (movie.tags || []).slice(0, 3).map(t => `<span class="small-chip">${escapeHtml(t)}</span>`).join('');
    return `
      <a class="card movie-item" data-id="${movie.id}" href="${root}movies/${movie.id}.html" data-year="${movie.year || 0}" data-bag="|type:${escapeHtml(movie.type || '')}|region:${escapeHtml(movie.region || '')}|year:${escapeHtml(movie.year || '')}|genre:${escapeHtml(movie.genre || '')}|">
        <div class="poster" data-poster data-id="${movie.id}" id="${posterId}"></div>
        <div class="card-body">
          <h3>${escapeHtml(movie.title)}</h3>
          <p>${escapeHtml(desc)}</p>
          <div class="chips">${tags}</div>
        </div>
      </a>
    `;
  }

  window.movieCard = movieCard;
  window.renderPoster = renderPoster;
  window.escapeHtml = escapeHtml;

  document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
    initPlayer();
    initSearch();
    initBrowse();
    // Paint posters on any initial cards already present
    $$("[data-poster]").forEach(el => {
      const id = el.getAttribute('data-id');
      const movie = (window.__POSTER_MAP__ && window.__POSTER_MAP__[id]) || (window.MOVIE_INDEX && window.MOVIE_INDEX.find(m => m.id === id));
      if (movie) renderPoster(el, movie, !!el.closest('.card'));
    });
  });
})();
