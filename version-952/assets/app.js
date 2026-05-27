(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normal(value) {
    return String(value || "").trim().toLowerCase();
  }

  function applyFilter(input) {
    var query = normal(input.value);
    var scope = input.closest("main") || document;
    var cards = scope.querySelectorAll("[data-search]");
    var shown = 0;

    cards.forEach(function (card) {
      var text = normal(card.getAttribute("data-search"));
      var match = !query || text.indexOf(query) !== -1;
      card.classList.toggle("is-filter-hidden", !match);
      if (match) {
        shown += 1;
      }
    });

    var empty = scope.querySelector("[data-empty-state]");
    if (empty) {
      empty.classList.toggle("is-visible", shown === 0);
    }
  }

  ready(function () {
    var menuButton = document.querySelector("[data-menu-button]");
    var mobilePanel = document.querySelector("[data-mobile-panel]");

    if (menuButton && mobilePanel) {
      menuButton.addEventListener("click", function () {
        mobilePanel.classList.toggle("is-open");
      });
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    var filterInputs = document.querySelectorAll("[data-filter-input]");

    filterInputs.forEach(function (input) {
      if (query) {
        input.value = query;
      }
      applyFilter(input);
      input.addEventListener("input", function () {
        applyFilter(input);
      });
    });

    var slides = document.querySelectorAll("[data-hero-slide]");
    var dots = document.querySelectorAll("[data-hero-target]");
    var active = 0;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === active);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === active);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        showSlide(Number(dot.getAttribute("data-hero-target")) || 0);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(active + 1);
      }, 5200);
    }
  });

  window.initMoviePlayer = function (videoId, buttonId, streamUrl) {
    var video = document.getElementById(videoId);
    var button = document.getElementById(buttonId);
    var attached = false;
    var hlsInstance = null;

    if (!video || !streamUrl) {
      return;
    }

    function hideButton() {
      if (button) {
        button.classList.add("is-hidden");
      }
    }

    function attachStream() {
      if (attached) {
        return Promise.resolve();
      }

      attached = true;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
        return Promise.resolve();
      }

      if (window.Hls && window.Hls.isSupported()) {
        return new Promise(function (resolve) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            resolve();
          });
          window.setTimeout(resolve, 1200);
        });
      }

      video.src = streamUrl;
      return Promise.resolve();
    }

    function start() {
      attachStream().then(function () {
        hideButton();
        var playing = video.play();
        if (playing && typeof playing.catch === "function") {
          playing.catch(function () {});
        }
      });
    }

    if (button) {
      button.addEventListener("click", start);
    }

    video.addEventListener("click", function () {
      if (!attached || video.paused) {
        start();
      }
    });

    video.addEventListener("play", hideButton);

    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };
})();
