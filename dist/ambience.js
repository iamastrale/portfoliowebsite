// Bake the overlap once, then let Web Audio loop it sample-accurately.
// Detune changes pitch and speed together, including the crossfade region.
(() => {
  let context, master, source, bufferPromise, wanted=false, level=.22;
  let targetCents=0, ducked=false, preparing=null;
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
  function updateGain(){if(master)master.gain.setTargetAtTime(wanted&&!ducked?level:0,context.currentTime,.25)}
  async function prepare(){
    if(!context||context.state==='closed'){
      context=new AudioContext();source=null;master=context.createGain();master.gain.value=0;master.connect(context.destination);
      context.addEventListener('statechange',()=>{
        report();
        if(context.state==='running')updateGain();
        else if(context.state==='interrupted'&&wanted)recover();
      });
    }
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
    enable(value){wanted=value;if(value)recover();else updateGain();report()},
    isPlaying(){return wanted&&context?.state==='running'&&!!source},
    duck(value){ducked=value;updateGain()},
    volume(value){level=Math.max(0,Math.min(.6,Number(value)));updateGain()}
  };
  document.getElementById('ambientVolume').addEventListener('input',e=>window.ASTRALE_AMBIENCE.volume(e.target.value));
  window.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch')return;
    targetCents=Math.max(0,Math.min(100,e.clientX/innerWidth*100));
    if(source)source.detune.setTargetAtTime(targetCents,context.currentTime,.35);
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
