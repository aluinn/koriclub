/* Menu bar: logo menu + Finder/File/Edit/View/Go/Window/Help dropdowns + live clock. */
KC.menubar = (() => {
  const bar = document.getElementById('menus');
  let openBtn = null, dd = null;
  const act = name => () => KC.run && KC.run(name);
  const D = (label, fn, kbd) => ({ label, fn, kbd, disabled: !fn });
  const S = { sep: true };

  const MENUS = [
    { logo: true, label: 'Kori Club', items: () => [
      D('About Kori Club', act('about')), D('Visit koriclub.com…', () => window.open('https://koriclub.com', '_blank', 'noopener')), S,
      D('System Preferences…'), S, D('Sleep'), D('Restart…'), D('Shut Down…') ] },
    { label: 'Finder', bold: true, items: () => [
      D('About Finder', act('about')), S, D('Preferences…'), S, D('Empty Trash…'), S, D('Hide Finder', null, '⌘H'), D('Hide Others', null, '⌥⌘H'), D('Show All') ] },
    { label: 'File', items: () => [
      D('New Finder Window', act('finder'), '⌘N'), D('New Folder', null, '⇧⌘N'), D('Open', null, '⌘O'), S,
      D('Close Window', () => { const w = KC.wm.active(); w && KC.wm.close(w.id); }, '⌘W'), S, D('Get Info', null, '⌘I') ] },
    { label: 'Edit', items: () => [
      D('Undo', null, '⌘Z'), D('Redo', null, '⇧⌘Z'), S, D('Cut', null, '⌘X'), D('Copy', null, '⌘C'), D('Paste', null, '⌘V'), D('Select All', null, '⌘A') ] },
    { label: 'View', items: () => [
      D('as Icons', null, '⌘1'), D('as List', null, '⌘2'), D('as Columns', null, '⌘3'), S, D('Hide Toolbar', null, '⌥⌘T'), D('Show View Options', null, '⌘J') ] },
    { label: 'Go', items: () => [
      D('Back', null, '⌘['), D('Forward', null, '⌘]'), S,
      D('Applications', act('finder')), D('Photos', act('photos')), D('Videos', act('videos')), D('Music', act('music')), S,
      D('Connect to Server… (koriclub.com)', act('safari')) ] },
    { label: 'Window', hide: true, items: () => {
      const ws = KC.wm.all(), a = KC.wm.active();
      const list = ws.map(w => ({ label: w.title, fn: () => KC.wm.focus(w.id), check: a && a.id === w.id }));
      return [D('Minimize', a ? () => KC.wm.minimize(a.id) : null, '⌘M'), D('Zoom', a ? () => KC.wm.zoom(a.id) : null), S, ...(list.length ? list : [D('No windows open')])];
    } },
    { label: 'Help', hide: true, items: () => [D('Kori Club Help', () => window.open('https://koriclub.com', '_blank', 'noopener')), D('Visit koriclub.com', () => window.open('https://koriclub.com', '_blank', 'noopener'))] }
  ];

  function closeMenu() {
    if (openBtn) openBtn.classList.remove('open');
    if (dd) dd.remove();
    openBtn = dd = null;
  }
  function openMenu(btn, def) {
    closeMenu();
    openBtn = btn; btn.classList.add('open');
    dd = document.createElement('div'); dd.className = 'dropdown';
    def.items().forEach(it => {
      if (it.sep) { dd.insertAdjacentHTML('beforeend', '<div class="sep"></div>'); return; }
      const row = document.createElement('div');
      row.className = 'item' + (it.disabled ? ' disabled' : '');
      row.innerHTML = '<span></span><span class="kbd"></span>';
      row.children[0].textContent = (it.check ? '✓ ' : '') + it.label;
      row.children[1].textContent = it.kbd || '';
      if (!it.disabled) row.addEventListener('click', () => { closeMenu(); it.fn(); });
      dd.append(row);
    });
    document.body.append(dd);
    const r = btn.getBoundingClientRect();
    dd.style.top = r.bottom + 'px';
    dd.style.left = Math.max(0, Math.min(r.left, window.innerWidth - dd.offsetWidth - 4)) + 'px';
  }

  function build() {
    MENUS.forEach(def => {
      const b = document.createElement('button');
      b.className = 'menu-title' + (def.logo ? ' logo' : '') + (def.bold ? ' bold' : '') + (def.hide ? ' hide-sm' : '');
      if (def.logo) b.innerHTML = '<img src="assets/kori-logo.png" alt="Kori Club">'; else b.textContent = def.label;
      b.addEventListener('click', e => { e.stopPropagation(); openBtn === b ? closeMenu() : openMenu(b, def); });
      b.addEventListener('pointerenter', e => { if (openBtn && openBtn !== b && e.pointerType === 'mouse') openMenu(b, def); });
      bar.append(b);
      def.btn = b;
    });
    document.addEventListener('pointerdown', e => { if (dd && !e.target.closest('.dropdown, .menu-title')) closeMenu(); });
    window.addEventListener('blur', closeMenu);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  /* active app name shown in bold as the "Finder" menu title */
  function setAppName(name) { MENUS[1].label = name; MENUS[1].btn.textContent = name; }

  function clock() {
    const el = document.getElementById('clock');
    const tick = () => {
      const d = new Date();
      el.innerHTML = `<span class="day">${d.toLocaleDateString('en-US', { weekday: 'short' })} </span>${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    };
    tick(); setInterval(tick, 1000);
  }

  build(); clock();
  return { setAppName, close: closeMenu };
})();
