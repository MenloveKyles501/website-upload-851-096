
(function () {
  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const normalize = (value) => String(value || '').toLowerCase().replace(/\s+/g, '');

  function initNav() {
    const nav = q('[data-nav]');
    const toggle = q('[data-nav-toggle]');
    if (!nav || !toggle) return;
    toggle.addEventListener('click', () => {
      nav.classList.toggle('is-open');
    });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('is-open');
      }
    });
  }

  function initHeroCarousel() {
    const hero = q('[data-hero-carousel]');
    if (!hero) return;
    const slides = qa('[data-hero-slide]', hero);
    const dotsWrap = q('[data-hero-dots]', hero);
    const prev = q('[data-hero-prev]', hero);
    const next = q('[data-hero-next]', hero);
    if (!slides.length) return;

    let index = slides.findIndex((slide) => slide.classList.contains('is-active'));
    if (index < 0) index = 0;
    let timer = null;

    function renderDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = slides.map((_, i) => `<button class="hero-dot ${i === index ? 'is-active' : ''}" type="button" aria-label="切换到第 ${i + 1} 屏" data-hero-dot="${i}"></button>`).join('');
      qa('[data-hero-dot]', dotsWrap).forEach((btn) => {
        btn.addEventListener('click', () => {
          show(Number(btn.dataset.heroDot));
          restart();
        });
      });
    }

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      renderDots();
    }

    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(() => show(index + 1), 6000);
    }

    prev && prev.addEventListener('click', () => { show(index - 1); restart(); });
    next && next.addEventListener('click', () => { show(index + 1); restart(); });
    renderDots();
    restart();
  }

  function filterCards(scope) {
    const input = q('[data-search-input]', scope) || q('[data-search-input]');
    if (!input) return;
    const query = normalize(input.value);
    const cards = qa('[data-card]', scope);
    cards.forEach((card) => {
      const hay = normalize([card.dataset.title, card.dataset.keywords, card.textContent].join(' '));
      const visible = !query || hay.includes(query);
      card.classList.toggle('is-hidden', !visible);
    });
  }

  function initFilters() {
    qa('[data-search-input]').forEach((input) => {
      const scope = input.closest('section, main, body') || document;
      input.addEventListener('input', () => filterCards(scope));
      input.addEventListener('change', () => filterCards(scope));
    });
  }

  function buildMovieCard(movie) {
    const href = movie.link || `movie-${String(movie.id).padStart(4, '0')}.html`;
    const poster = movie.poster || movie.initials || '影';
    const tags = [movie.genre, movie.region, movie.year].filter(Boolean).map((t) => `<span class="chip chip-ghost">${escapeHtml(t)}</span>`).join('');
    return `
      <article class="movie-card" data-card data-title="${escapeHtml(movie.title)}" data-keywords="${escapeHtml([movie.title, movie.region, movie.genre, movie.type, movie.tags || ''].join(' '))}">
        <a class="movie-link" href="${href}">
          <div class="movie-poster" style="--c1:${movie.c1 || '#4a78ff'};--c2:${movie.c2 || '#1c3f91'};--c3:${movie.c3 || '#0d1728'};">
            <span class="movie-badge">${escapeHtml(movie.year || '')}</span>
            <span class="movie-initial">${escapeHtml(poster)}</span>
            <span class="movie-meta">${escapeHtml(movie.region || '')}</span>
          </div>
          <div class="movie-body">
            <div class="movie-topline">
              <h3>${escapeHtml(movie.title)}</h3>
              <span class="movie-score">热度 ${escapeHtml(movie.heat || '')}</span>
            </div>
            <p class="movie-desc">${escapeHtml(movie.one_line || '')}</p>
            <div class="movie-tags">${tags}</div>
          </div>
        </a>
      </article>
    `;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function initSearchPage() {
    const mount = q('[data-search-results]');
    if (!mount || !window.MOVIES_DATA) return;
    const input = q('[data-search-input]');
    const total = q('[data-search-total]');

    function render(list) {
      if (total) total.textContent = String(list.length);
      mount.innerHTML = list.map(buildMovieCard).join('');
      filterCards(mount.closest('section, main, body') || document);
    }

    const base = Array.isArray(window.MOVIES_DATA) ? [...window.MOVIES_DATA].sort((a, b) => (b.score || 0) - (a.score || 0)) : [];
    render(base.slice(0, 120));

    if (input) {
      const onInput = () => {
        const key = normalize(input.value);
        if (!key) {
          render(base.slice(0, 120));
          return;
        }
        const list = base.filter((movie) => {
          const hay = normalize([movie.title, movie.region, movie.genre, movie.type, movie.tags, movie.one_line].join(' '));
          return hay.includes(key);
        });
        render(list);
      };
      input.addEventListener('input', onInput);
      input.addEventListener('change', onInput);
    }
  }

  function initPlayers() {
    qa('[data-player]').forEach((wrapper) => {
      const video = q('video', wrapper);
      const overlay = q('[data-player-overlay]', wrapper);
      const playBtn = q('[data-player-play]', wrapper);
      const primary = wrapper.dataset.m3u8;
      const fallback = wrapper.dataset.fallback || '';
      const title = wrapper.dataset.title || '';
      let hlsInstance = null;
      let activePrimary = false;
      let loadedScript = null;

      const showOverlay = () => overlay && overlay.classList.remove('is-hidden');
      const hideOverlay = () => overlay && overlay.classList.add('is-hidden');

      function attachHls(src) {
        if (!window.Hls || !window.Hls.isSupported()) return false;
        if (hlsInstance) {
          hlsInstance.destroy();
          hlsInstance = null;
        }
        hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: false });
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.ERROR, (_, data) => {
          if (data && data.fatal) {
            useFallback();
          }
        });
        return true;
      }

      function loadHlsScript() {
        if (window.Hls) return Promise.resolve(true);
        if (loadedScript) return loadedScript;
        loadedScript = new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';
          script.async = true;
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.head.appendChild(script);
        });
        return loadedScript;
      }

      function useFallback() {
        if (!fallback) return;
        if (hlsInstance) {
          hlsInstance.destroy();
          hlsInstance = null;
        }
        video.src = fallback;
        video.load();
      }

      async function startPlayback() {
        hideOverlay();
        video.setAttribute('controls', 'controls');
        activePrimary = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = primary;
        } else if (window.Hls && window.Hls.isSupported()) {
          attachHls(primary);
        } else {
          const loaded = await loadHlsScript();
          if (loaded && window.Hls && window.Hls.isSupported()) {
            attachHls(primary);
          } else {
            useFallback();
          }
        }
        try {
          await video.play();
        } catch (err) {
          if (fallback && activePrimary) {
            useFallback();
            try { await video.play(); } catch (e) {}
          }
        }
      }

      playBtn && playBtn.addEventListener('click', startPlayback);
      overlay && overlay.addEventListener('click', startPlayback);
      video.addEventListener('play', hideOverlay);
      video.addEventListener('error', () => {
        if (activePrimary) {
          useFallback();
          video.play().catch(() => {});
        }
      });
      video.addEventListener('pause', () => {
        if (video.currentTime === 0) showOverlay();
      });
      if (title) video.setAttribute('aria-label', title);
    });
  }

  function initBackToTop() {
    const btn = q('[data-back-top]');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('is-visible', window.scrollY > 500);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initHeroCarousel();
    initFilters();
    initSearchPage();
    initPlayers();
    initBackToTop();
  });
})();
