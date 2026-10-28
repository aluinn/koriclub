/* Window manager: create, drag, focus, resize, close / minimise / zoom. */
window.KC = window.KC || {};
KC.wm = (() => {
  const layer = document.getElementById('windows');
  const wins = new Map();          // id -> {el, app, rect}
  let z = 10, seq = 0, active = null;
  const listeners = [];
  const emit = () => listeners.forEach(fn => fn());

  const area = () => layer.getBoundingClientRect();
  const small = () => window.innerWidth <= 700;

  function open({ app, title, width = 560, height = 380, content, cls = '' }) {
    const id = 'w' + (++seq);
    const a = area();
    const w = Math.min(width, a.width - 12), h = Math.min(height, a.height - 90);
    const n = wins.size % 6;
    const left = small() ? (a.width - w) / 2 : Math.max(6, (a.width - w) / 2 + (n - 2) * 28);
    const top = small() ? 14 + n * 14 : Math.max(8, (a.height - h) / 2 - 40 + n * 26);

    const el = document.createElement('section');
    el.className = 'win opening ' + cls;
    el.style.cssText = `left:${left}px;top:${top}px;width:${w}px;height:${h}px`;
    el.innerHTML = `
      <header class="titlebar">
        <div class="lights">
          <button class="light close" aria-label="Close"></button>
          <button class="light min" aria-label="Minimise"></button>
          <button class="light zoom" aria-label="Zoom"></button>
        </div>
        <div class="title"></div>
      </header>
      <div class="win-body"></div>
      <div class="resize"></div>`;
    el.querySelector('.title').textContent = title;
    const body = el.querySelector('.win-body');
    if (typeof content === 'string') body.innerHTML = content;
    else if (content) body.append(content);
    layer.append(el);
    const rec = { id, el, app, body, title };
    wins.set(id, rec);
    el.addEventListener('animationend', () => el.classList.remove('opening'));

    el.addEventListener('pointerdown', () => focus(id), true);
    el.querySelector('.close').onclick = () => close(id);
    el.querySelector('.min').onclick = () => minimize(id);
    el.querySelector('.zoom').onclick = () => zoom(id);
    const tb = el.querySelector('.titlebar');
    tb.addEventListener('dblclick', e => { if (!e.target.closest('.lights')) zoom(id); });
    drag(rec, tb);
    resize(rec, el.querySelector('.resize'));
    focus(id);
    emit();
    return rec;
  }

  function focus(id) {
    const r = wins.get(id); if (!r) return;
    if (r.el.classList.contains('minimized')) restore(id);
    wins.forEach(o => o.el.classList.remove('active'));
    r.el.classList.add('active');
    r.el.style.zIndex = ++z;
    active = id;
    emit();
  }

  function close(id) {
    const r = wins.get(id); if (!r) return;
    r.onclose && r.onclose();
    r.el.remove(); wins.delete(id);
    if (active === id) { active = null; const top = [...wins.values()].filter(w => !w.el.classList.contains('minimized')).pop(); if (top) focus(top.id); }
    emit();
  }

  function minimize(id) {
    const r = wins.get(id); if (!r) return;
    const t = KC.dock && KC.dock.itemRect(r.app);
    const b = r.el.getBoundingClientRect(), a = area();
    if (t) {
      const dx = t.left + t.width / 2 - (b.left + b.width / 2);
      const dy = t.top + t.height / 2 - (b.top + b.height / 2);
      r.el.style.transformOrigin = 'center';
      r.el.style.transform = `translate(${dx}px,${dy}px) scale(.08)`;
    }
    r.el.classList.add('minimized'); r.el.classList.remove('active');
    if (active === id) { active = null; const top = [...wins.values()].filter(w => !w.el.classList.contains('minimized')).pop(); if (top) focus(top.id); }
    emit();
  }

  function restore(id) {
    const r = wins.get(id); if (!r) return;
    r.el.classList.remove('minimized');
    r.el.style.transform = '';
  }

  function zoom(id) {
    const r = wins.get(id); if (!r) return;
    const el = r.el;
    if (el.classList.toggle('zoomed')) {
      r.rect = { l: el.style.left, t: el.style.top, w: el.style.width, h: el.style.height };
      const a = area(), dockH = (document.getElementById('dock').offsetHeight || 60) + 14;
      el.style.left = '6px'; el.style.top = '4px';
      el.style.width = (a.width - 12) + 'px'; el.style.height = (a.height - dockH - 4) + 'px';
    } else if (r.rect) {
      el.style.left = r.rect.l; el.style.top = r.rect.t; el.style.width = r.rect.w; el.style.height = r.rect.h;
    }
    focus(id);
  }

  function drag(r, handle) {
    handle.addEventListener('pointerdown', e => {
      if (e.target.closest('.lights') || e.button > 0) return;
      const el = r.el, a = area();
      const sx = e.clientX, sy = e.clientY, ol = el.offsetLeft, ot = el.offsetTop;
      handle.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
      const mv = ev => {
        let l = ol + ev.clientX - sx, t = ot + ev.clientY - sy;
        t = Math.max(0, Math.min(t, a.height - 24));
        l = Math.max(-el.offsetWidth + 60, Math.min(l, a.width - 60));
        el.style.left = l + 'px'; el.style.top = t + 'px';
      };
      const up = () => { el.classList.remove('dragging'); handle.removeEventListener('pointermove', mv); handle.removeEventListener('pointerup', up); handle.removeEventListener('pointercancel', up); };
      handle.addEventListener('pointermove', mv); handle.addEventListener('pointerup', up); handle.addEventListener('pointercancel', up);
    });
  }

  function resize(r, handle) {
    handle.addEventListener('pointerdown', e => {
      const el = r.el, sx = e.clientX, sy = e.clientY, ow = el.offsetWidth, oh = el.offsetHeight;
      handle.setPointerCapture(e.pointerId); el.classList.add('resizing'); e.stopPropagation(); focus(r.id);
      const mv = ev => {
        el.style.width = Math.max(240, ow + ev.clientX - sx) + 'px';
        el.style.height = Math.max(140, oh + ev.clientY - sy) + 'px';
        r.onresize && r.onresize();
      };
      const up = () => { el.classList.remove('resizing'); handle.removeEventListener('pointermove', mv); handle.removeEventListener('pointerup', up); };
      handle.addEventListener('pointermove', mv); handle.addEventListener('pointerup', up);
    });
  }

  const forApp = app => [...wins.values()].filter(w => w.app === app);
  return { open, focus, close, minimize, restore, zoom, forApp, all: () => [...wins.values()], active: () => wins.get(active), onChange: fn => listeners.push(fn) };
})();
