/* App registry. Real apps are added one at a time; until then each opens a placeholder window. */
KC.apps = [
  { id: 'finder', name: 'Finder', icon: 'assets/icons/finder.svg', size: [640, 420] },
  { id: 'safari', name: 'Safari', icon: 'assets/icons/safari.png', size: [760, 500] },
  { id: 'photos', name: 'Photos', icon: 'assets/icons/photos.png', size: [640, 460] },
  { id: 'videos', name: 'Videos', icon: 'assets/icons/videos.png', size: [640, 440] },
  { id: 'music',  name: 'Music',  icon: 'assets/icons/music.png',  size: [600, 400] },
  { id: 'trash',  name: 'Trash',  icon: 'assets/icons/trash.svg',  decorative: true }
];

/* Launcher: bounce, then open (or restore / focus if already running). */
KC.launch = id => {
  const app = KC.apps.find(a => a.id === id);
  if (!app || app.decorative) { app && KC.dock.bounce(id); return; }
  const existing = KC.wm.forApp(id);
  if (existing.length) {
    const top = existing[existing.length - 1];
    KC.wm.focus(top.id);
    return;
  }
  KC.dock.bounce(id);
  setTimeout(() => (app.open || placeholder)(app), 350);
};

function placeholder(app) {
  KC.wm.open({
    app: app.id, title: app.name, width: app.size[0], height: app.size[1],
    content: `<div class="placeholder"><div><img src="${app.icon}" alt=""><h3>${app.name}</h3><p>This app is coming in the next step.</p></div></div>`
  });
}

KC.run = name => {
  if (name === 'about') {
    KC.wm.open({ app: 'finder', title: 'About Kori Club', width: 360, height: 240,
      content: `<div class="placeholder"><div><img src="assets/kori-logo.png" alt="" style="width:120px;height:auto"><h3>Kori Club</h3><p>Mac OS X demo desktop<br><a href="https://koriclub.com" target="_blank" rel="noopener">koriclub.com</a></p></div></div>` });
  } else KC.launch(name);
};

/* Open a manifest item (from Finder etc.) in its app. Apps may provide openItem(index). */
KC.getManifest = () => KC._manifest || (KC._manifest = fetch('content/manifest.json').then(r => r.json()).catch(() => ({ photos: [], videos: [], music: [] })));
KC.openItem = (appId, index) => {
  const app = KC.apps.find(a => a.id === appId);
  if (app && app.openItem) app.openItem(index); else KC.launch(appId);
};
