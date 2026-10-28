/* Boot: build the Dock, keep running-dots and the menu-bar app name in sync. */
KC.apps.forEach(a => {
  if (a.id === 'trash') KC.dock.sep();
  KC.dock.add(a);
});

KC.wm.onChange(() => {
  KC.apps.forEach(a => KC.dock.setRunning(a.id, KC.wm.forApp(a.id).length > 0));
  const w = KC.wm.active();
  const app = w && KC.apps.find(a => a.id === w.app);
  KC.menubar.setAppName(app ? app.name : 'Finder');
});
