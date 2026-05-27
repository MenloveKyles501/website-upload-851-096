(function(){
  function hashString(str){
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  const gradientSets = [
    ['#f59e0b', '#fb923c'],
    ['#7c3aed', '#ec4899'],
    ['#0ea5e9', '#14b8a6'],
    ['#ef4444', '#f97316'],
    ['#22c55e', '#84cc16'],
    ['#6366f1', '#8b5cf6'],
  ];

  function posterDataUri(title, year, region){
    const idx = hashString(String(title || '') + String(region || '')) % gradientSets.length;
    const g = gradientSets[idx];
    const safeTitle = String(title || '亚洲电影').replace(/[&<>]/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;'})[ch]; });
    const safeRegion = String(region || '').replace(/[&<>]/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;'})[ch]; });
    const safeYear = String(year || '');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="${g[0]}"/>
            <stop offset="100%" stop-color="${g[1]}"/>
          </linearGradient>
          <filter id="b"><feGaussianBlur stdDeviation="18"/></filter>
        </defs>
        <rect width="800" height="1200" rx="44" fill="#111"/>
        <rect x="0" y="0" width="800" height="1200" rx="44" fill="url(#g)"/>
        <circle cx="640" cy="120" r="180" fill="rgba(255,255,255,.18)" filter="url(#b)"/>
        <circle cx="120" cy="1040" r="230" fill="rgba(0,0,0,.22)" filter="url(#b)"/>
        <rect x="56" y="64" width="688" height="1072" rx="34" fill="rgba(0,0,0,.20)" stroke="rgba(255,255,255,.16)"/>
        <text x="90" y="145" fill="rgba(255,255,255,.92)" font-size="32" font-family="Arial, Helvetica, sans-serif" font-weight="700">${safeYear} · ${safeRegion}</text>
        <text x="90" y="610" fill="#fff" font-size="54" font-family="Arial, Helvetica, sans-serif" font-weight="800">
          <tspan x="90" dy="0">${safeTitle.slice(0,18)}</tspan>
          <tspan x="90" dy="78">${safeTitle.slice(18,36)}</tspan>
          <tspan x="90" dy="78">${safeTitle.slice(36,54)}</tspan>
        </text>
        <rect x="90" y="860" width="190" height="56" rx="28" fill="rgba(255,255,255,.18)"/>
        <text x="185" y="898" fill="#fff" text-anchor="middle" font-size="26" font-family="Arial, Helvetica, sans-serif" font-weight="700">静态电影站</text>
      </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function applyPosterFallback(img){
    if (!img || img.dataset.posterBound) return;
    img.dataset.posterBound = '1';
    const fallback = function(){
      if (img.dataset.posterFallbackDone) return;
      img.dataset.posterFallbackDone = '1';
      img.src = posterDataUri(img.dataset.title || img.alt || '亚洲电影', img.dataset.year || '', img.dataset.region || '');
    };
    img.addEventListener('error', fallback, { once:true });
    // If the browser already failed before this handler attached, the element may report zero naturalWidth.
    if (img.complete && !img.naturalWidth) fallback();
  }

  function initPosters(root){
    (root || document).querySelectorAll('img[data-poster]').forEach(applyPosterFallback);
  }

  function initHero(){
    const hero = document.querySelector('[data-hero-carousel]');
    if (!hero) return;
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    if (slides.length < 2) return;
    let index = 0;
    let timer = null;

    const setActive = function(i){
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, idx) => slide.classList.toggle('is-active', idx === index));
      dots.forEach((dot, idx) => dot.classList.toggle('is-active', idx === index));
    };

    const start = function(){
      stop();
      timer = setInterval(function(){ setActive(index + 1); }, 5200);
    };

    const stop = function(){
      if (timer) clearInterval(timer);
      timer = null;
    };

    dots.forEach((dot, idx) => dot.addEventListener('click', function(){ setActive(idx); start(); }));
    if (prev) prev.addEventListener('click', function(){ setActive(index - 1); start(); });
    if (next) next.addEventListener('click', function(){ setActive(index + 1); start(); });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    setActive(0);
    start();
  }

  function initLibraryFilters(){
    const form = document.querySelector('[data-library-filters]');
    const grid = document.querySelector('[data-library-grid]');
    if (!form || !grid) return;

    const cards = Array.from(grid.querySelectorAll('[data-library-card]'));
    const count = document.querySelector('[data-filter-count]');
    const queryInput = form.querySelector('[name="q"]');
    const regionSelect = form.querySelector('[name="region"]');
    const typeSelect = form.querySelector('[name="type"]');
    const yearSelect = form.querySelector('[name="year"]');
    const bucketSelect = form.querySelector('[name="bucket"]');

    const params = new URLSearchParams(window.location.search);
    if (queryInput && !queryInput.value) queryInput.value = params.get('q') || '';
    if (regionSelect && !regionSelect.value) regionSelect.value = params.get('region') || '';
    if (typeSelect && !typeSelect.value) typeSelect.value = params.get('type') || '';
    if (yearSelect && !yearSelect.value) yearSelect.value = params.get('year') || '';
    if (bucketSelect && !bucketSelect.value) bucketSelect.value = params.get('bucket') || '';

    function matches(card){
      const q = String(queryInput?.value || '').trim().toLowerCase();
      const region = String(regionSelect?.value || '').trim();
      const type = String(typeSelect?.value || '').trim();
      const year = String(yearSelect?.value || '').trim();
      const bucket = String(bucketSelect?.value || '').trim();

      const hay = [
        card.dataset.title || '',
        card.dataset.region || '',
        card.dataset.type || '',
        card.dataset.year || '',
        card.dataset.genre || '',
        card.dataset.tags || ''
      ].join(' ').toLowerCase();

      if (q && !hay.includes(q)) return false;
      if (region && card.dataset.region !== region) return false;
      if (type && card.dataset.type !== type) return false;
      if (year && card.dataset.year !== year) return false;
      if (bucket && card.dataset.bucket !== bucket) return false;
      return true;
    }

    function apply(){
      let visible = 0;
      cards.forEach(card => {
        const ok = matches(card);
        card.classList.toggle('hidden', !ok);
        if (ok) visible += 1;
      });
      if (count) count.textContent = visible + ' / ' + cards.length + ' 部可见';
      initPosters(grid);
    }

    form.addEventListener('input', apply);
    form.addEventListener('change', apply);
    const reset = form.querySelector('[data-reset-filters]');
    if (reset) reset.addEventListener('click', function(){
      form.reset();
      if (queryInput) queryInput.value = '';
      apply();
    });
    apply();
  }

  function initCopyButtons(){
    document.addEventListener('click', function(e){
      const btn = e.target.closest('[data-copy-text]');
      if (!btn) return;
      const text = btn.getAttribute('data-copy-text') || '';
      if (!text) return;
      navigator.clipboard?.writeText(text).then(function(){
        btn.textContent = '已复制';
        setTimeout(function(){ btn.textContent = '复制播放地址'; }, 1400);
      }).catch(function(){});
    });
  }

  function initPlayers(){
    document.querySelectorAll('video[data-hls-src]').forEach(function(video){
      const src = video.dataset.hlsSrc;
      const cover = video.dataset.cover || '';
      const title = video.dataset.title || video.getAttribute('title') || '影片';
      const region = video.dataset.region || '';
      const year = video.dataset.year || '';
      const shell = video.closest('.player-shell');
      const overlay = shell?.querySelector('[data-play-toggle]');

      if (cover) {
        const probe = new Image();
        probe.onload = function(){ video.poster = cover; };
        probe.onerror = function(){ video.poster = posterDataUri(title, year, region); };
        probe.src = cover;
      } else {
        video.poster = posterDataUri(title, year, region);
      }

      function setupHls(){
        if (window.Hls && window.Hls.isSupported()) {
          const hls = new window.Hls({ enableWorker:true, lowLatencyMode:true });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.ERROR, function(evt, data){
            if (data && data.fatal) {
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                try { hls.startLoad(); } catch(e){}
              } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                try { hls.recoverMediaError(); } catch(e){}
              }
            }
          });
          return;
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          return;
        }
        // Fallback: still set src and let browser decide
        video.src = src;
      }

      setupHls();

      if (overlay) overlay.addEventListener('click', function(){ video.play().catch(function(){}); });
      video.addEventListener('play', function(){ shell?.classList.add('is-playing'); });
      video.addEventListener('pause', function(){ shell?.classList.remove('is-playing'); });
      video.addEventListener('ended', function(){ shell?.classList.remove('is-playing'); });
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    initPosters(document);
    initHero();
    initLibraryFilters();
    initCopyButtons();
    initPlayers();
  });
})();