/* Desktop icons, Mac-style: the Kori Club drive plus every manifest photo flagged "desktop": true.
   The drive and the Photos / Videos / Music folders sit top right; flagged photos and GIFs (animated) fill columns from the top left; click selects, double-click (tap on touch) opens, drag to rearrange. */
(() => {
  const layerRight = document.getElementById('desk-icons'), layerLeft = document.getElementById('desk-left');
  const desktop = document.getElementById('desktop');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let selected = null, z = 1;

  function select(el) { selected && selected.classList.remove('sel'); selected = el; el && el.classList.add('sel'); }

  function add({ label, html, open }, layer = layerRight) {
    const b = document.createElement('div');
    b.className = 'desktop-icon'; b.tabIndex = 0;
    b.innerHTML = `<div class="di-img">${html}</div><span>${esc(label)}</span>`;
    let sx, sy, ox = 0, oy = 0, drag = false, down = false;
    b.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      e.stopPropagation(); select(b); down = true; drag = false; sx = e.clientX; sy = e.clientY;
      const t = b.style.translate.split(' ').map(parseFloat); ox = t[0] || 0; oy = t[1] || 0;
      if (e.pointerType !== 'touch') b.setPointerCapture(e.pointerId);
    });
    b.addEventListener('pointermove', e => {
      if (!down || e.pointerType === 'touch') return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!drag && Math.hypot(dx, dy) < 5) return;
      drag = true; b.classList.add('drag'); b.style.zIndex = ++z;
      b.style.translate = `${ox + dx}px ${oy + dy}px`;
    });
    const end = e => {
      if (!down) return; down = false; b.classList.remove('drag');
      if (e.type === 'pointerup' && e.pointerType === 'touch' && !drag) open();
    };
    b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end);
    b.addEventListener('dblclick', () => { if (!drag) open(); });
    b.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
    layer.append(b);
    return b;
  }

  add({ label: 'Kori Club', html: '<img src="assets/icons/drive.png" alt="" draggable="false">', open: () => KC.launch('finder') });
  ['photos', 'videos', 'music'].forEach(id => {
    const fo = KC.finder.folders.find(x => x.id === id);
    add({ label: fo.name, html: KC.finder.folderIcon(id), open: () => KC.finder.openAt(id) });
  });
  desktop.addEventListener('pointerdown', e => { if (!e.target.closest('.desktop-icon')) select(null); });

  KC.getManifest().then(m => {
    (m.photos || []).forEach((p, i) => {
      if (!p.desktop) return;
      add({ label: p.title, open: () => KC.openItem('photos', i),
        html: `<img class="thumb" src="${esc(encodeURI(/\.gif$/i.test(p.src) ? p.src : (p.thumb || p.src)))}" alt="" loading="lazy" draggable="false">` }, layerLeft);
    });
  });
})();
