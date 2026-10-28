/* Music: iTunes-style player for manifest.music (play/pause, prev/next, seek, volume, shuffle/repeat, search). */
(() => {
  const app = KC.apps.find(a => a.id === 'music');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = s => (isFinite(s) && s >= 0) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '–:––';
  const I = {
    prev: '<svg viewBox="0 0 20 14"><path d="M2 1h2.200v12H2zM5 7l7-6v12zM12 7l7-6v12z"/></svg>',
    next: '<svg viewBox="0 0 20 14"><path d="M15.800 1H18v12h-2.200zM15 7L8 1v12zM8 7L1 1v12z"/></svg>',
    play: '<svg viewBox="0 0 16 18"><path d="M2 1l13 8-13 8z"/></svg>',
    pause: '<svg viewBox="0 0 16 18"><path d="M2 1h4.500v16H2zM9.500 1H14v16H9.500z"/></svg>',
    spk: '<svg viewBox="0 0 12 12"><path d="M1 4h2.500L7 1v10L3.500 8H1zM8.500 3.500a3.500 3.500 0 0 1 0 5" fill="currentColor" stroke="currentColor" stroke-width="1"/></svg>'
  };

  function openMusic(a, startIndex = null) {
    const root = document.createElement('div');
    root.className = 'mu';
    root.innerHTML = `
      <div class="mu-top">
        <div class="mu-ctl">
          <button class="rnd prev" aria-label="Previous">${I.prev}</button>
          <button class="rnd big play" aria-label="Play">${I.play}</button>
          <button class="rnd next" aria-label="Next">${I.next}</button>
        </div>
        <label class="mu-vol"><svg viewBox="0 0 12 12" class="v0"><path d="M1 4h2.500L7 1v10L3.500 8H1z"/></svg><input type="range" min="0" max="1" step="0.01" value="0.8" aria-label="Volume"><svg viewBox="0 0 16 12" class="v1"><path d="M1 4h2.500L7 1v10L3.500 8H1zM9 3.500a3.500 3.500 0 0 1 0 5M11.500 1.500a6.500 6.500 0 0 1 0 9" fill="none" stroke="#333" stroke-width="1.200"/><path d="M1 4h2.500L7 1v10L3.500 8H1z"/></svg></label>
        <div class="mu-lcd">
          <div class="lcd-t">Kori Club</div>
          <div class="lcd-a">Choose a song</div>
          <div class="lcd-p"><span class="el">0:00</span><input type="range" min="0" max="1000" value="0" aria-label="Progress"><span class="re">–:––</span></div>
        </div>
        <label class="search"><svg viewBox="0 0 12 12"><circle cx="5" cy="5" r="3.500" fill="none" stroke="#555" stroke-width="1.500"/><path d="M7.800 7.800L11 11" stroke="#555" stroke-width="1.600"/></svg><input type="search" aria-label="Search" autocomplete="off"></label>
      </div>
      <div class="mu-main">
        <aside class="mu-side"><div class="side-h"><i></i>LIBRARY</div><div class="mu-src sel"><img src="assets/icons/music.png" alt="">Music</div></aside>
        <section class="mu-list"><div class="mu-row head"><span></span><span>Name</span><span>Time</span><span>Artist</span></div><div class="mu-rows"></div></section>
      </div>
      <div class="mu-bot"><button class="sq shuf" aria-label="Shuffle" title="Shuffle"><svg viewBox="0 0 16 12"><path d="M1 3h3c3 0 4 6 7 6h2M1 9h3c1 0 2-1 3-2.500M8 4c1-.9 1.800-1 3-1h2" fill="none" stroke="currentColor" stroke-width="1.500"/><path d="M12 .5l3 2.500-3 2.500zM12 6.500l3 2.500-3 2.500z" fill="currentColor"/></svg></button><button class="sq rep" aria-label="Repeat" title="Repeat"><svg viewBox="0 0 16 12"><path d="M2 6V4.500Q2 3 3.500 3H12M14 6v1.500Q14 9 12.500 9H4" fill="none" stroke="currentColor" stroke-width="1.500"/><path d="M11 .5l3 2.500-3 2.500zM5 6.500L2 9l3 2.500z" fill="currentColor"/></svg></button><span class="mu-status"></span></div>`;
    const win = KC.wm.open({ app: a.id, title: 'Music', width: a.size[0], height: a.size[1], content: root, cls: 'music' });
    const $ = s => root.querySelector(s);
    const audio = new Audio(); audio.preload = 'metadata'; audio.volume = 0.8;
    const rowsEl = $('.mu-rows'), playBtn = $('.play'), seek = $('.lcd-p input'), vol = $('.mu-vol input'), search = $('.search input');
    let tracks = [], cur = -1, shuffle = false, repeat = true, seeking = false, shown = [];

    const setPlayIcon = () => { playBtn.innerHTML = audio.paused ? I.play : I.pause; playBtn.setAttribute('aria-label', audio.paused ? 'Play' : 'Pause'); };
    function mark() {
      rowsEl.querySelectorAll('.mu-row').forEach(r => {
        const on = +r.dataset.i === cur;
        r.classList.toggle('now', on);
        r.firstChild.innerHTML = on ? I.spk : (+r.dataset.n);
      });
    }
    function load(i, autoplay = true) {
      if (!tracks.length) return;
      cur = (i + tracks.length) % tracks.length;
      const t = tracks[cur];
      audio.src = encodeURI(t.src);
      $('.lcd-t').textContent = t.title; $('.lcd-a').textContent = t.artist || 'Kori Club';
      seek.value = 0; $('.el').textContent = '0:00'; $('.re').textContent = '–:––';
      mark();
      if (autoplay) audio.play().catch(() => { $('.lcd-a').textContent = 'Press play to start'; });
    }
    const toggle = () => {
      if (cur < 0) return load(shown.length ? +shown[0] : 0);
      audio.paused ? audio.play().catch(() => {}) : audio.pause();
    };
    const next = () => load(shuffle && tracks.length > 1 ? randomOther() : cur + 1);
    const randomOther = () => { let n; do { n = Math.floor(Math.random() * tracks.length); } while (n === cur); return n; };
    const prev = () => audio.currentTime > 3 ? (audio.currentTime = 0) : load(cur - 1);

    playBtn.onclick = toggle; $('.next').onclick = next; $('.prev').onclick = prev;
    $('.shuf').onclick = e => { shuffle = !shuffle; e.currentTarget.classList.toggle('on', shuffle); };
    $('.rep').onclick = e => { repeat = !repeat; e.currentTarget.classList.toggle('on', repeat); };
    $('.rep').classList.add('on');
    vol.oninput = () => { audio.volume = +vol.value; };

    audio.addEventListener('play', setPlayIcon); audio.addEventListener('pause', setPlayIcon);
    audio.addEventListener('ended', () => { if (!repeat && cur === tracks.length - 1 && !shuffle) { setPlayIcon(); return; } next(); });
    audio.addEventListener('error', () => { if (audio.src) $('.lcd-a').textContent = 'Can’t play this file'; });
    audio.addEventListener('timeupdate', () => {
      if (!seeking && audio.duration) seek.value = (audio.currentTime / audio.duration) * 1000;
      $('.el').textContent = fmt(audio.currentTime);
      $('.re').textContent = audio.duration ? '-' + fmt(audio.duration - audio.currentTime) : '–:––';
    });
    seek.addEventListener('pointerdown', () => { seeking = true; });
    seek.addEventListener('input', () => { if (audio.duration) { audio.currentTime = (seek.value / 1000) * audio.duration; } });
    seek.addEventListener('change', () => { seeking = false; });
    seek.addEventListener('pointerup', () => { seeking = false; });

    function draw() {
      const q = search.value.trim().toLowerCase();
      rowsEl.innerHTML = ''; shown = [];
      tracks.forEach((t, i) => {
        if (q && !(t.title + ' ' + (t.artist || '')).toLowerCase().includes(q)) return;
        shown.push(i);
        const r = document.createElement('div');
        r.className = 'mu-row'; r.dataset.i = i; r.dataset.n = i + 1;
        r.innerHTML = `<span>${i + 1}</span><span class="n">${esc(t.title)}</span><span class="d">${fmt(t.dur)}</span><span class="ar">${esc(t.artist || '')}</span>`;
        r.addEventListener('pointerdown', () => { rowsEl.querySelectorAll('.pick').forEach(x => x.classList.remove('pick')); r.classList.add('pick'); });
        r.addEventListener('dblclick', () => load(i));
        r.addEventListener('pointerup', e => { if (e.pointerType === 'touch') load(i); });
        rowsEl.append(r);
      });
      mark();
      const total = tracks.reduce((s, t) => s + (t.dur || 0), 0);
      $('.mu-status').textContent = `${tracks.length} song${tracks.length === 1 ? '' : 's'}` + (total ? `, ${Math.round(total / 60)} minutes` : '');
    }
    search.addEventListener('input', draw);

    const key = e => {
      if (!win.el.classList.contains('active') || e.target.closest('input[type=search]')) return;
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
    };
    document.addEventListener('keydown', key);
    win.onclose = () => { audio.pause(); audio.removeAttribute('src'); audio.load(); document.removeEventListener('keydown', key); };
    win.playIndex = i => load(i);

    KC.getManifest().then(m => {
      tracks = (m.music || []).map(t => ({ ...t }));
      draw();
      tracks.forEach((t, i) => {            // read durations from file headers only
        const p = new Audio(); p.preload = 'metadata'; p.src = encodeURI(t.src);
        p.addEventListener('loadedmetadata', () => { t.dur = p.duration; const r = rowsEl.querySelector(`[data-i="${i}"] .d`); if (r) r.textContent = fmt(t.dur); draw(); });
      });
      if (startIndex != null) load(startIndex);
    });
    return win;
  }

  app.open = a => openMusic(a);
  app.size = [740, 440];
  app.openItem = i => {
    const ex = KC.wm.forApp('music')[0];
    if (ex) { KC.wm.focus(ex.id); ex.playIndex(i); } else openMusic(app, i);
  };
})();
