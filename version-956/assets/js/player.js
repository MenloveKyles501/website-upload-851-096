(function () {
  function setStatus(frame, message) {
    var status = frame.querySelector('[data-player-status]');
    if (status) {
      status.textContent = message || '';
    }
  }

  function initializePlayer(frame) {
    var video = frame.querySelector('video[data-hls-src]');
    var button = frame.querySelector('[data-player-start]');

    if (!video) {
      return;
    }

    var source = video.getAttribute('data-hls-src');
    if (!source) {
      setStatus(frame, '未找到播放源');
      return;
    }

    if (button) {
      button.classList.add('is-hidden');
    }

    setStatus(frame, '正在加载播放源…');

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        setStatus(frame, '播放源已就绪');
        video.play().catch(function () {
          setStatus(frame, '播放器已就绪，请再次点击播放');
        });
      });
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          setStatus(frame, '播放源加载失败，可刷新页面重试');
        }
      });
      frame.hlsInstance = hls;
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.addEventListener('loadedmetadata', function () {
        setStatus(frame, '播放源已就绪');
        video.play().catch(function () {
          setStatus(frame, '播放器已就绪，请再次点击播放');
        });
      }, { once: true });
      return;
    }

    setStatus(frame, '当前浏览器不支持 HLS 播放');
  }

  document.querySelectorAll('[data-player-frame]').forEach(function (frame) {
    var button = frame.querySelector('[data-player-start]');
    if (button) {
      button.addEventListener('click', function () {
        initializePlayer(frame);
      });
    }
  });
})();
