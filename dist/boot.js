// A short visual introduction, independent of audio, embeds, or network readiness.
(() => {
  const overlay=document.getElementById('bootSequence');
  const menu=document.getElementById('titleScreen');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const startup=new Audio(window.ASTRALE_SOUNDS?.startup||'sounds/startup.mp3');
  startup.preload='auto';startup.volume=.2;
  let startedAt;
  let started=false,finished=false,cleaned=false,finishTimer,cleanupTimer,fadeFrame,playing=false,pending=false;
  function stopStartup(){
    cancelAnimationFrame(fadeFrame);startup.pause();
    document.removeEventListener('pointerdown',tryStartup);
    document.removeEventListener('keydown',tryStartup);
  }
  async function tryStartup(){
    if(finished||playing||pending||document.hidden)return;
    pending=true;
    try{
      // A gesture during the intro joins the cue at the matching timestamp.
      startup.currentTime=(performance.now()-startedAt)/1000;
      await startup.play();
      if(cleaned)startup.pause();else playing=true;
    }catch{/* Autoplay denial must never delay the visual intro. */}
    finally{pending=false}
  }
  function fadeStartup(){
    const from=startup.volume,start=performance.now();
    function frame(now){
      const progress=Math.min(1,(now-start)/700);
      startup.volume=from*(1-progress);
      if(progress<1)fadeFrame=requestAnimationFrame(frame);else stopStartup();
    }
    fadeFrame=requestAnimationFrame(frame);
  }
  function cleanup(){
    cleaned=true;stopStartup();
    clearTimeout(cleanupTimer);overlay.remove();
    document.body.classList.remove('boot-running');
    window.dispatchEvent(new Event('bootcomplete'));
  }
  function finish(immediate=false){
    if(finished)return;finished=true;clearTimeout(finishTimer);
    document.removeEventListener('keydown',skip);
    reduced.removeEventListener('change',preferenceChanged);
    document.body.classList.remove('booting');menu.inert=false;
    window.ASTRALE_AMBIENCE?.duck(false,2.4);
    if(immediate)cleanup();else{fadeStartup();overlay.classList.add('boot-exit');cleanupTimer=setTimeout(cleanup,720)}
  }
  function skip(e){if(started&&e.key==='Escape'){e.preventDefault();finish(true)}}
  function preferenceChanged(){if(started&&reduced.matches)finish(true)}
  document.addEventListener('keydown',skip);
  reduced.addEventListener('change',preferenceChanged);
  document.getElementById('startBoot').addEventListener('click',()=>{
    if(started)return;
    started=true;startedAt=performance.now();
    document.getElementById('startBoot').hidden=true;
    overlay.setAttribute('aria-label','Starting Astrale');
    document.body.classList.add('boot-running');
    // Unlock the atmosphere in this gesture, but keep it silent until the reveal.
    window.ASTRALE_AMBIENCE?.duck(true);
    window.ASTRALE_AMBIENCE?.enable(true);
    tryStartup();
    finishTimer=setTimeout(()=>finish(),2200);
  });
})();
