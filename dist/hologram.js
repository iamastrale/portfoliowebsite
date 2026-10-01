// A procedural wire surface: Canvas 2D, bounded geometry, no WebGL/dependencies.
(() => {
  const canvas = document.getElementById('hologram');
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let width = 1, height = 1, frame = 0, last = 0, phase = 0, pulse = 0;
  function resize() {
    width = innerWidth; height = innerHeight;
    const scale = Math.min(devicePixelRatio || 1, 1.25, 1800 / width);
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    draw();
  }
  function draw() {
    context.clearRect(0, 0, width, height);
    const small = width < 700;
    const size = Math.min(width * (small ? .64 : .36), height * .52);
    const cx = width * (small ? .65 : .72), cy = height * .48;
    const tilt = -.55 + pointer.y * .3;
    const turn = phase * .17 + pointer.x * .48;
    const ct = Math.cos(turn), st = Math.sin(turn), cp = Math.cos(tilt), sp = Math.sin(tilt);
    const gradient = context.createLinearGradient(cx - size, cy - size, cx + size, cy + size);
    gradient.addColorStop(0, 'rgba(75,119,145,.14)');
    gradient.addColorStop(.36, 'rgba(83,137,169,.5)');
    gradient.addColorStop(.65, 'rgba(117,163,187,.42)');
    gradient.addColorStop(1, 'rgba(217,34,50,.3)');
    context.strokeStyle = gradient; context.lineWidth = .75 + pulse * .45;
    const rings = small ? 22 : 34, steps = small ? 84 : 112;
    for (let ring = 0; ring < rings; ring++) {
      const v = ring / rings * Math.PI * 2;
      context.beginPath();
      for (let step = 0; step <= steps; step++) {
        const u = step / steps * Math.PI * 2;
        const breathing = Math.sin(u * 3 + phase * .7 + v * 2) * .075;
        const radius = .66 + Math.cos(v + u * 2) * .24 + breathing + pulse * .055 * Math.sin(u * 5 + v * 3 - phase * 8);
        const x = Math.cos(u) * radius;
        const y = Math.sin(u) * radius;
        const z = Math.sin(v + u * 2) * .27 + Math.cos(u * 3 - phase * .4) * .1;
        const rx = x * ct + z * st, rz = -x * st + z * ct;
        const ry = y * cp - rz * sp, depth = y * sp + rz * cp;
        const perspective = 2.5 / (2.5 - depth);
        const px = cx + rx * size * perspective + pointer.x * 22;
        const py = cy + ry * size * perspective + pointer.y * 16;
        if (step === 0) context.moveTo(px, py); else context.lineTo(px, py);
      }
      context.stroke();
    }
  }
  function animate(now) {
    frame = requestAnimationFrame(animate);
    if (now - last < 1000 / 30) return;
    const delta = Math.min((now - last) / 1000, .06); last = now;
    phase += delta;
    pulse *= Math.exp(-delta * 2.6);
    pointer.x += (pointer.targetX - pointer.x) * .065;
    pointer.y += (pointer.targetY - pointer.y) * .065;
    draw();
  }
  function sync() {
    cancelAnimationFrame(frame);
    if (!document.hidden && !reduced.matches) { last = performance.now(); frame = requestAnimationFrame(animate); }
    else draw();
  }
  window.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType === 'touch') return;
    pointer.targetX = event.clientX / width * 2 - 1;
    pointer.targetY = event.clientY / height * 2 - 1;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer.targetX = pointer.targetY = 0; });
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  window.addEventListener('astralenote',()=>{if(!reduced.matches)pulse=Math.min(1.6,pulse+.9)});
  resize(); sync();
})();
