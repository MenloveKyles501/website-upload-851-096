
(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function initNav() {
    const toggle = qs('[data-nav-toggle]');
    const nav = qs('[data-nav]');
    if (toggle && nav) {
      toggle.addEventListener('click', () => nav.classList.toggle('open'));
    }
  }

  function initHeroSearch() {
    const input = qs('[data-hero-search]');
    const button = qs('[data-hero-search-btn]');
    if (!input || !button) return;

    const go = () => {
      const q = encodeURIComponent(input.value.trim());
      window.location.href = q ? `search.html?q=${q}` : 'search.html';
    };

    button.addEventListener('click', go);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        go();
      }
    });
  }

  function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', '返回顶部');
    btn.textContent = '↑';
    document.body.appendChild(btn);

    const onScroll = () => {
      if (window.scrollY > 560) btn.classList.add('show');
      else btn.classList.remove('show');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function initHeroSlider() {
    const root = qs('[data-hero-slider]');
    if (!root) return;
    const track = qs('[data-hero-track]', root);
    const slides = qsa('[data-hero-slide]', root);
    const dotsWrap = qs('[data-hero-dots]', root);
    const prev = qs('[data-hero-prev]', root);
    const next = qs('[data-hero-next]', root);
    if (!track || !slides.length) return;

    let index = 0;
    let timer = null;
    let hover = false;

    if (dotsWrap) {
      dotsWrap.innerHTML = slides.map((_, i) => `<button class="hero-dot ${i === 0 ? 'active' : ''}" type="button" aria-label="切换到第 ${i + 1} 张"></button>`).join('');
    }
    const dots = dotsWrap ? qsa('.hero-dot', dotsWrap) : [];

    function render() {
      track.style.transform = `translateX(${-index * 100}%)`;
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }
    function go(step) {
      index = (index + step + slides.length) % slides.length;
      render();
    }
    function start() {
      stop();
      timer = setInterval(() => { if (!hover) go(1); }, 5000);
    }
    function stop() { if (timer) clearInterval(timer); }

    prev && prev.addEventListener('click', () => go(-1));
    next && next.addEventListener('click', () => go(1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => { index = i; render(); }));
    root.addEventListener('mouseenter', () => hover = true);
    root.addEventListener('mouseleave', () => hover = false);
    render();
    start();
  }

  function initSearchPage() {
    const input = qs('[data-search-input]');
    const select = qs('[data-search-select]');
    const results = qs('[data-search-results]');
    if (!input || !results || !window.MOVIES_DATA) return;

    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) input.value = q;
    } catch (e) {}

    const state = {
      keyword: input.value.trim(),
      type: select ? select.value : 'all',
    };

    function match(item) {
      const hay = [item.title, item.region, item.type, item.genre, item.tags, item.one_line, item.year].join(' ').toLowerCase();
      const kw = state.keyword.toLowerCase();
      const typeMatch = state.type === 'all' || item.type === state.type;
      return typeMatch && (!kw || hay.includes(kw));
    }

    function card(item) {
      return `
        <article class="movie-card">
          <a class="movie-poster" href="${item.url}" aria-label="${item.title}">
            <div class="poster-bg" style="background-image:url('${item.image}')"></div>
            <div class="poster-overlay"></div>
            <div class="poster-meta">
              <span>${item.year}</span>
              <span>${item.type}</span>
            </div>
          </a>
          <div class="movie-body">
            <div class="movie-kicker">${item.region} · ${item.genre}</div>
            <h3 class="movie-title"><a href="${item.url}">${item.title}</a></h3>
            <p class="movie-desc">${item.one_line}</p>
            <div class="movie-actions">
              <a class="btn btn-primary" href="${item.url}">查看详情</a>
              <a class="btn btn-ghost" href="${item.url}#player">在线播放</a>
            </div>
          </div>
        </article>`;
    }

    function render() {
      const filtered = window.MOVIES_DATA.filter(match);
      results.innerHTML = filtered.length
        ? filtered.map(card).join('')
        : `<div class="panel long-copy"><h2>没有找到匹配结果</h2><p>试试搜索影片名、类型、地区、标签或年份。</p></div>`;
      const count = qs('[data-search-count]');
      if (count) count.textContent = String(filtered.length);
    }

    input.addEventListener('input', () => { state.keyword = input.value.trim(); render(); });
    if (select) select.addEventListener('change', () => { state.type = select.value; render(); });
    render();
  }

  function initPlayer() {
    const stage = qs('[data-player]');
    if (!stage) return;
    const video = qs('video', stage);
    const btn = qs('[data-play-btn]', stage);
    const status = qs('[data-player-status]', stage);
    const source = stage.getAttribute('data-hls-src') || '';
    if (!video || !source) return;

    let hls = null;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function playSource() {
      if (window.Hls && window.Hls.isSupported()) {
        if (hls) hls.destroy();
        hls = new Hls();
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(() => {});
          setStatus('正在播放 HLS 线路');
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.play().catch(() => {});
        setStatus('正在播放原生 HLS 线路');
      } else {
        video.src = source;
        video.play().catch(() => {});
        setStatus('当前浏览器需要 HLS.js 支持，已尝试直接播放');
      }
    }

    btn && btn.addEventListener('click', playSource);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initHeroSearch();
    initBackToTop();
    initHeroSlider();
    initSearchPage();
    initPlayer();
  });
})();
