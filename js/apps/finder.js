/* Finder: Leopard-style window (unified toolbar, source list, icon/list views, path bar) over a virtual Kori Club drive. */
(() => {
  const ICON = { drive: 'assets/icons/drive.png', folder: 'assets/icons/folder.png' };
  const GLYPH = {
    photos: '<rect x="3" y="7" width="22" height="15" rx="2"/><circle cx="14" cy="14.5" r="4.5"/><path d="M9 7l2-3h6l2 3"/>',
    videos: '<rect x="5" y="3" width="18" height="22" rx="1"/><path d="M9 3v22M19 3v22M5 9h4M5 15h4M5 21h4M19 9h4M19 15h4M19 21h4"/>',
    music: '<path d="M11 21V7l11-3v14"/><ellipse cx="8.5" cy="21" rx="3.5" ry="2.8"/><ellipse cx="19.5" cy="18" rx="3.5" ry="2.8"/>',
    apps: '<path d="M14 4L6 23M14 4l8 19M9 17h10"/>'
  };
  const FOLDERS = [
    { id: 'apps', name: 'Applications', glyph: 'apps' },
    { id: 'photos', name: 'Photos', glyph: 'photos' },
    { id: 'videos', name: 'Videos', glyph: 'videos' },
    { id: 'music', name: 'Music', glyph: 'music' }
  ];
  const ROOT = { id: 'root', name: 'Kori Club', drive: true };
  const node = id => id === 'root' ? ROOT : FOLDERS.find(f => f.id === id);
  const KINDS = { photos: 'Image', videos: 'QuickTime movie', music: 'Audio' };

  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const folderIcon = (glyph, cls = '') => `<span class="fi ${cls}"><img src="${ICON.folder}" alt="" draggable="false">${glyph ? `<svg viewBox="0 0 28 28" class="glyph">${GLYPH[glyph]}</svg>` : ''}</span>`;
  const iconFor = n => n.drive ? `<span class="fi"><img src="${ICON.drive}" alt="" draggable="false"></span>` : folderIcon(n.glyph);

  function itemsOf(id, man) {
    if (id === 'root') return FOLDERS.map(f => ({ name: f.name, kind: 'Folder', icon: folderIcon(f.glyph), go: f.id }));
    if (id === 'apps') return KC.apps.filter(a => !a.decorative && a.id !== 'finder').map(a => ({
      name: a.name, kind: 'Application', icon: `<span class="fi"><img src="${a.icon}" alt="" draggable="false"></span>`, open: () => KC.launch(a.id) }));
    const list = man[id] || [];
    return list.map((m, i) => {
      const ext = (m.src.split('.').pop() || '').toLowerCase();
      const icon = id === 'photos'
        ? `<span class="fi thumb"><img src="${encodeURI(m.thumb || m.src)}" alt="" loading="lazy" draggable="false"></span>`
        : `<span class="fi"><img src="assets/icons/${id === 'videos' ? 'videos' : 'music'}.png" alt="" draggable="false"></span>`;
      return { name: m.title + (m.artist ? '' : ''), kind: (KINDS[id] || 'Document') + (ext ? ' (' + ext.toUpperCase() + ')' : ''), icon, open: () => KC.openItem(id, i) };
    });
  }

  const VIEW_ICONS = [
    '<svg viewBox="0 0 12 12"><path d="M1 1h4v4H1zM7 1h4v4H7zM1 7h4v4H1zM7 7h4v4H7z"/></svg>',
    '<svg viewBox="0 0 12 12"><path d="M1 2h10M1 4.7h10M1 7.3h10M1 10h10" stroke="#222" stroke-width="1.3"/></svg>',
    '<svg viewBox="0 0 12 12"><path d="M1 1h3v10H1zM4.5 1h3v10h-3zM8 1h3v10H8z"/></svg>',
    '<svg viewBox="0 0 12 12"><path d="M1 1h10v6H1zM2 8.5h8v2H2z"/></svg>'
  ];

  function openFinder(app, startId = 'root') {
    const root = el('div', 'fin');
    root.innerHTML = `
      <div class="fin-toolbar">
        <div class="seg nav"><button class="tb back" aria-label="Back"><svg viewBox="0 0 10 12"><path d="M8 1L2 6l6 5z"/></svg></button><button class="tb fwd" aria-label="Forward"><svg viewBox="0 0 10 12"><path d="M2 1l6 5-6 5z"/></svg></button></div>
        <div class="seg views">${VIEW_ICONS.map((v, i) => `<button class="tb view${i === 0 ? ' on' : ''}" data-v="${i}" aria-label="View ${i}">${v}</button>`).join('')}</div>
        <div class="seg arrange"><button class="tb wide" aria-label="Arrange"><svg viewBox="0 0 14 12"><path d="M1 2h6M3 5h6M5 8h6" stroke="#222" stroke-width="1.4"/><path d="M10 9l3 0-1.5 2z"/></svg></button></div>
        <span class="spacer"></span>
        <div class="seg"><button class="tb wide" aria-label="Quick Look"><svg viewBox="0 0 18 12"><path d="M1 6c2-3.5 5-5 8-5s6 1.500 8 5c-2 3.500-5 5-8 5S3 9.500 1 6z" fill="#222"/><circle cx="9" cy="6" r="2.500" fill="#eee"/></svg></button></div>
        <div class="seg"><button class="tb wide" aria-label="Action"><svg viewBox="0 0 18 12"><circle cx="7" cy="6" r="3.300" fill="none" stroke="#222" stroke-width="2.500" stroke-dasharray="2.200 1.200"/><circle cx="7" cy="6" r="1" fill="#222"/><path d="M12 5l4 0-2 3z"/></svg></button></div>
        <label class="search"><svg viewBox="0 0 12 12"><circle cx="5" cy="5" r="3.500" fill="none" stroke="#555" stroke-width="1.500"/><path d="M7.800 7.800L11 11" stroke="#555" stroke-width="1.600"/></svg><input type="search" aria-label="Search" autocomplete="off"></label>
      </div>
      <div class="fin-main">
        <aside class="fin-side"></aside>
        <section class="fin-pane"><div class="fin-items"></div></section>
      </div>
      <footer class="fin-path"></footer>`;

    const win = KC.wm.open({ app: app.id, title: '', width: app.size[0], height: app.size[1], content: root, cls: 'unified finder' });
    const titleEl = win.el.querySelector('.title');
    const side = root.querySelector('.fin-side'), items = root.querySelector('.fin-items'), pathEl = root.querySelector('.fin-path');
    const back = root.querySelector('.back'), fwd = root.querySelector('.fwd'), search = root.querySelector('input');
    let hist = [startId], pos = 0, view = 0, manifest = { photos: [], videos: [], music: [] }, cur = [];

    /* sidebar */
    const section = (label, rows) => {
      const s = el('div', 'side-sec'); s.append(el('div', 'side-h', `<i></i>${label}`));
      rows.forEach(n => { const r = el('button', 'side-i', `${iconFor(n)}<span>${esc(n.name)}</span>`); r.dataset.id = n.id; r.onclick = () => go(n.id); s.append(r); });
      return s;
    };
    side.append(section('DEVICES', [ROOT]), section('PLACES', FOLDERS));

    win.goTo = id => go(id);
    function go(id, push = true) {
      if (push) { hist = hist.slice(0, pos + 1); if (hist[pos] !== id) { hist.push(id); pos++; } }
      render();
    }
    back.onclick = () => { if (pos > 0) { pos--; render(); } };
    fwd.onclick = () => { if (pos < hist.length - 1) { pos++; render(); } };
    root.querySelectorAll('.view').forEach(b => b.onclick = () => {
      view = +b.dataset.v === 1 ? 1 : 0;      // icon + list implemented; column / cover flow fall back to icon
      root.querySelectorAll('.view').forEach(x => x.classList.toggle('on', x === b));
      draw();
    });
    search.addEventListener('input', draw);

    function render() {
      const id = hist[pos], n = node(id);
      titleEl.innerHTML = `${iconFor(n).replace('class="fi', 'class="fi tiny')}${esc(n.name)}`;
      side.querySelectorAll('.side-i').forEach(b => b.classList.toggle('sel', b.dataset.id === id));
      back.disabled = pos === 0; fwd.disabled = pos >= hist.length - 1;
      win.title = n.name;
      const chain = id === 'root' ? [ROOT] : [ROOT, n];
      pathEl.innerHTML = chain.map(c => `<span class="crumb">${iconFor(c).replace('class="fi', 'class="fi tiny')}${esc(c.name)}</span>`).join('<i class="arr">▸</i>');
      search.value = '';
      cur = itemsOf(id, manifest);
      draw();
    }

    function draw() {
      const q = search.value.trim().toLowerCase();
      const list = q ? cur.filter(i => i.name.toLowerCase().includes(q)) : cur;
      items.className = 'fin-items ' + (view === 1 ? 'list' : 'icons');
      items.innerHTML = '';
      if (view === 1) items.append(el('div', 'row head', '<span>Name</span><span>Kind</span>'));
      list.forEach(it => {
        const b = el('div', 'item', view === 1 ? `<span class="nm">${it.icon.replace('class="fi', 'class="fi tiny')}<b>${esc(it.name)}</b></span><span class="kd">${esc(it.kind)}</span>` : `${it.icon}<span class="lbl">${esc(it.name)}</span>`);
        if (view === 1) b.classList.add('row');
        b.tabIndex = 0;
        const open = () => it.go ? go(it.go) : it.open && it.open();
        b.addEventListener('pointerdown', e => { e.stopPropagation(); items.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); });
        b.addEventListener('dblclick', open);
        b.addEventListener('pointerup', e => { if (e.pointerType === 'touch') open(); });
        b.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
        items.append(b);
      });
      if (!list.length) items.append(el('div', 'empty', q ? 'No matches' : 'This folder is empty'));
      const cnt = el('span', 'count', `${list.length} item${list.length === 1 ? '' : 's'}`);
      pathEl.querySelector('.count')?.remove(); pathEl.append(cnt);
    }
    items.parentElement.addEventListener('pointerdown', () => items.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')));

    render();
    KC.getManifest().then(m => { manifest = m; if (win.el.isConnected) { cur = itemsOf(hist[pos], manifest); draw(); } });
    return win;
  }

  KC.apps.find(a => a.id === 'finder').open = app => openFinder(app);
  /* shared with the desktop: folder icon markup + "open Finder at this folder" */
  KC.finder = {
    folders: FOLDERS,
    folderIcon: id => { const n = node(id); return folderIcon(n.glyph); },
    openAt: id => {
      const ex = KC.wm.forApp('finder')[0];
      if (ex) { KC.wm.focus(ex.id); ex.goTo(id); }
      else { KC.dock.bounce('finder'); setTimeout(() => openFinder(KC.apps.find(a => a.id === 'finder'), id), 350); }
    }
  };
  KC.apps.find(a => a.id === 'finder').size = [660, 440];
})();
