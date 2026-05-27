(function () {
  var ready = function (fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  };

  ready(function () {
    var menuButton = document.querySelector("[data-menu-toggle]");
    var mobilePanel = document.querySelector("[data-mobile-panel]");

    if (menuButton && mobilePanel) {
      menuButton.addEventListener("click", function () {
        mobilePanel.classList.toggle("is-open");
      });
    }

    document.querySelectorAll("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[name='q']");
        var query = input ? input.value.trim() : "";
        var url = "./all.html";

        if (query) {
          url += "?q=" + encodeURIComponent(query);
        }

        window.location.href = url;
      });
    });

    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var currentSlide = 0;
    var heroTimer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }

      currentSlide = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === currentSlide);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === currentSlide);
      });
    }

    function startHero() {
      if (slides.length < 2) {
        return;
      }

      heroTimer = window.setInterval(function () {
        showSlide(currentSlide + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var next = Number(dot.getAttribute("data-hero-dot") || 0);
        showSlide(next);

        if (heroTimer) {
          window.clearInterval(heroTimer);
          startHero();
        }
      });
    });

    showSlide(0);
    startHero();

    var searchInput = document.querySelector("[data-card-search]");
    var categorySelect = document.querySelector("[data-card-category]");
    var yearSelect = document.querySelector("[data-card-year]");
    var cardList = document.querySelector("[data-card-list]");
    var emptyState = document.querySelector("[data-empty-state]");

    if (cardList) {
      var cards = Array.prototype.slice.call(cardList.querySelectorAll("[data-movie-card]"));
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get("q") || "";

      if (searchInput && initialQuery) {
        searchInput.value = initialQuery;
      }

      function normalize(value) {
        return String(value || "").toLowerCase();
      }

      function applyFilters() {
        var query = normalize(searchInput ? searchInput.value.trim() : "");
        var category = categorySelect ? categorySelect.value : "";
        var year = yearSelect ? yearSelect.value : "";
        var visible = 0;

        cards.forEach(function (card) {
          var text = normalize([
            card.getAttribute("data-title"),
            card.getAttribute("data-genre"),
            card.getAttribute("data-tags"),
            card.getAttribute("data-region"),
            card.getAttribute("data-year")
          ].join(" "));
          var matchesQuery = !query || text.indexOf(query) !== -1;
          var matchesCategory = !category || card.getAttribute("data-category") === category;
          var matchesYear = !year || card.getAttribute("data-year") === year;
          var isVisible = matchesQuery && matchesCategory && matchesYear;

          card.style.display = isVisible ? "" : "none";

          if (isVisible) {
            visible += 1;
          }
        });

        if (emptyState) {
          emptyState.classList.toggle("is-visible", visible === 0);
        }
      }

      [searchInput, categorySelect, yearSelect].forEach(function (control) {
        if (control) {
          control.addEventListener("input", applyFilters);
          control.addEventListener("change", applyFilters);
        }
      });

      applyFilters();
    }

    var video = document.getElementById("movie-player");
    var playButton = document.getElementById("play-button");

    if (video && playButton) {
      var hlsInstance = null;
      var isPrepared = false;

      function streamUrl() {
        return playButton.getAttribute("data-stream") || video.getAttribute("data-stream") || "";
      }

      function prepareVideo(autoplay) {
        var src = streamUrl();

        if (!src) {
          return;
        }

        if (isPrepared) {
          if (autoplay) {
            video.play().catch(function () {});
          }
          return;
        }

        isPrepared = true;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          if (autoplay) {
            video.play().catch(function () {});
          }
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls();
          hlsInstance.loadSource(src);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            if (autoplay) {
              video.play().catch(function () {});
            }
          });
          return;
        }

        video.src = src;
        if (autoplay) {
          video.play().catch(function () {});
        }
      }

      function startPlayback() {
        playButton.classList.add("is-hidden");
        prepareVideo(true);
      }

      playButton.addEventListener("click", startPlayback);
      video.addEventListener("click", function () {
        if (video.paused) {
          startPlayback();
        }
      });
      video.addEventListener("play", function () {
        playButton.classList.add("is-hidden");
      });
    }
  });
})();
