(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function text(value) {
        return String(value || '').toLowerCase();
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function initMobileMenu() {
        var toggle = document.querySelector('[data-menu-toggle]');
        var panel = document.querySelector('[data-mobile-panel]');
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener('click', function () {
            panel.classList.toggle('is-open');
        });
    }

    function initHero() {
        var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
        if (!slides.length) {
            return;
        }
        var active = 0;
        var timer = null;

        function show(index) {
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === active);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === active);
            });
        }

        function start() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(active + 1);
            }, 5200);
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
                start();
            });
        });
        show(0);
        start();
    }

    function initFilters() {
        var sections = Array.prototype.slice.call(document.querySelectorAll('.content-section'));
        sections.forEach(function (section) {
            var input = section.querySelector('[data-filter-input]');
            var typeSelect = section.querySelector('[data-filter-select="type"]');
            var yearSelect = section.querySelector('[data-filter-select="year"]');
            var reset = section.querySelector('[data-filter-reset]');
            var cards = Array.prototype.slice.call(section.querySelectorAll('[data-card]'));
            var count = section.querySelector('[data-filter-count]');
            if (!cards.length || (!input && !typeSelect && !yearSelect)) {
                return;
            }

            function apply() {
                var keyword = text(input ? input.value : '');
                var typeValue = typeSelect ? typeSelect.value : '';
                var yearValue = yearSelect ? yearSelect.value : '';
                var visible = 0;
                cards.forEach(function (card) {
                    var haystack = text(card.getAttribute('data-filter'));
                    var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                    var matchesType = !typeValue || card.getAttribute('data-type') === typeValue;
                    var matchesYear = !yearValue || card.getAttribute('data-year') === yearValue;
                    var keep = matchesKeyword && matchesType && matchesYear;
                    card.classList.toggle('is-hidden-card', !keep);
                    if (keep) {
                        visible += 1;
                    }
                });
                if (count) {
                    count.textContent = '当前显示 ' + visible + ' 部影片';
                }
            }

            if (input) {
                input.addEventListener('input', apply);
            }
            if (typeSelect) {
                typeSelect.addEventListener('change', apply);
            }
            if (yearSelect) {
                yearSelect.addEventListener('change', apply);
            }
            if (reset) {
                reset.addEventListener('click', function () {
                    if (input) {
                        input.value = '';
                    }
                    if (typeSelect) {
                        typeSelect.value = '';
                    }
                    if (yearSelect) {
                        yearSelect.value = '';
                    }
                    apply();
                });
            }
            apply();
        });
    }

    function initSearchPage() {
        var results = document.querySelector('[data-search-results]');
        var status = document.querySelector('[data-search-status]');
        var input = document.querySelector('[data-search-page-input]');
        if (!results || !window.SEARCH_MOVIES) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var query = params.get('q') || '';
        if (input) {
            input.value = query;
        }

        function card(movie) {
            var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
                return '<span>' + escapeHtml(tag) + '</span>';
            }).join('');
            return '' +
                '<a class="movie-card" href="' + escapeHtml(movie.url) + '">' +
                    '<figure>' +
                        '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
                        '<figcaption>' + escapeHtml(movie.type) + '</figcaption>' +
                    '</figure>' +
                    '<div class="card-body">' +
                        '<h3>' + escapeHtml(movie.title) + '</h3>' +
                        '<p>' + escapeHtml(movie.oneLine) + '</p>' +
                        '<div class="meta-row">' +
                            '<span>' + escapeHtml(movie.year) + '</span>' +
                            '<span>' + escapeHtml(movie.region) + '</span>' +
                        '</div>' +
                        '<div class="tag-row">' + tags + '</div>' +
                    '</div>' +
                '</a>';
        }

        function render(value) {
            var q = text(value).trim();
            var source = window.SEARCH_MOVIES;
            var matched = !q ? source.slice(0, 96) : source.filter(function (movie) {
                return text([
                    movie.title,
                    movie.region,
                    movie.type,
                    movie.year,
                    movie.genre,
                    movie.category,
                    (movie.tags || []).join(' '),
                    movie.oneLine
                ].join(' ')).indexOf(q) !== -1;
            });
            results.innerHTML = matched.map(card).join('');
            if (status) {
                status.textContent = q ? ('找到 ' + matched.length + ' 部相关影片') : '显示部分精选影片，可输入关键词继续搜索';
            }
        }

        if (input) {
            input.addEventListener('input', function () {
                render(input.value);
            });
        }
        render(query);
    }

    function initPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
        players.forEach(function (shell) {
            var video = shell.querySelector('video[data-video-src]');
            var start = shell.querySelector('[data-player-start]');
            var toggle = shell.querySelector('[data-player-toggle]');
            var mute = shell.querySelector('[data-player-mute]');
            var fullscreen = shell.querySelector('[data-player-fullscreen]');
            var loading = shell.querySelector('[data-player-loading]');
            var errorBox = shell.querySelector('[data-player-error]');
            if (!video) {
                return;
            }
            var src = video.getAttribute('data-video-src');
            var hls = null;

            function setLoading(show) {
                if (loading) {
                    loading.classList.toggle('is-hidden', !show);
                }
            }

            function setError(message) {
                if (errorBox) {
                    errorBox.textContent = message || '';
                }
            }

            function attachSource() {
                setLoading(true);
                setError('');
                if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(src);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        setLoading(false);
                    });
                    hls.on(window.Hls.Events.ERROR, function (event, data) {
                        if (!data || !data.fatal) {
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            setError('网络连接异常，正在重新加载播放源。');
                            hls.startLoad();
                        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            setError('媒体解码异常，正在尝试恢复。');
                            hls.recoverMediaError();
                        } else {
                            setError('当前浏览器无法播放此视频源。');
                            hls.destroy();
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = src;
                    video.addEventListener('loadedmetadata', function () {
                        setLoading(false);
                    }, { once: true });
                } else {
                    setLoading(false);
                    setError('当前浏览器不支持 HLS 播放，请更换浏览器或启用 HLS 支持。');
                }
            }

            function playOrPause() {
                if (video.paused) {
                    var promise = video.play();
                    if (promise && typeof promise.catch === 'function') {
                        promise.catch(function () {
                            setError('浏览器阻止了自动播放，请再次点击播放按钮。');
                        });
                    }
                } else {
                    video.pause();
                }
            }

            video.addEventListener('play', function () {
                shell.classList.add('is-playing');
            });
            video.addEventListener('pause', function () {
                shell.classList.remove('is-playing');
            });
            video.addEventListener('click', playOrPause);
            video.addEventListener('error', function () {
                setError('播放源加载失败，请检查网络或稍后重试。');
                setLoading(false);
            });

            if (start) {
                start.addEventListener('click', playOrPause);
            }
            if (toggle) {
                toggle.addEventListener('click', playOrPause);
            }
            if (mute) {
                mute.addEventListener('click', function () {
                    video.muted = !video.muted;
                    mute.textContent = video.muted ? '取消静音' : '静音';
                });
            }
            if (fullscreen) {
                fullscreen.addEventListener('click', function () {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else if (shell.requestFullscreen) {
                        shell.requestFullscreen();
                    }
                });
            }

            attachSource();
            window.addEventListener('beforeunload', function () {
                if (hls) {
                    hls.destroy();
                }
            });
        });
    }

    ready(function () {
        initMobileMenu();
        initHero();
        initFilters();
        initSearchPage();
        initPlayers();
    });
}());
