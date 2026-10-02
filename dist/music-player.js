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
  let waveformData = new Uint8Array(256);
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
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = .88;
        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        waveformData = new Uint8Array(analyser.fftSize);
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
    if (analyser) analyser.getByteTimeDomainData(waveformData);
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    const wash = context.createRadialGradient(width * .5, height * .5, 0, width * .5, height * .5, Math.max(width, height) * .52);
    wash.addColorStop(0, 'rgba(89,160,190,.17)');
    wash.addColorStop(.58, 'rgba(13,27,39,.08)');
    wash.addColorStop(1, 'rgba(7,15,23,0)');
    context.fillStyle = wash;
    context.fillRect(0, 0, width, height);
    const left = width * .075;
    const right = width * .925;
    const centerY = height * .48;
    const span = right - left;

    context.lineWidth = Math.max(1, width / 1300);
    context.strokeStyle = 'rgba(135,190,211,.09)';
    context.shadowBlur = 0;
    for (let column = 0; column <= 12; column++) {
      const x = left + span * column / 12;
      context.beginPath();context.moveTo(x, height * .16);context.lineTo(x, height * .79);context.stroke();
    }
    for (let row = 0; row <= 6; row++) {
      const y = height * (.16 + row * .105);
      context.beginPath();context.moveTo(left, y);context.lineTo(right, y);context.stroke();
    }
    context.strokeStyle = 'rgba(217,34,50,.2)';
    context.beginPath();context.moveTo(left, centerY);context.lineTo(right, centerY);context.stroke();

    const traces = reduced.matches ? 1 : 6;
    for (let depth = traces - 1; depth >= 0; depth--) {
      const depthRatio = depth / Math.max(1, traces - 1);
      const inset = span * depthRatio * .045;
      const traceLeft = left + inset;
      const traceRight = right - inset;
      const traceCenter = centerY - depth * height * .022;
      const amplitude = height * .18 * (1 - depthRatio * .28);
      context.beginPath();
      const points = 180;
      for (let point = 0; point < points; point++) {
        const ratio = point / (points - 1);
        const sampleIndex = Math.min(waveformData.length - 1, Math.floor(ratio * waveformData.length));
        const sample = analyser ? (waveformData[sampleIndex] - 128) / 128 : Math.sin(ratio * Math.PI * 8 + phase * 1.8) * .12;
        const x = traceLeft + (traceRight - traceLeft) * ratio;
        const y = traceCenter + sample * amplitude;
        if (!point) context.moveTo(x, y); else context.lineTo(x, y);
      }
      const main = depth === 0;
      context.lineWidth = main ? Math.max(1.6, width / 800) : Math.max(.7, width / 1600);
      context.strokeStyle = main ? 'rgba(229,247,252,.94)' : `rgba(112,196,225,${.08 + (1 - depthRatio) * .15})`;
      context.shadowBlur = main ? Math.min(15, width / 70) : 0;
      context.shadowColor = main ? 'rgba(119,216,244,.7)' : 'transparent';
      context.stroke();
    }

    const sweepX = left + span * ((phase * .1) % 1);
    const sweep = context.createLinearGradient(sweepX - width * .035, 0, sweepX + width * .012, 0);
    sweep.addColorStop(0, 'rgba(217,34,50,0)');
    sweep.addColorStop(1, 'rgba(217,34,50,.32)');
    context.fillStyle = sweep;
    context.fillRect(sweepX - width * .035, height * .16, width * .047, height * .63);
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
      window.ASTRALE_PLAY_SOUND?.('videoLoad');
      dialog.showModal();
      resizeCanvas();
      startVisualization();
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
