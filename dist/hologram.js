// Interactive holographic field: bounded motion, cached geometry, no WebGL.
(() => {
  const canvas = document.getElementById('hologram');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!context) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = {
    x: 0, y: 0, targetX: 0, targetY: 0,
    screenX: innerWidth * .5, screenY: innerHeight * .5,
    targetScreenX: innerWidth * .5, targetScreenY: innerHeight * .5,
    lastInputX: 0, lastInputY: 0, lastInputTime: 0,
    speed: 0, targetSpeed: 0, active: false
  };
  let width = 1;
  let height = 1;
  let frame = 0;
  let last = 0;
  let phase = 0;
  let pulse = 0;
  let rings = 30;
  let steps = 104;
  let unitCircle = [];
  let ripples = [];
  let lastVelocitySignal = -1;

  function configureGeometry() {
    const small = width < 700;
    const short = height < 760;
    rings = small ? 20 : short ? 25 : 30;
    steps = small ? 76 : short ? 90 : 104;
    unitCircle = Array.from({ length: steps + 1 }, (_, index) => {
      const progress = index / steps;
      const foldAngle = progress * Math.PI * 2.65 - Math.PI * .3;
      return [progress, Math.sin(progress * Math.PI), Math.sin(foldAngle), Math.cos(foldAngle)];
    });
  }

  function resize() {
    width = innerWidth;
    height = innerHeight;
    const scale = Math.min(devicePixelRatio || 1, 1.25, 1800 / Math.max(1, width));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    configureGeometry();
    draw(performance.now());
  }

  function colorForRing(position, seam, depth, evolution) {
    const distance = Math.min(Math.abs(position - seam), 1 - Math.abs(position - seam));
    const accent = Math.exp(-(distance * distance) / .0055) * (.38 + evolution * .42 + pulse * .25);
    const red = Math.round(81 + accent * 136);
    const green = Math.round(137 - accent * 103);
    const blue = Math.round(165 - accent * 112);
    const alpha = .22 + depth * .22 + evolution * .12 + accent * .27;
    return `rgba(${red},${green},${blue},${alpha})`;
  }

  function drawMesh() {
    const small = width < 700;
    const movement = pointer.speed;
    const evolution = movement * movement * (3 - 2 * movement);
    const size = Math.min(width * (small ? .63 : .4), height * .54) * (1 + evolution * .22);
    const centerX = width * ((small ? .72 : .84) - evolution * (small ? .04 : .09)) + pointer.x * (small ? 5 : 12);
    const centerY = height * ((small ? .34 : .3) + evolution * (small ? .04 : .055)) + pointer.y * (small ? 4 : 9);
    const yaw = -.28;
    const tilt = -.46;
    const cosineYaw = Math.cos(yaw);
    const sineYaw = Math.sin(yaw);
    const cosineTilt = Math.cos(tilt);
    const sineTilt = Math.sin(tilt);
    const seam = (phase * .08) % 1;

    function surfacePoint(sample, band) {
      const [progress, envelope, sineFold, cosineFold] = sample;
      const idleBreath = Math.sin(progress * Math.PI * 5 + phase * .22) * .006;
      const idleX = (progress - .5) * 1.08 + idleBreath;
      const idleY = sineFold * .17 + band * .12 * envelope;
      const idleZ = cosineFold * .15 + band * .24 * envelope;

      const evolvingWave = Math.sin(progress * Math.PI * 3.2 + phase * 1.8);
      const secondaryWave = Math.cos(progress * Math.PI * 5.4 - phase * 1.25);
      const turbulence = movement * Math.sin(progress * Math.PI * 12 + band * 3.5 + phase * 3.4) * .055;
      const openX = (progress - .5) * 1.65 + turbulence * .35;
      const openY = evolvingWave * (.15 + movement * .19) + band * .16 * envelope + pointer.y * .08 * envelope;
      const openZ = secondaryWave * (.2 + movement * .14) + band * .31 * envelope + pointer.x * .08 * envelope + turbulence;
      const noteWave = pulse * Math.sin(progress * Math.PI * 7 - phase * 1.7 + band * 2) * .018;

      const x = idleX + (openX - idleX) * evolution;
      const y = idleY + (openY - idleY) * evolution + noteWave;
      const z = idleZ + (openZ - idleZ) * evolution;
      const yawX = x * cosineYaw + z * sineYaw;
      const yawZ = -x * sineYaw + z * cosineYaw;
      const projectedY = y * cosineTilt - yawZ * sineTilt;
      const depth = y * sineTilt + yawZ * cosineTilt;
      const perspective = 2.7 / (2.7 - depth);
      return [centerX + yawX * size * perspective, centerY + projectedY * size * perspective, depth];
    }

    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (let ring = 0; ring < rings; ring++) {
      const position = ring / Math.max(1, rings - 1);
      const band = position * 2 - 1;
      let depthTotal = 0;
      context.beginPath();
      for (let step = 0; step <= steps; step++) {
        const point = surfacePoint(unitCircle[step], band);
        depthTotal += Math.max(0, Math.min(1, (point[2] + .8) / 1.6));
        if (!step) context.moveTo(point[0], point[1]); else context.lineTo(point[0], point[1]);
      }
      const averageDepth = depthTotal / (steps + 1);
      context.strokeStyle = colorForRing(position, seam, averageDepth, evolution);
      context.lineWidth = .68 + averageDepth * .46 + evolution * .13;
      context.stroke();
    }

    const crossSections = small ? 10 : 15;
    for (let section = 1; section < crossSections; section++) {
      const step = Math.round(section / crossSections * steps);
      context.beginPath();
      for (let ring = 0; ring < rings; ring++) {
        const band = ring / Math.max(1, rings - 1) * 2 - 1;
        const point = surfacePoint(unitCircle[step], band);
        if (!ring) context.moveTo(point[0], point[1]); else context.lineTo(point[0], point[1]);
      }
      const progress = section / crossSections;
      const signalDistance = Math.abs(progress - ((phase * .1) % 1));
      const signal = Math.exp(-(signalDistance * signalDistance) / .008) * evolution;
      context.strokeStyle = signal > .12 ? `rgba(217,34,50,${.15 + signal * .3})` : `rgba(77,137,164,${.12 + evolution * .1})`;
      context.lineWidth = .62;
      context.stroke();
    }

    const halo = context.createRadialGradient(centerX, centerY, size * .04, centerX, centerY, size * (.66 + evolution * .45));
    halo.addColorStop(0, 'rgba(111,181,207,.035)');
    halo.addColorStop(.64, 'rgba(96,161,188,.018)');
    halo.addColorStop(1, 'rgba(217,34,50,0)');
    context.fillStyle = halo;
    context.beginPath();
    context.arc(centerX, centerY, size * (.68 + evolution * .45), 0, Math.PI * 2);
    context.fill();
  }

  function drawPointerLens() {
    if (!pointer.active || reduced.matches) return;
    const radius = 17 + pulse * 5 + pointer.speed * 11;
    context.save();
    context.translate(pointer.screenX, pointer.screenY);
    context.strokeStyle = 'rgba(69,126,151,.22)';
    context.lineWidth = .75;
    context.beginPath();
    context.arc(0, 0, radius, -.2, 1.25);
    context.arc(0, 0, radius, Math.PI - .2, Math.PI + 1.25);
    context.stroke();
    context.strokeStyle = 'rgba(217,34,50,.32)';
    context.beginPath();
    context.arc(0, 0, radius + 4, -.12, .34);
    context.stroke();
    context.fillStyle = 'rgba(53,103,126,.38)';
    context.fillRect(-1, -1, 2, 2);
    context.restore();
  }

  function drawRipples(now) {
    ripples = ripples.filter(ripple => now - ripple.started < 950);
    for (const ripple of ripples) {
      const progress = Math.min(1, (now - ripple.started) / 950);
      const eased = 1 - Math.pow(1 - progress, 3);
      const radius = 20 + eased * 92;
      const alpha = (1 - progress) * .22;
      context.strokeStyle = `rgba(73,139,166,${alpha})`;
      context.lineWidth = .8;
      context.beginPath();
      context.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      context.stroke();
      context.strokeStyle = `rgba(217,34,50,${alpha * .8})`;
      context.beginPath();
      context.arc(ripple.x, ripple.y, radius * .68, -.65, .35);
      context.stroke();
    }
  }

  function draw(now = performance.now()) {
    context.clearRect(0, 0, width, height);
    drawMesh();
    drawRipples(now);
    drawPointerLens();
  }

  function animate(now) {
    frame = requestAnimationFrame(animate);
    if (now - last < 1000 / 30) return;
    const delta = Math.min((now - last) / 1000, .06);
    last = now;
    phase += delta * (.07 + pointer.speed * 2.65);
    pulse *= Math.exp(-delta * 2.65);
    pointer.targetSpeed *= Math.exp(-delta * 7.5);
    const easing = 1 - Math.pow(.001, delta);
    const speedEasing = 1 - Math.pow(pointer.targetSpeed > pointer.speed ? .00008 : .008, delta);
    pointer.speed += (pointer.targetSpeed - pointer.speed) * speedEasing;
    pointer.x += (pointer.targetX - pointer.x) * easing;
    pointer.y += (pointer.targetY - pointer.y) * easing;
    pointer.screenX += (pointer.targetScreenX - pointer.screenX) * easing;
    pointer.screenY += (pointer.targetScreenY - pointer.screenY) * easing;
    if (Math.abs(pointer.speed - lastVelocitySignal) > .006 || (pointer.speed < .006 && lastVelocitySignal !== 0)) {
      const amount = pointer.speed < .006 ? 0 : Math.min(1, pointer.speed);
      lastVelocitySignal = amount;
      window.dispatchEvent(new CustomEvent('astralevelocity', { detail: { amount, cents: amount * 100 } }));
    }
    draw(now);
  }

  function sync() {
    cancelAnimationFrame(frame);
    if (!document.hidden && !reduced.matches) {
      last = performance.now();
      frame = requestAnimationFrame(animate);
    } else draw();
  }

  window.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType === 'touch') return;
    const now = event.timeStamp || performance.now();
    if (pointer.lastInputTime) {
      const elapsed = Math.max(8, Math.min(80, now - pointer.lastInputTime));
      const distance = Math.hypot(event.clientX - pointer.lastInputX, event.clientY - pointer.lastInputY);
      const pixelsPerSecond = distance / elapsed * 1000;
      const normalized = Math.max(0, Math.min(1, (pixelsPerSecond - 35) / 1250));
      pointer.targetSpeed = Math.max(pointer.targetSpeed, normalized);
    }
    pointer.lastInputX = event.clientX;
    pointer.lastInputY = event.clientY;
    pointer.lastInputTime = now;
    pointer.active = true;
    pointer.targetX = event.clientX / width * 2 - 1;
    pointer.targetY = event.clientY / height * 2 - 1;
    pointer.targetScreenX = event.clientX;
    pointer.targetScreenY = event.clientY;
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => {
    pointer.active = false;
    pointer.lastInputTime = 0;
    pointer.targetSpeed = 0;
    pointer.targetX = 0;
    pointer.targetY = 0;
  });

  document.addEventListener('pointerdown', event => {
    if (reduced.matches || event.target.closest('button,a,input,label,dialog')) return;
    pointer.active = true;
    pointer.targetX = event.clientX / width * 2 - 1;
    pointer.targetY = event.clientY / height * 2 - 1;
    pointer.targetScreenX = event.clientX;
    pointer.targetScreenY = event.clientY;
    pulse = Math.min(1, pulse + .34);
    ripples.push({ x: event.clientX, y: event.clientY, started: performance.now() });
    if (ripples.length > 3) ripples.shift();
  }, { passive: true });

  window.addEventListener('astralenote', () => {
    if (!reduced.matches) pulse = Math.min(1, pulse + .5);
  });
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);

  resize();
  sync();
})();
