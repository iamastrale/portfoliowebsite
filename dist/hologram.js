// Pointer velocity drives both the ambient pitch and a lightweight shockwave graphic.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const root = document.documentElement;
  const shockwave = document.createElement('div');
  shockwave.className = 'astrale-shockwave';
  shockwave.setAttribute('aria-hidden', 'true');
  shockwave.innerHTML = '<i></i><i></i><i></i>';
  document.body.append(shockwave);

  const pointer = {
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    speed: 0,
    targetSpeed: 0,
    clickEnergy: 0,
    active: false
  };
  let frame = 0;
  let lastFrame = performance.now();
  let lastVelocitySignal = -1;

  function enabled() {
    return finePointer.matches && !reduced.matches;
  }

  function reset() {
    pointer.active = false;
    pointer.speed = 0;
    pointer.targetSpeed = 0;
    pointer.clickEnergy = 0;
    root.style.setProperty('--wave-energy', '0');
    window.dispatchEvent(new CustomEvent('astralevelocity', { detail: { amount: 0, cents: 0 } }));
  }

  function emitVelocity(amount) {
    if (Math.abs(amount - lastVelocitySignal) > .006 || (amount === 0 && lastVelocitySignal !== 0)) {
      lastVelocitySignal = amount;
      window.dispatchEvent(new CustomEvent('astralevelocity', { detail: { amount, cents: amount * 100 } }));
    }
  }

  function animate(now) {
    frame = requestAnimationFrame(animate);
    const delta = Math.min((now - lastFrame) / 1000, .06);
    lastFrame = now;
    pointer.targetSpeed *= Math.exp(-delta * 8.5);
    pointer.clickEnergy *= Math.exp(-delta * 5.2);
    const speedEase = 1 - Math.pow(pointer.targetSpeed > pointer.speed ? .00005 : .006, delta);
    pointer.speed += (pointer.targetSpeed - pointer.speed) * speedEase;
    const movement = pointer.speed < .006 ? 0 : Math.min(1, pointer.speed);
    const energy = Math.min(1, movement + pointer.clickEnergy * .72);
    root.style.setProperty('--wave-energy', energy.toFixed(3));
    shockwave.classList.toggle('is-visible', pointer.active && energy > .008);
    emitVelocity(Math.max(movement, pointer.clickEnergy * .42));
  }

  function positionAt(x, y) {
    shockwave.style.transform = `translate3d(${x}px,${y}px,0)`;
  }

  function spawnClickWave(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'astrale-click-wave';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.setAttribute('aria-hidden', 'true');
    document.body.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }

  window.addEventListener('pointermove', event => {
    if (!enabled() || event.pointerType === 'touch') return;
    const now = event.timeStamp || performance.now();
    if (pointer.lastTime) {
      const elapsed = Math.max(8, Math.min(80, now - pointer.lastTime));
      const distance = Math.hypot(event.clientX - pointer.lastX, event.clientY - pointer.lastY);
      const pixelsPerSecond = distance / elapsed * 1000;
      pointer.targetSpeed = Math.max(pointer.targetSpeed, Math.max(0, Math.min(1, (pixelsPerSecond - 28) / 1150)));
    }
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    pointer.lastTime = now;
    pointer.active = true;
    positionAt(event.clientX, event.clientY);
  }, { passive: true });

  document.addEventListener('pointerdown', event => {
    if (!enabled() || event.button !== 0 || event.pointerType === 'touch') return;
    if (event.target.closest?.('button,a,input,label,select,textarea,summary,[role="button"],[contenteditable],video,iframe,dialog')) return;
    pointer.active = true;
    pointer.clickEnergy = Math.min(1, pointer.clickEnergy + .9);
    pointer.targetSpeed = Math.max(pointer.targetSpeed, .35);
    positionAt(event.clientX, event.clientY);
    spawnClickWave(event.clientX, event.clientY);
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => {
    pointer.active = false;
    pointer.lastTime = 0;
    pointer.targetSpeed = 0;
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  reduced.addEventListener('change', () => { if (!enabled()) reset(); });
  finePointer.addEventListener('change', () => { if (!enabled()) reset(); });
  frame = requestAnimationFrame(animate);
})();
