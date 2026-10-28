/* Photos: thumbnail gallery from manifest.photos, click to enlarge (arrows / swipe / keys to browse). */
(() => {
  const app = KC.apps.find(a => a.id === 'photos');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function openPhotos(a, start = null) {
    const root = document.createElement('div');
    root.className = 'ph';
    root.innerHTML = `
      <div class="ph-bar top"><img src="assets/icons/photos.png" alt=""><b>Photos</b><span class="ph-count"></span></div>
      <div class="ph-grid" tabindex="0"></div>
      <div class="ph-bar bottom"><span class="sm">▪</span><input type="range" min="90" max="260" value="150" aria-label="Thumbnail size"><span class="lg">▪</span></div>
      <div class="ph-view" hidden>
        <button class="pv-x" aria-label="Close">✕</button>
        <button class="pv-nav prev" aria-label="Previous">‹</button>
        <div class="pv-stage"><img alt="" draggable="false"></div>
        <button class="pv-nav next" aria-label="Next">›</button>
        <div class="pv-cap"></div>
      </div>`;
    const win = KC.wm.open({ app: a.id, title: 'Photos', width: a.size[0], height: a.size[1], content: root, cls: 'photos' });
    const grid = root.querySelector('.ph-grid'), view = root.querySelector('.ph-view'), vimg = view.querySelector('img');
    const cap = view.querySelector('.pv-cap'), slider = root.querySelector('input'), count = root.querySelector('.ph-count');
    let photos = [], idx = -1;
    const setTitle = t => { win.title = t; win.el.querySelector('.title').textContent = t; };

    const size = () => grid.style.setProperty('--t', slider.value + 'px');
    slider.addEventListener('input', size); size();

    function show(i) {
      if (!photos.length) return;
      idx = (i + photos.length) % photos.length;
      const p = photos[idx];
      view.hidden = false; view.classList.add('loading');
      vimg.onload = () => view.classList.remove('loading');
      vimg.src = encodeURI(p.src);
      cap.textContent = `${p.title}  ·  ${idx + 1} of ${photos.length}`;
      setTitle(p.title);
    }
    function hide() { view.hidden = true; vimg.removeAttribute('src'); idx = -1; setTitle('Photos'); }
    win.showIndex = i => { if (photos.length) show(i); else start = i; };

    view.querySelector('.pv-x').onclick = hide;
    view.querySelector('.prev').onclick = () => show(idx - 1);
    view.querySelector('.next').onclick = () => show(idx + 1);
    view.addEventListener('click', e => { if (e.target === view || e.target.classList.contains('pv-stage')) hide(); });
    let sx = null;
    view.addEventListener('pointerdown', e => { sx = e.clientX; });
    view.addEventListener('pointerup', e => { if (sx != null && Math.abs(e.clientX - sx) > 50) show(idx + (e.clientX < sx ? 1 : -1)); sx = null; });
    const key = e => {
      if (!win.el.classList.contains('active') || view.hidden) return;
      if (e.key === 'ArrowRight') show(idx + 1); else if (e.key === 'ArrowLeft') show(idx - 1); else if (e.key === 'Escape') hide();
    };
    document.addEventListener('keydown', key);
    win.onclose = () => document.removeEventListener('keydown', key);

    KC.getManifest().then(m => {
      photos = m.photos || [];
      count.textContent = `${photos.length} photo${photos.length === 1 ? '' : 's'}`;
      photos.forEach((p, i) => {
        const b = document.createElement('button');
        b.className = 'ph-cell'; b.setAttribute('aria-label', p.title);
        b.innerHTML = `<img src="${esc(encodeURI(p.thumb || p.src))}" alt="${esc(p.title)}" loading="lazy" draggable="false">`;
        b.onclick = () => show(i);
        grid.append(b);
      });
      if (!photos.length) grid.innerHTML = '<div class="ph-empty">No photos yet. Add some to content/photos and list them in content/manifest.json.</div>';
      if (start != null) show(start);
    });
    return win;
  }

  app.open = a => openPhotos(a);
  app.size = [720, 500];
  app.openItem = i => {
    const existing = KC.wm.forApp('photos')[0];
    if (existing) { KC.wm.focus(existing.id); existing.showIndex(i); }
    else openPhotos(app, i);
  };
})();
