/* Videos: QuickTime 7-style player for manifest.videos (play/pause, prev/next, scrubber, volume, full screen). */
(() => {
  const app = KC.apps.find(a => a.id === 'videos');
  const fmt = s => (isFinite(s) && s >= 0) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00';
  const I = {
    play: '<svg viewBox="0 0 16 18"><path d="M2 1l13 8-13 8z"/></svg>',
    pause: '<svg viewBox="0 0 16 18"><path d="M2 1h4.500v16H2zM9.500 1H14v16H9.500z"/></svg>',
    prev: '<svg viewBox="0 0 20 14"><path d="M2 1h2.200v12H2zM5 7l7-6v12zM12 7l7-6v12z"/></svg>',
    next: '<svg viewBox="0 0 20 14"><path d="M15.800 1H18v12h-2.200zM15 7L8 1v12zM8 7L1 1v12z"/></svg>',
    full: '<svg viewBox="0 0 14 14"><path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" fill="none" stroke="#2b2e33" stroke-width="1.800"/></svg>'
  };

  function openVideos(a, start = null) {
    const root = document.createElement('div');
    root.className = 'qt';
    root.innerHTML = `
      <div class="qt-stage"><video playsinline preload="metadata"></video><div class="qt-msg"></div><button class="qt-big" aria-label="Play">${I.play}</button></div>
      <div class="qt-ctl">
        <label class="qt-vol"><svg viewBox="0 0 12 12"><path d="M1 4h2.500L7 1v10L3.500 8H1zM8.500 3.500a3.500 3.500 0 0 1 0 5" fill="#333" stroke="#333"/></svg><input type="range" min="0" max="1" step="0.01" value="0.8" aria-label="Volume"></label>
        <div class="qt-btns">
          <button class="rnd prev" aria-label="Previous">${I.prev}</button>
          <button class="rnd big play" aria-label="Play">${I.play}</button>
          <button class="rnd next" aria-label="Next">${I.next}</button>
        </div>
        <button class="rnd fs" aria-label="Full screen">${I.full}</button>
        <div class="qt-scrub"><span class="el">0:00</span><input type="range" min="0" max="1000" value="0" aria-label="Progress"><span class="re">0:00</span></div>
      </div>`;
    const win = KC.wm.open({ app: a.id, title: 'Videos', width: a.size[0], height: a.size[1], content: root, cls: 'quicktime' });
    const $ = s => root.querySelector(s);
    const v = $('video'), playBtn = $('.play'), big = $('.qt-big'), seek = $('.qt-scrub input'), vol = $('.qt-vol input'), msg = $('.qt-msg');
    let list = [], cur = -1, seeking = false;
    v.volume = 0.8;

    const icon = () => { const p = v.paused; playBtn.innerHTML = p ? I.play : I.pause; big.hidden = !p || cur < 0; };
    function setTitle(t) { win.title = t; win.el.querySelector('.title').textContent = t; }
    function load(i, autoplay = true) {
      if (!list.length) return;
      cur = (i + list.length) % list.length;
      const t = list[cur];
      msg.textContent = ''; v.src = encodeURI(t.src); setTitle(t.title);
      seek.value = 0;
      if (autoplay) v.play().catch(() => {});
      icon();
    }
    const toggle = () => { if (cur < 0) return load(0); v.paused ? v.play().catch(() => {}) : v.pause(); };

    playBtn.onclick = big.onclick = toggle;
    v.addEventListener('click', toggle);
    $('.prev').onclick = () => v.currentTime > 3 ? (v.currentTime = 0) : load(cur - 1);
    $('.next').onclick = () => load(cur + 1);
    $('.fs').onclick = () => { const f = v.requestFullscreen || v.webkitRequestFullscreen || v.webkitEnterFullscreen; f && f.call(v); };
    vol.oninput = () => { v.volume = +vol.value; };
    v.addEventListener('play', icon); v.addEventListener('pause', icon);
    v.addEventListener('ended', () => { if (list.length > 1) load(cur + 1); else { v.currentTime = 0; icon(); } });
    v.addEventListener('error', () => { msg.textContent = 'This movie can’t be played in your browser.'; });
    v.addEventListener('timeupdate', () => {
      if (!seeking && v.duration) seek.value = (v.currentTime / v.duration) * 1000;
      $('.el').textContent = fmt(v.currentTime); $('.re').textContent = v.duration ? '-' + fmt(v.duration - v.currentTime) : '0:00';
    });
    v.addEventListener('loadedmetadata', () => { $('.re').textContent = '-' + fmt(v.duration); });
    seek.addEventListener('pointerdown', () => { seeking = true; });
    seek.addEventListener('input', () => { if (v.duration) v.currentTime = (seek.value / 1000) * v.duration; });
    seek.addEventListener('change', () => { seeking = false; }); seek.addEventListener('pointerup', () => { seeking = false; });

    const key = e => {
      if (!win.el.classList.contains('active')) return;
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      else if (e.key === 'ArrowRight' && v.duration) v.currentTime = Math.min(v.duration, v.currentTime + 5);
      else if (e.key === 'ArrowLeft') v.currentTime = Math.max(0, v.currentTime - 5);
    };
    document.addEventListener('keydown', key);
    win.onclose = () => { v.pause(); v.removeAttribute('src'); v.load(); document.removeEventListener('keydown', key); };
    win.playIndex = i => load(i);

    KC.getManifest().then(m => {
      list = m.videos || [];
      if (!list.length) { msg.textContent = 'No videos yet. Add some to content/videos and list them in content/manifest.json.'; return; }
      if (start != null) load(start); else load(0, false);
    });
    icon();
    return win;
  }

  app.open = a => openVideos(a);
  app.size = [680, 460];
  app.openItem = i => {
    const ex = KC.wm.forApp('videos')[0];
    if (ex) { KC.wm.focus(ex.id); ex.playIndex(i); } else openVideos(app, i);
  };
})();
