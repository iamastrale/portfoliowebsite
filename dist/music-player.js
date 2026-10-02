(() => {
  const dialog = document.getElementById('musicPlayer');
  if (!dialog) return;

  const shell = dialog.querySelector('.music-shell');
  const audio = document.getElementById('musicAudio');
  const canvas = document.getElementById('musicVisualizer');
  const context = canvas.getContext('2d', { alpha: true });
  const title = document.getElementById('musicTrackTitle');
  const number = document.getElementById('musicTrackNumber');
  const play = document.getElementById('musicPlay');
  const previous = document.getElementById('musicPrevious');
  const next = document.getElementById('musicNext');
  const seek = document.getElementById('musicSeek');
  const time = document.getElementById('musicTime');
  const mute = document.getElementById('musicMute');
  const volume = document.getElementById('musicVolume');
  const message = document.getElementById('musicMessage');
  const trackList = document.getElementById('musicTrackList');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tracks = [
    ['Frisson', 'audio/music/1-frisson.mp3'],
    ['Chroma', 'audio/music/2-chroma.mp3'],
    ['Quantum', 'audio/music/3-quantum.mp3'],
    ['Data Hive', 'audio/music/4-data-hive.mp3'],
    ['Oxygen', 'audio/music/5-oxygen.mp3'],
    ['Aero', 'audio/music/6-aero.mp3'],
    ['Cryo', 'audio/music/7-cryo.mp3'],
    ['Neon', 'audio/music/8-neon.mp3']
  ];
  const wait = duration => new Promise(resolve => setTimeout(resolve, duration));
  const clock = value => Math.floor((value || 0) / 60) + ':' + String(Math.floor((value || 0) % 60)).padStart(2, '0');
  const icon = body => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + body + '</svg>';
  const icons = {
    play: icon('<path fill="currentColor" d="M8 5v14l11-7z"/>'),
    pause: icon('<path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/>'),
    previous: icon('<path d="M7 5v14M19 6l-10 6 10 6z" fill="none" stroke="currentColor" stroke-width="1.7"/>'),
    next: icon('<path d="M17 5v14M5 6l10 6-10 6z" fill="none" stroke="currentColor" stroke-width="1.7"/>'),
    sound: icon('<path d="M11 5 6 9H3v6h3l5 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" fill="none" stroke="currentColor" stroke-width="1.6"/>'),
    muted: icon('<path d="M11 5 6 9H3v6h3l5 4zM16 9l6 6m0-6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/>')
  };
  let current = 0;
  let opening = false;
  let audioContext;
  let analyser;
  let source;
  let frequencyData = new Uint8Array(96);
  let animationFrame = 0;
  let lastFrame = 0;
  let phase = 0;
  let revealLayer;
  let revealTimer;

  function status(text = '') {
    message.textContent = text;
    message.hidden = !text;
  }

  function ensureAudioGraph() {
    try {
      audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
      if (!source) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = .88;
        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        frequencyData = new Uint8Array(analyser.frequencyBinCount);
      }
      audioContext.resume().catch(() => {});
    } catch {
      analyser = null;
    }
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(devicePixelRatio || 1, 1.35);
    const width = Math.max(1, Math.round(bounds.width * scale));
    const height = Math.max(1, Math.round(bounds.height * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function projectPoint(x, y, z, width, height) {
    const turn = phase * .13;
    const tilt = -.42;
    const ct = Math.cos(turn), st = Math.sin(turn), cp = Math.cos(tilt), sp = Math.sin(tilt);
    const rx = x * ct + z * st;
    const rz = -x * st + z * ct;
    const ry = y * cp - rz * sp;
    const depth = y * sp + rz * cp;
    const perspective = 2.65 / (2.65 - depth);
    const size = Math.min(width, height) * .31;
    return [width * .5 + rx * size * perspective, height * .5 + ry * size * perspective, perspective];
  }

  function amplitude(index) {
    if (!analyser) return .12 + Math.sin(phase * 1.2 + index) * .025;
    return frequencyData[index % frequencyData.length] / 255;
  }

  function draw(now = 0) {
    animationFrame = 0;
    if (!dialog.open) return;
    if (now - lastFrame < 1000 / 30) {
      animationFrame = requestAnimationFrame(draw);
      return;
    }
    const delta = Math.min((now - lastFrame) / 1000, .06);
    lastFrame = now;
    if (!reduced.matches) phase += delta * (audio.paused ? .35 : .75);
    resizeCanvas();
    if (analyser) analyser.getByteFrequencyData(frequencyData);
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    const wash = context.createRadialGradient(width * .5, height * .5, 0, width * .5, height * .5, Math.max(width, height) * .52);
    wash.addColorStop(0, 'rgba(89,160,190,.17)');
    wash.addColorStop(.58, 'rgba(13,27,39,.08)');
    wash.addColorStop(1, 'rgba(7,15,23,0)');
    context.fillStyle = wash;
    context.fillRect(0, 0, width, height);
    context.lineWidth = Math.max(1, width / 1200);
    context.shadowBlur = Math.min(12, width / 85);

    const latitudeCount = 12;
    const longitudeSteps = 52;
    for (let latitude = 1; latitude < latitudeCount; latitude++) {
      const phi = latitude / latitudeCount * Math.PI;
      const energy = amplitude(latitude * 5);
      context.beginPath();
      for (let step = 0; step <= longitudeSteps; step++) {
        const theta = step / longitudeSteps * Math.PI * 2;
        const bin = latitude * 4 + step;
        const ripple = (amplitude(bin) - .2) * .16 + Math.sin(theta * 3 + phase + phi * 2) * .025;
        const radius = .86 + ripple;
        const x = Math.sin(phi) * Math.cos(theta) * radius;
        const y = Math.cos(phi) * radius;
        const z = Math.sin(phi) * Math.sin(theta) * radius;
        const point = projectPoint(x, y, z, width, height);
        if (!step) context.moveTo(point[0], point[1]); else context.lineTo(point[0], point[1]);
      }
      const alpha = .17 + energy * .4;
      context.strokeStyle = latitude % 4 === 0 ? `rgba(217,34,50,${alpha})` : `rgba(135,207,231,${alpha})`;
      context.shadowColor = latitude % 4 === 0 ? 'rgba(217,34,50,.35)' : 'rgba(91,194,228,.3)';
      context.stroke();
    }

    const longitudeCount = 15;
    const latitudeSteps = 38;
    for (let longitude = 0; longitude < longitudeCount; longitude++) {
      const theta = longitude / longitudeCount * Math.PI * 2;
      const energy = amplitude(longitude * 6 + 8);
      context.beginPath();
      for (let step = 0; step <= latitudeSteps; step++) {
        const phi = step / latitudeSteps * Math.PI;
        const ripple = (amplitude(longitude * 5 + step) - .18) * .14 + Math.sin(phi * 4 - phase * .8 + theta) * .022;
        const radius = .86 + ripple;
        const x = Math.sin(phi) * Math.cos(theta) * radius;
        const y = Math.cos(phi) * radius;
        const z = Math.sin(phi) * Math.sin(theta) * radius;
        const point = projectPoint(x, y, z, width, height);
        if (!step) context.moveTo(point[0], point[1]); else context.lineTo(point[0], point[1]);
      }
      context.strokeStyle = `rgba(137,205,229,${.12 + energy * .34})`;
      context.shadowColor = 'rgba(84,190,226,.28)';
      context.stroke();
    }
    context.shadowBlur = 0;
    if (!reduced.matches && dialog.open) animationFrame = requestAnimationFrame(draw);
  }

  function startVisualization() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrame = 0;
    animationFrame = requestAnimationFrame(draw);
  }

  function sync() {
    const ready = Number.isFinite(audio.duration) && audio.duration > 0;
    play.innerHTML = audio.paused ? icons.play : icons.pause;
    play.setAttribute('aria-label', audio.paused ? 'Play' : 'Pause');
    mute.innerHTML = audio.muted || audio.volume === 0 ? icons.muted : icons.sound;
    mute.setAttribute('aria-label', audio.muted || audio.volume === 0 ? 'Unmute music' : 'Mute music');
    seek.disabled = !ready;
    seek.max = ready ? audio.duration : 100;
    seek.value = audio.currentTime || 0;
    seek.style.setProperty('--fill', (ready ? audio.currentTime / audio.duration * 100 : 0) + '%');
    volume.style.setProperty('--fill', (audio.muted ? 0 : audio.volume * 100) + '%');
    time.textContent = clock(audio.currentTime) + ' / ' + clock(audio.duration);
  }

  function setTrack(index, autoplay = true) {
    current = (index + tracks.length) % tracks.length;
    const [name, path] = tracks[current];
    audio.pause();
    audio.src = path;
    audio.load();
    title.textContent = name;
    number.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(tracks.length).padStart(2, '0');
    [...trackList.children].forEach((button, buttonIndex) => {
      button.classList.toggle('active', buttonIndex === current);
      button.setAttribute('aria-current', buttonIndex === current ? 'true' : 'false');
    });
    status();
    sync();
    if (autoplay) audio.play().catch(() => status('Press play to start the track.'));
  }

  function buildTrackList() {
    const fragment = document.createDocumentFragment();
    tracks.forEach(([name], index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = `<small>${String(index + 1).padStart(2, '0')}</small><span>${name}</span><i aria-hidden="true">↗</i>`;
      button.setAttribute('aria-label', 'Play ' + name);
      button.onclick = () => setTrack(index);
      fragment.append(button);
    });
    trackList.append(fragment);
  }

  function reveal() {
    revealLayer?.remove();
    clearTimeout(revealTimer);
    if (reduced.matches) return;
    revealLayer = document.createElement('div');
    revealLayer.className = 'mosaic-reveal cinema-mosaic music-mosaic';
    revealLayer.setAttribute('aria-hidden', 'true');
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 82; index++) {
      const tile = document.createElement('span');
      tile.style.setProperty('--x', (Math.random() * 98).toFixed(2) + '%');
      tile.style.setProperty('--y', (Math.random() * 96).toFixed(2) + '%');
      tile.style.setProperty('--tile-width', (.5 + Math.random() * 2).toFixed(2) + '%');
      tile.style.setProperty('--tile-height', (.8 + Math.random() * 4).toFixed(2) + '%');
      tile.style.setProperty('--delay', Math.floor(Math.random() * 200) + 'ms');
      tile.style.setProperty('--tile-duration', (190 + Math.floor(Math.random() * 190)) + 'ms');
      tile.style.setProperty('--tile-scale', (.35 + Math.random() * .55).toFixed(2));
      tile.style.setProperty('--tile-y', (.3 + Math.random() * .7).toFixed(2));
      tile.style.setProperty('--tile-color', Math.random() > .9 ? '#d92232' : '#dceaf1');
      fragment.append(tile);
    }
    revealLayer.append(fragment);
    shell.append(revealLayer);
    shell.animate([
      { transform: 'scale(.76)', opacity: .2 },
      { transform: 'scale(1.025)', opacity: 1, offset: .66 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)' });
    revealTimer = setTimeout(() => { revealLayer?.remove(); revealLayer = null; }, 680);
  }

  async function toggle() {
    ensureAudioGraph();
    status();
    if (audio.paused) await audio.play().catch(() => status('Press play to start the track.'));
    else audio.pause();
  }

  play.onclick = toggle;
  previous.onclick = () => setTrack(current - 1);
  next.onclick = () => setTrack(current + 1);
  seek.oninput = () => { audio.currentTime = Number(seek.value); sync(); };
  volume.oninput = () => { audio.volume = Number(volume.value); audio.muted = false; sync(); };
  mute.onclick = () => { audio.muted = !audio.muted; sync(); };
  for (const event of ['loadedmetadata', 'timeupdate', 'volumechange', 'play', 'pause']) audio.addEventListener(event, sync);
  audio.addEventListener('ended', () => setTrack(current + 1));
  audio.addEventListener('error', () => status('This track could not load. Please try another track.'));
  dialog.addEventListener('keydown', event => {
    if (event.target.closest('input,button')) return;
    if (event.key === ' ' || event.key === 'k') { event.preventDefault(); toggle(); }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      if (Number.isFinite(audio.duration)) audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + (event.key === 'ArrowRight' ? 5 : -5)));
    }
  });
  dialog.addEventListener('close', () => {
    audio.pause();
    audio.currentTime = 0;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    shell.classList.remove('music-preroll', 'music-ready');
    revealLayer?.remove();
    window.ASTRALE_PLAYER_TRANSITION?.clearMenuTransition();
    window.ASTRALE_AMBIENCE.duck(false);
    opening = false;
  });

  window.ASTRALE_MUSIC = {
    async open() {
      if (opening || dialog.open) return;
      opening = true;
      ensureAudioGraph();
      setTrack(current, false);
      window.ASTRALE_PLAY_SOUND?.('videoClick');
      window.ASTRALE_AMBIENCE.duck(true);
      await window.ASTRALE_PLAYER_TRANSITION.fragmentMenu();
      shell.classList.add('music-preroll');
      dialog.showModal();
      resizeCanvas();
      startVisualization();
      window.ASTRALE_PLAY_SOUND?.('videoLoad');
      reveal();
      await wait(reduced.matches ? 120 : 690);
      shell.classList.remove('music-preroll');
      shell.classList.add('music-ready');
      await wait(reduced.matches ? 80 : 360);
      audio.play().catch(() => status('Press play to start the track.'));
      opening = false;
    }
  };

  buildTrackList();
  play.innerHTML = icons.play;
  previous.innerHTML = icons.previous;
  next.innerHTML = icons.next;
  mute.innerHTML = icons.sound;
  setTrack(0, false);
  new ResizeObserver(resizeCanvas).observe(canvas);
})();
