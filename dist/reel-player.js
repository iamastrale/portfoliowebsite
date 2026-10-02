(() => {
 const dialog=document.getElementById('reelPlayer'),video=document.getElementById('reelVideo');
 const shell=dialog.querySelector('.cinema-shell'),play=document.getElementById('reelPlay'),center=document.getElementById('reelCenterPlay');
 const seek=document.getElementById('reelSeek'),volume=document.getElementById('reelVolume'),mute=document.getElementById('reelMute');
 const time=document.getElementById('reelTime'),full=document.getElementById('reelFullscreen'),message=document.getElementById('reelMessage');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const canvas=document.createElement('canvas');canvas.width=32;canvas.height=18;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 let glow=!reduced.matches,timer=null,revealTimer,revealLayer,revealAnimation,opening=false,menuFragments;
 const wait=duration=>new Promise(resolve=>setTimeout(resolve,duration));
 function clearReveal(){
   clearTimeout(revealTimer);revealLayer?.remove();revealLayer=null;
   shell.classList.remove('cinema-glitch');
   revealAnimation?.cancel();revealAnimation=null;
 }
 function reveal(){
   clearReveal();
   if(reduced.matches)return;
   revealLayer=document.createElement('div');
   revealLayer.className='mosaic-reveal cinema-mosaic';
   shell.classList.add('cinema-glitch');revealLayer.setAttribute('aria-hidden','true');
   const fragment=document.createDocumentFragment();
   for(let i=0;i<220;i++){
     const tile=document.createElement('span');
     const accent=Math.random();
     tile.style.setProperty('--x',(Math.random()*98).toFixed(2)+'%');
     tile.style.setProperty('--y',(Math.random()*96).toFixed(2)+'%');
     tile.style.setProperty('--tile-width',(0.45+Math.random()*2.1).toFixed(2)+'%');
     tile.style.setProperty('--tile-height',(0.7+Math.random()*4.2).toFixed(2)+'%');
     tile.style.setProperty('--delay',Math.floor(Math.random()*210)+'ms');
     tile.style.setProperty('--tile-duration',(170+Math.floor(Math.random()*210))+'ms');
     tile.style.setProperty('--tile-scale',(0.35+Math.random()*.55).toFixed(2));
     tile.style.setProperty('--tile-y',(0.25+Math.random()*.75).toFixed(2));
     tile.style.setProperty('--tile-color',accent>.94?'#d92232':accent>.86?'#9fd2e7':accent>.68?'#cbd8e1':'#edf3f8');
     fragment.append(tile);
   }
   revealLayer.append(fragment);shell.append(revealLayer);
   if(shell.animate)revealAnimation=shell.animate([
     {transform:'scale(.72)',opacity:.35},
     {transform:'scale(1.035)',opacity:1,offset:.58},
     {transform:'scale(.99)',opacity:1,offset:.78},
     {transform:'scale(1)',opacity:1}
   ],{duration:470,easing:'cubic-bezier(.16,1,.3,1)'});
   revealTimer=setTimeout(clearReveal,650);
 }
 function clearMenuTransition(){
   menuFragments?.remove();menuFragments=null;
   document.getElementById('experience')?.classList.remove('reel-fragmenting','reel-menu-suspended');
   document.body.classList.remove('reel-transition-dark');
 }
 async function fragmentMenu(){
   const experience=document.getElementById('experience');
   if(!experience||reduced.matches)return;
   menuFragments=document.createElement('div');
   menuFragments.className='menu-fragmentation';menuFragments.setAttribute('aria-hidden','true');
   const targets=experience.querySelectorAll('.experience-title,.game-nav,.content-shell');
   const fragment=document.createDocumentFragment();
   targets.forEach((target,targetIndex)=>{
     const rect=target.getBoundingClientRect();
     const amount=target.classList.contains('content-shell')?46:target.classList.contains('game-nav')?30:20;
     for(let i=0;i<amount;i++){
       const shard=document.createElement('i');
       const x=rect.left+Math.random()*rect.width,y=rect.top+Math.random()*rect.height;
       const width=6+Math.random()*(targetIndex===2?42:28),height=2+Math.random()*11;
       const direction=x<innerWidth/2?-1:1;
       shard.style.cssText=`--x:${x}px;--y:${y}px;--w:${width}px;--h:${height}px;--dx:${direction*(55+Math.random()*190)}px;--dy:${-85+Math.random()*170}px;--turn:${-35+Math.random()*70}deg;--delay:${Math.random()*145}ms;--tone:${Math.random()};`;
       fragment.append(shard);
     }
   });
   menuFragments.append(fragment);document.body.append(menuFragments);
   experience.classList.add('reel-fragmenting');document.body.classList.add('reel-transition-dark');
   await wait(820);
   experience.classList.add('reel-menu-suspended');menuFragments.remove();menuFragments=null;
   await wait(260);
 }
 const clock=s=>Math.floor((s||0)/60)+':'+String(Math.floor((s||0)%60)).padStart(2,'0');
 function status(text=''){message.textContent=text;message.hidden=!text}
 const icon=body=>'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+body+'</svg>';
 const icons={
   play:icon('<path fill="currentColor" d="M8 5v14l11-7z"/>'),
   pause:icon('<path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/>'),
   sound:icon('<path d="M11 5 6 9H3v6h3l5 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" fill="none" stroke="currentColor" stroke-width="1.6"/>'),
   muted:icon('<path d="M11 5 6 9H3v6h3l5 4zM16 9l6 6m0-6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/>'),
   fullscreen:icon('<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" fill="none" stroke="currentColor" stroke-width="1.8"/>')
 };
 center.innerHTML=icons.play;full.innerHTML=icons.fullscreen;
 function sync(){
   play.innerHTML=video.paused?icons.play:icons.pause;play.setAttribute('aria-label',video.paused?'Play':'Pause');
   center.hidden=!video.paused;
   time.textContent=clock(video.currentTime)+' / '+clock(video.duration);
   const ready=Number.isFinite(video.duration)&&video.duration>0;
   seek.disabled=!ready;seek.max=ready?video.duration:100;seek.value=video.currentTime;
   seek.setAttribute('aria-valuetext',clock(video.currentTime)+' of '+clock(video.duration));
   mute.innerHTML=video.muted||video.volume===0?icons.muted:icons.sound;
   mute.setAttribute('aria-label',video.muted||video.volume===0?'Unmute video':'Mute video');
   seek.style.setProperty('--fill',(ready?video.currentTime/video.duration*100:0)+'%');
   volume.style.setProperty('--fill',(video.muted?0:video.volume*100)+'%');
 }
 function clearGlow(){for(const edge of ['top','right','bottom','left'])shell.style.setProperty('--glow-'+edge,'transparent')}
 function stopSampling(){clearInterval(timer);timer=null}
 function sample(){
   if(!glow||!ctx||document.hidden||video.readyState<2)return;
   try{
     ctx.drawImage(video,0,0,32,18);
     const pixels=ctx.getImageData(0,0,32,18).data;
     for(const [edge,x0,y0,x1,y1] of [['top',0,0,32,4],['right',28,0,32,18],['bottom',0,14,32,18],['left',0,0,4,18]]){
       let r=0,g=0,b=0,n=0;
       for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*32+x)*4;r+=pixels[i];g+=pixels[i+1];b+=pixels[i+2];n++}
       shell.style.setProperty('--glow-'+edge,'rgba('+Math.round(r/n)+','+Math.round(g/n)+','+Math.round(b/n)+',.65)');
     }
   }catch{glow=false;stopSampling();clearGlow();sync()}
 }
 function sampling(){stopSampling();if(glow&&dialog.open&&!document.hidden){sample();if(!video.paused)timer=setInterval(sample,125)}}
 async function toggle(){if(!video.paused){video.pause();return}status();try{await video.play()}catch{status('Press play to start the showreel.')}}
 play.onclick=toggle;center.onclick=toggle;video.onclick=toggle;
 seek.oninput=()=>{video.currentTime=Number(seek.value);sync()};
 volume.oninput=()=>{video.volume=Number(volume.value);video.muted=false;sync()};
 mute.onclick=()=>{if(video.volume===0){video.volume=1;volume.value=1;video.muted=false}else video.muted=!video.muted;sync()};

 full.onclick=async()=>{
   try{
     if(document.fullscreenElement)await document.exitFullscreen();
     else if(shell.requestFullscreen)await shell.requestFullscreen();
     else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();
     else status('Fullscreen is not available in this browser.');
   }catch{status('Fullscreen is not available right now.')}
 };
 document.addEventListener('fullscreenchange',()=>full.setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen'));
 for(const event of ['loadedmetadata','timeupdate','volumechange','ended'])video.addEventListener(event,sync);
 video.addEventListener('play',()=>{status();sync();sampling()});
 video.addEventListener('pause',()=>{sync();stopSampling()});
 video.addEventListener('seeked',sample);
 video.addEventListener('playing',()=>status());
 video.addEventListener('error',()=>{status('Video could not load. Please close the player and try again.');stopSampling();window.ASTRALE_AMBIENCE.duck(false)});
 document.addEventListener('visibilitychange',sampling);
 reduced.addEventListener('change',()=>{if(reduced.matches){clearReveal();glow=false;stopSampling();clearGlow();sync()}});
 dialog.addEventListener('keydown',event=>{
   if(event.target.closest('input,button'))return;
   if(event.key===' '||event.key==='k'){event.preventDefault();toggle()}
   if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();if(Number.isFinite(video.duration))video.currentTime=Math.max(0,Math.min(video.duration,video.currentTime+(event.key==='ArrowRight'?5:-5)))}
 });
 dialog.addEventListener('close',()=>{
   video.pause();stopSampling();clearGlow();clearReveal();
   shell.classList.remove('cinema-preroll','cinema-ready');clearMenuTransition();opening=false;
   if(document.fullscreenElement===shell)document.exitFullscreen().catch(()=>{});
   window.ASTRALE_AMBIENCE.duck(false);
 });
 window.ASTRALE_REEL={async open(){
 if(opening||dialog.open)return;
   opening=true;window.ASTRALE_PLAY_SOUND?.('videoClick');status();video.pause();video.currentTime=0;window.ASTRALE_AMBIENCE.duck(true);sync();
   await fragmentMenu();
   window.ASTRALE_PLAY_SOUND?.('videoLoad');
   shell.classList.add('cinema-preroll');dialog.showModal();sync();reveal();
   await wait(reduced.matches?120:690);
   shell.classList.remove('cinema-preroll');shell.classList.add('cinema-ready');
   await wait(reduced.matches?80:360);
   video.play().catch(()=>status('Press play to start the showreel.'));
   opening=false;
 }};
 sync();
})();
