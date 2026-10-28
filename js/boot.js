/* Loading screen: logo + progress bar, then fade into the desktop. Click or any key skips it. */
(() => {
  const boot = document.getElementById('boot'), fill = boot.querySelector('i');
  let p = 0, t0 = performance.now(), finished = false;
  const DURATION = 3200;
  const finish = () => {
    if (finished) return; finished = true;
    fill.style.width = '100%';
    boot.classList.add('done');
    setTimeout(() => boot.remove(), 800);
  };
  const tick = now => {
    if (finished) return;
    // eased, slightly stuttery progress like a real boot
    const x = Math.min(1, (now - t0) / DURATION);
    p = Math.max(p, 1 - Math.pow(1 - x, 2.2));
    fill.style.width = (p * 100).toFixed(1) + '%';
    x < 1 ? requestAnimationFrame(tick) : setTimeout(finish, 250);
  };
  requestAnimationFrame(tick);
  boot.addEventListener('pointerdown', finish);
  addEventListener('keydown', finish, { once: true });
})();
