
import { H as Hls } from './hls-dru42stk.js';

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function initPlayer() {
  const video = qs('[data-hls-video]');
  const mount = qs('[data-player-mount]');
  const status = qs('[data-player-status]');
  const playBtn = qs('[data-player-play]');
  if (!video || !mount) return;

  const source = video.dataset.src;
  const setStatus = (text) => {
    if (status) status.textContent = text || '';
  };

  let hls = null;
  const attach = () => {
    if (!source) {
      setStatus('暂无播放地址');
      return;
    }
    if (window.Hls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => setStatus('播放源已加载'));
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data || !data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setStatus('网络错误，正在尝试恢复');
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          setStatus('媒体错误，正在尝试恢复');
          hls.recoverMediaError();
        } else {
          setStatus('无法播放视频');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      setStatus('已使用原生 HLS 播放');
    } else {
      setStatus('您的浏览器不支持 HLS 视频播放');
    }
  };

  const play = async () => {
    try {
      await video.play();
      setStatus('正在播放');
    } catch (err) {
      setStatus('请再次点击播放按钮');
    }
  };

  playBtn?.addEventListener('click', () => {
    mount.scrollIntoView({ behavior: 'smooth', block: 'center' });
    play();
  });

  video.addEventListener('play', () => setStatus('正在播放'));
  video.addEventListener('pause', () => setStatus('已暂停'));
  video.addEventListener('loadedmetadata', () => setStatus('播放就绪'));

  attach();
}

document.addEventListener('DOMContentLoaded', initPlayer);
