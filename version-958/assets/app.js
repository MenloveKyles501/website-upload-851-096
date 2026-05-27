(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  ready(function () {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (toggle && panel) {
      toggle.addEventListener("click", function () {
        panel.classList.toggle("is-open");
      });
    }

    var hero = document.querySelector("[data-hero]");
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
      var current = 0;
      var timer = null;

      function show(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle("is-active", i === current);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle("is-active", i === current);
        });
      }

      function start() {
        clearInterval(timer);
        timer = setInterval(function () {
          show(current + 1);
        }, 5200);
      }

      dots.forEach(function (dot, i) {
        dot.addEventListener("click", function () {
          show(i);
          start();
        });
      });
      start();
    }

    var list = document.querySelector(".movie-list");
    var search = document.getElementById("movieSearch");
    var typeFilter = document.getElementById("typeFilter");
    var yearFilter = document.getElementById("yearFilter");
    if (list && (search || typeFilter || yearFilter)) {
      var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card"));
      var params = new URLSearchParams(window.location.search);
      if (search && params.get("q")) {
        search.value = params.get("q");
      }

      function applyFilters() {
        var q = search ? search.value.trim().toLowerCase() : "";
        var typeValue = typeFilter ? typeFilter.value : "";
        var yearValue = yearFilter ? yearFilter.value : "";
        cards.forEach(function (card) {
          var haystack = [
            card.dataset.title,
            card.dataset.region,
            card.dataset.type,
            card.dataset.year,
            card.dataset.genre,
            card.dataset.tags
          ].join(" ").toLowerCase();
          var typeOk = !typeValue || card.dataset.type === typeValue;
          var yearOk = !yearValue || card.dataset.year === yearValue;
          var searchOk = !q || haystack.indexOf(q) !== -1;
          card.classList.toggle("is-filtered-out", !(typeOk && yearOk && searchOk));
        });
      }

      [search, typeFilter, yearFilter].forEach(function (control) {
        if (control) {
          control.addEventListener("input", applyFilters);
          control.addEventListener("change", applyFilters);
        }
      });
      applyFilters();
    }
  });
})();

function initPlayer(url) {
  var video = document.getElementById("movieVideo");
  var button = document.querySelector("[data-play-button]");
  if (!video || !button || !url) {
    return;
  }

  var loaded = false;

  function loadVideo() {
    if (loaded) {
      return;
    }
    loaded = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    } else if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      video.src = url;
    }
  }

  function startVideo() {
    loadVideo();
    button.classList.add("is-hidden");
    var playResult = video.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(function () {
        button.classList.remove("is-hidden");
      });
    }
  }

  button.addEventListener("click", startVideo);
  video.addEventListener("click", function () {
    if (video.paused) {
      startVideo();
    }
  });
}
