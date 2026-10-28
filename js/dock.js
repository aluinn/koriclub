/* Dock: magnification, bounce on launch, running indicators, tooltips. */
KC.dock = (() => {
  const dock = document.getElementById('dock');
  const items = new Map();
  const fine = matchMedia('(pointer:fine)');

  function add(app) {
    const b = document.createElement('button');
    b.className = 'dock-item'; b.setAttribute('aria-label', app.name);
    b.innerHTML = `<img src="${app.icon}" alt=""><span class="dock-label"></span>`;
    b.querySelector('.dock-label').textContent = app.name;
    b.addEventListener('click', () => KC.launch(app.id));
    dock.append(b); items.set(app.id, b);
  }
  function sep() { const s = document.createElement('div'); s.className = 'dock-sep'; dock.append(s); }

  const base = () => parseFloat(getComputedStyle(dock).getPropertyValue('--base'));
  const MAX = 1.75, SIGMA = 62;
  function magnify(x) {
    const b = base();
    items.forEach(el => {
      const r = el.getBoundingClientRect();
      const d = x - (r.left + r.width / 2);
      const scale = 1 + (MAX - 1) * Math.exp(-(d * d) / (2 * SIGMA * SIGMA));
      el.style.width = el.style.height = (b * scale) + 'px';
    });
  }
  function reset() { items.forEach(el => { el.style.width = el.style.height = ''; }); }
  dock.addEventListener('mousemove', e => { if (fine.matches) magnify(e.clientX); });
  dock.addEventListener('mouseleave', reset);

  function bounce(id) {
    const el = items.get(id); if (!el) return;
    el.classList.remove('bounce'); void el.offsetWidth; el.classList.add('bounce');
    el.addEventListener('animationend', () => el.classList.remove('bounce'), { once: true });
  }
  const setRunning = (id, on) => { const el = items.get(id); el && el.classList.toggle('running', on); };
  const itemRect = id => { const el = items.get(id); return el && el.getBoundingClientRect(); };
  return { add, sep, bounce, setRunning, itemRect };
})();
