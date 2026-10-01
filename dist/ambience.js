// Bake the overlap once, then let Web Audio loop it sample-accurately.
// Detune changes pitch and speed together, including the crossfade region.
(() => {
  let context, master, source, bufferPromise, wanted=false, level=.6;
  let targetCents=0, ducked=false, preparing=null, gainTarget=null, fadeInSeconds=.7;
  const noteBuffers=new Map(),voices=new Set();
  let lastNote=-1,noteEpoch=0;
  function loadNote(index){
    if(!noteBuffers.has(index)){
      const loading=fetch('sounds/notes/note'+(index+1)+'.mp3')
        .then(r=>{if(!r.ok)throw Error('Note unavailable');return r.arrayBuffer()})
        .then(data=>context.decodeAudioData(data))
        .catch(error=>{noteBuffers.delete(index);throw error});
      noteBuffers.set(index,loading);
    }
    return noteBuffers.get(index);
  }
  function releaseNotes(){
    noteEpoch++;
    for(const voice of voices){
      const now=context.currentTime;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(0,now,.025);
      voice.node.stop(now+.15);
    }
  }
  async function playNote(){
    const clickedAt=performance.now(),epoch=noteEpoch;
    if(!wanted||ducked||!source||document.hidden)return;

    // Avoid immediately repeating the same note.
    const index=lastNote<0?Math.floor(Math.random()*8):(lastNote+1+Math.floor(Math.random()*7))%8;
    lastNote=index;
    try{
      const buffer=await loadNote(index);
      if(epoch!==noteEpoch||!wanted||ducked||context.state!=='running'||performance.now()-clickedAt>500)return;
      // Keep every new press responsive: retire the oldest tail at capacity.
      if(voices.size>=4){
        const oldest=voices.values().next().value;
        voices.delete(oldest);
        oldest.gain.gain.cancelScheduledValues(context.currentTime);
        oldest.gain.gain.setTargetAtTime(0,context.currentTime,.008);
        oldest.node.stop(context.currentTime+.04);
      }
      const node=context.createBufferSource(),gain=context.createGain();
      node.buffer=buffer;
      node.detune.value=source.detune.value;
      node.detune.setTargetAtTime(targetCents,context.currentTime,.35);
      gain.gain.setValueAtTime(0,context.currentTime);
      gain.gain.linearRampToValueAtTime(.45,context.currentTime+.012);
      node.connect(gain);gain.connect(master);
      const voice={node,gain};voices.add(voice);
      node.onended=()=>{voices.delete(voice);node.disconnect();gain.disconnect()};
      node.start();
      window.dispatchEvent(new CustomEvent('astralenote',{detail:{index}}));
    }catch{/* An unavailable note must not interrupt navigation or ambience. */}
  }
  document.addEventListener('pointerdown',event=>{
    if(event.button!==0||document.body.classList.contains('boot-running')||document.body.classList.contains('booting'))return;
    if(document.querySelector('dialog[open]')||event.target.closest('button,a,input,label,select,textarea,summary,[role="button"],[contenteditable],video,iframe'))return;

    playNote();
  });
  const status = text => { document.getElementById('ambienceStatus').textContent=text; };
  const report = () => window.dispatchEvent(new CustomEvent('atmospherestate'));
  function makeLoop(raw, seconds=4) {
    const overlap=Math.min(Math.round(seconds*raw.sampleRate),Math.floor(raw.length/4));
    const length=raw.length-overlap;
    const loop=context.createBuffer(raw.numberOfChannels,length,raw.sampleRate);
    let peak=0;
    for(let channel=0;channel<raw.numberOfChannels;channel++) {
      const input=raw.getChannelData(channel),output=loop.getChannelData(channel);
      // Tail -> head equal-power blend, followed by the untouched middle.
      for(let i=0;i<overlap;i++) {
        const angle=i/(overlap-1)*Math.PI/2;
        output[i]=input[length+i]*Math.cos(angle)+input[i]*Math.sin(angle);
      }
      output.set(input.subarray(overlap,length),overlap);
      for(let i=0;i<length;i++)peak=Math.max(peak,Math.abs(output[i]));
    }
    if(peak>.98)for(let channel=0;channel<loop.numberOfChannels;channel++){
      const data=loop.getChannelData(channel);for(let i=0;i<data.length;i++)data[i]*=.98/peak;
    }
    status(`Atmosphere ready · ${(overlap/raw.sampleRate).toFixed(1)} s crossfade`);
    return loop;
  }
  function updateGain(){
    if(!master||!source)return;
    const gain=master.gain,now=context.currentTime;
    const target=wanted&&!ducked?level:0;
    // Repeated focus/recovery events must not restart an in-progress fade.
    if(target===gainTarget)return;
    gainTarget=target;
    // A finite ramp reaches exact silence, unlike an asymptotic target.
    // Hold the instantaneous gain so rapid open/close actions never jump.
    const current=gain.value;
    if(typeof gain.cancelAndHoldAtTime==='function')gain.cancelAndHoldAtTime(now);
    else gain.cancelScheduledValues(now);
    // Anchor the ramp at this handoff, not at an older automation event.
    gain.setValueAtTime(current,now);
    const duration=target===0?.45:fadeInSeconds;
    if(target>0&&duration>1){
      // Ease gently out of silence; a linear amplitude fade feels front-loaded.
      for(let step=1;step<=48;step++){
        const progress=step/48;
        const eased=progress*progress*(3-2*progress);
        gain.linearRampToValueAtTime(current+(target-current)*eased,now+duration*progress);
      }
    }else gain.linearRampToValueAtTime(target,now+duration);
    if(target>0)fadeInSeconds=.7;
  }
  async function prepare(){
    if(!context||context.state==='closed'){
      context=new AudioContext();source=null;gainTarget=null;master=context.createGain();master.gain.value=0;master.connect(context.destination);
      context.addEventListener('statechange',()=>{
        report();
        if(context.state==='running')updateGain();
        else if(context.state==='interrupted'&&wanted)recover();
      });
    }
    for(let index=0;index<8;index++)loadNote(index).catch(()=>{});
    // Autoplay can be denied until a gesture. Still decode and prepare the loop.
    context.resume().catch(()=>{});
    if(!bufferPromise){
      status('Loading atmosphere…');
      bufferPromise=fetch('sounds/atmosphere.mp3').then(r=>{if(!r.ok)throw Error('Audio unavailable');return r.arrayBuffer()}).then(b=>context.decodeAudioData(b)).then(makeLoop).catch(e=>{bufferPromise=null;throw e});
    }
    const buffer=await bufferPromise;
    if(!source){
      const next=context.createBufferSource();next.buffer=buffer;
      next.loop=true;next.loopStart=0;next.loopEnd=buffer.duration;
      next.detune.value=targetCents;next.connect(master);source=next;
      next.onended=()=>{next.disconnect();if(source===next){source=null;if(wanted)recover()}};
      next.start();
    }
    updateGain();
    report();
  }
  function recover(){
    if(!wanted)return;
    if(context&&context.state!=='closed'&&context.state!=='running')context.resume().catch(()=>{});
    if(!preparing)preparing=prepare().catch(()=>status('Audio paused by the browser. Click Sound on to resume.')).finally(()=>{preparing=null});
    return preparing;
  }
  window.ASTRALE_AMBIENCE={
    enable(value){if(!value)releaseNotes();wanted=value;if(value)recover();else updateGain();report()},
    isPlaying(){return wanted&&context?.state==='running'&&!!source},
    duck(value,seconds=.7){if(value)releaseNotes();ducked=value;if(!value)fadeInSeconds=seconds;updateGain()},
    volume(value){level=Math.max(0,Math.min(.6,Number(value)));updateGain()}
  };
  document.getElementById('ambientVolume').addEventListener('input',e=>window.ASTRALE_AMBIENCE.volume(e.target.value));
  window.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch')return;
    targetCents=Math.max(0,Math.min(100,e.clientX/innerWidth*100));
    if(source)source.detune.setTargetAtTime(targetCents,context.currentTime,.35);
    for(const voice of voices)voice.node.detune.setTargetAtTime(targetCents,context.currentTime,.35);
    document.getElementById('pitchValue').textContent=`+${Math.round(targetCents)} cents`;
  },{passive:true});
  // Never suspend merely because the tab is hidden: ambience keeps looping.
  // A browser/OS interruption may still require a new user gesture to resume.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)recover()});
  window.addEventListener('focus',recover);
  window.addEventListener('pageshow',recover);
  const gestureRecovery=e=>{if(e.target.closest?.('#soundToggle,#titleAudio'))return;if(wanted&&context?.state!=='running')recover()};
  document.addEventListener('pointerdown',gestureRecovery,{passive:true});
  document.addEventListener('keydown',gestureRecovery);
})();
