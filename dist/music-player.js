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
  let lowPass;
  let silentMonitor;
  let source;
  let waveformData = new Uint8Array(1024);
  const smoothedWave = new Float32Array(240);
  let animationFrame = 0;
  let lastFrame = 0;
  let openingRevision = 0;
  let wantsPlaying = false;
  let playPromise = null;

  function status(text = '') {
    message.textContent = text;
    message.hidden = !text;
  }

  function ensureAudioGraph() {
    try {
      audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
      if (!source) {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = .93;
        lowPass = audioContext.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.value = 210;
        lowPass.Q.value = .65;
        silentMonitor = audioContext.createGain();
        silentMonitor.gain.value = 0;
        source = audioContext.createMediaElementSource(audio);
        source.connect(audioContext.destination);
        source.connect(lowPass);
        lowPass.connect(analyser);
        analyser.connect(silentMonitor);
        silentMonitor.connect(audioContext.destination);
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
    lastFrame = now;
    resizeCanvas();
    if (analyser) analyser.getByteTimeDomainData(waveformData);
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    const left = width * .075;
    const span = width * .85;
    const centerY = height * .38;
    context.beginPath();
    for (let point = 0; point < 240; point++) {
      const ratio = point / 239;
      const sampleIndex = Math.min(waveformData.length - 1, Math.floor(ratio * waveformData.length));
      let target = 0;
      if (analyser && !audio.paused && !reduced.matches) {
        let total = 0;
        let count = 0;
        for (let offset = -5; offset <= 5; offset++) {
          const index = Math.max(0, Math.min(waveformData.length - 1, sampleIndex + offset));
          total += waveformData[index];
          count++;
        }
        target = Math.max(-1, Math.min(1, ((total / count) - 128) / 128 * 1.65));
      }
      smoothedWave[point] += (target - smoothedWave[point]) * .18;
      const x = left + span * ratio;
      const y = centerY + smoothedWave[point] * height * .24;
      if (!point) context.moveTo(x, y); else context.lineTo(x, y);
    }
    const line = context.createLinearGradient(left, 0, left + span, 0);
    line.addColorStop(0, 'rgba(72,184,190,.18)');
    line.addColorStop(.45, 'rgba(34,129,136,.9)');
    line.addColorStop(1, 'rgba(72,184,190,.18)');
    context.lineWidth = Math.max(2.6, width / 420);
    context.strokeStyle = line;
    context.shadowBlur = Math.min(12, width / 90);
    context.shadowColor = 'rgba(72,184,190,.34)';
    context.stroke();
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
    play.innerHTML = wantsPlaying ? icons.pause : icons.play;
    play.setAttribute('aria-label', wantsPlaying ? 'Pause' : 'Play');
    mute.innerHTML = audio.muted || audio.volume === 0 ? icons.muted : icons.sound;
    mute.setAttribute('aria-label', audio.muted || audio.volume === 0 ? 'Unmute music' : 'Mute music');
    seek.disabled = !ready;
    seek.max = ready ? audio.duration : 100;
    seek.value = audio.currentTime || 0;
    seek.style.setProperty('--fill', (ready ? audio.currentTime / audio.duration * 100 : 0) + '%');
    volume.style.setProperty('--fill', (audio.muted ? 0 : audio.volume * 100) + '%');
    time.textContent = clock(audio.currentTime) + ' / ' + clock(audio.duration);
  }

  function requestPlayback(shouldPlay) {
    wantsPlaying = shouldPlay;
    status();
    sync();
    if (!shouldPlay) {
      audio.pause();
      return;
    }
    ensureAudioGraph();
    if (playPromise) return;
    playPromise = audio.play()
      .catch(error => {
        if (error?.name !== 'AbortError' && wantsPlaying) {
          wantsPlaying = false;
          status('Press play to start the track.');
        }
      })
      .finally(() => {
        playPromise = null;
        if (wantsPlaying && audio.paused) requestPlayback(true);
        else sync();
      });
  }

  function setTrack(index, autoplay = true) {
    current = (index + tracks.length) % tracks.length;
    const [name, path] = tracks[current];
    wantsPlaying = false;
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
    if (autoplay) requestPlayback(true);
  }

  function buildTrackList() {
    const fragment = document.createDocumentFragment();
    tracks.forEach(([name], index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = `<small>${String(index + 1).padStart(2, '0')}</small><span>${name}</span><i aria-hidden="true">●</i>`;
      button.setAttribute('aria-label', 'Play ' + name);
      button.onclick = () => setTrack(index);
      fragment.append(button);
    });
    trackList.append(fragment);
  }

  function toggle() { requestPlayback(!wantsPlaying); }

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
    requestPlayback(false);
    audio.currentTime = 0;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    openingRevision++;
    window.ASTRALE_PLAYER_TRANSITION?.clearMenuTransition();
    window.ASTRALE_AMBIENCE.duck(false);
    opening = false;
  });

  window.ASTRALE_MUSIC = {
    async open() {
      if (opening || dialog.open) return;
      opening = true;
      const revision = ++openingRevision;
      ensureAudioGraph();
      setTrack(current, false);
      window.ASTRALE_PLAY_SOUND?.('videoClick');
      window.ASTRALE_AMBIENCE.duck(true);
      await window.ASTRALE_PLAYER_TRANSITION.fragmentMenu();
      if (revision !== openingRevision) return;
      window.ASTRALE_PLAY_SOUND?.('videoLoad');
      dialog.showModal();
      resizeCanvas();
      startVisualization();
      if (!reduced.matches) shell.animate([
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 180, easing: 'ease-out' });
      await wait(reduced.matches ? 0 : 180);
      if (!dialog.open || revision !== openingRevision) return;
      requestPlayback(true);
      opening = false;
    }
  };

  buildTrackList();
  play.innerHTML = icons.play;
  previous.innerHTML = icons.previous;
  next.innerHTML = icons.next;
  mute.innerHTML = icons.sound;
  title.textContent = tracks[0][0];
  number.textContent = '01 / ' + String(tracks.length).padStart(2, '0');
  trackList.firstElementChild?.classList.add('active');
  trackList.firstElementChild?.setAttribute('aria-current', 'true');
  sync();
  new ResizeObserver(resizeCanvas).observe(canvas);
})();
