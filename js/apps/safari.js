/* Safari: Leopard-style browser with three tabs open. These sites send frame-blocking headers
   (koriclub.com: X-Frame-Options DENY / frame-ancestors 'none'), so they can't be embedded;
   each tab shows an "Open ..." button that opens the real page in a new browser tab. */
(() => {
  const app = KC.apps.find(a => a.id === 'safari');
  const YT = '<svg viewBox="0 0 24 24"><rect x="1" y="5" width="22" height="14" rx="4" fill="#e62117"/><path d="M10 9l5.500 3-5.500 3z" fill="#fff"/></svg>';
  const IG = '<svg viewBox="0 0 24 24"><defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fdc468"/><stop offset=".45" stop-color="#e1306c"/><stop offset="1" stop-color="#5b51d8"/></linearGradient></defs><rect x="1.500" y="1.500" width="21" height="21" rx="6" fill="url(#ig)"/><circle cx="12" cy="12" r="4.800" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.800" cy="6.200" r="1.300" fill="#fff"/></svg>';
  const KORI = '<img src="assets/kori-logo.png" alt="">';
  const SITES = [
    { name: 'Kori Club', host: 'koriclub.com', url: 'https://koriclub.com', icon: KORI, logo: true },
    { name: 'YouTube', host: 'youtube.com/@kori_club', url: 'https://www.youtube.com/@kori_club', icon: YT },
    { name: 'Instagram', host: 'instagram.com/koriclub', url: 'https://www.instagram.com/koriclub/', icon: IG }
  ];
  const open = s => window.open(s.url, '_blank', 'noopener');

  function openSafari(a) {
    const root = document.createElement('div');
    root.className = 'sf';
    root.innerHTML = `
      <div class="fin-toolbar sf-bar">
        <div class="seg"><button class="tb" disabled aria-label="Back"><svg viewBox="0 0 10 12"><path d="M8 1L2 6l6 5z"/></svg></button><button class="tb" disabled aria-label="Forward"><svg viewBox="0 0 10 12"><path d="M2 1l6 5-6 5z"/></svg></button></div>
        <form class="addr" action="#">
          <span class="fav"></span>
          <input type="text" aria-label="Address" spellcheck="false" autocapitalize="off" autocomplete="off">
          <button type="button" class="rl" aria-label="Reload"><svg viewBox="0 0 12 12"><path d="M10 6a4 4 0 1 1-1.200-2.800M9.500.8v2.800H6.700" fill="none" stroke="#444" stroke-width="1.500"/></svg></button>
        </form>
      </div>
      <div class="sf-tabs"><div class="tabs"></div><button class="newtab" aria-label="Reopen a saved tab" title="Reopen a closed tab">+</button></div>
      <div class="sf-page"><div class="sf-card"></div></div>`;
    const win = KC.wm.open({ app: a.id, title: 'Kori Club', width: a.size[0], height: a.size[1], content: root, cls: 'unified safari' });
    const tabsEl = root.querySelector('.tabs'), card = root.querySelector('.sf-card');
    const input = root.querySelector('.addr input'), fav = root.querySelector('.fav');
    let tabs = SITES.slice(), cur = 0;

    function setTitle(t) { win.title = t; win.el.querySelector('.title').textContent = t; }
    function drawTabs() {
      tabsEl.innerHTML = '';
      tabs.forEach((s, i) => {
        const t = document.createElement('div');
        t.className = 'tab' + (i === cur ? ' on' : ''); t.tabIndex = 0;
        t.innerHTML = `<button class="x" aria-label="Close tab">✕</button><span class="mi">${s.icon}</span><span class="tn">${s.name}</span>`;
        t.addEventListener('click', e => { if (!e.target.closest('.x')) select(i); });
        t.addEventListener('keydown', e => { if (e.key === 'Enter') select(i); });
        t.querySelector('.x').onclick = e => { e.stopPropagation(); closeTab(i); };
        tabsEl.append(t);
      });
      root.querySelector('.newtab').classList.toggle('off', tabs.length >= SITES.length);
    }
    function select(i) {
      cur = i; const s = tabs[i];
      input.value = s.host; fav.innerHTML = s.icon; setTitle(s.name);
      card.innerHTML = `<div class="${s.logo ? 'logo' : 'siteicon'}">${s.icon}</div>
        <button class="aqua-btn" type="button">Open ${s.host.split('/')[0]}</button>
        <p>${s.host.split('/')[0]} can’t be shown inside this window, so it opens in a new tab.</p>`;
      card.querySelector('.aqua-btn').onclick = () => open(s);
      drawTabs();
    }
    function closeTab(i) {
      if (tabs.length === 1) { KC.wm.close(win.id); return; }
      tabs.splice(i, 1);
      select(Math.min(i === cur ? i : (i < cur ? cur - 1 : cur), tabs.length - 1));
    }
    root.querySelector('.newtab').onclick = () => {
      const missing = SITES.find(s => !tabs.includes(s));
      if (missing) { tabs.push(missing); select(tabs.length - 1); }
    };
    root.querySelector('.addr').addEventListener('submit', e => { e.preventDefault(); open(tabs[cur]); });
    const rl = root.querySelector('.rl');
    rl.onclick = () => { rl.classList.remove('spin'); void rl.offsetWidth; rl.classList.add('spin'); };
    select(0);
    return win;
  }

  app.open = a => openSafari(a);
  app.size = [780, 500];
})();
