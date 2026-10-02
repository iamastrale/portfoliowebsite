'use strict';
const $ = s => document.querySelector(s);
const projects = [
 {title:'ASTRALE',detail:'Original music · 8 tracks',kind:'music',player:'music'},
 {title:'VALORANT',detail:'Sunset map · Music production',kind:'music',src:'video/work/valorant-sunset-map-music.mov'},
 {title:'Deadline Delivery',detail:'Sound design',kind:'sound',src:'video/work/deadline-delivery.mov'},
 {title:'Deadline Delivery',detail:'Explosion implementation',kind:'sound',src:'video/work/deadline-delivery-explosion.mov'},
 {title:'Apex Legends',detail:'Sound redesign',kind:'sound',src:'video/work/apex-redesign.mp4'},
 {title:'Marathon',detail:'Sound redesign',kind:'sound',src:'video/work/marathon-sound-redesign.mp4'}
];
function renderProjects(filter='all') {
 $('#projects').replaceChildren();
 projects.forEach((p,i)=>{if(filter!=='all'&&p.kind!==filter)return;
 const b=document.createElement('button');b.className='project';b.setAttribute('aria-label','Play '+p.title+' — '+p.detail);
 b.innerHTML=`<svg class="project-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg><span class="project-info"><span><h3>${p.title}</h3><p>${p.detail}</p></span></span><svg class="project-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
 b.onclick=()=>p.player==='music'?window.ASTRALE_MUSIC.open():window.ASTRALE_REEL.open({src:p.src,title:p.title+' / '+p.detail});$('#projects').append(b);});
}
renderProjects();
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',active)});renderProjects(b.dataset.filter)});
const reelPreview=$('#reelHoverPreview');
const startReelPreview=()=>{if(!reelPreview||matchMedia('(prefers-reduced-motion: reduce)').matches)return;reelPreview.play().catch(()=>{})};
const stopReelPreview=()=>{if(reelPreview&&!reelPreview.paused)reelPreview.pause()};
$('#playShowreel').onclick=()=>{stopReelPreview();window.ASTRALE_REEL.open()};
$('#playShowreel').addEventListener('pointerenter',startReelPreview);
$('#playShowreel').addEventListener('pointerleave',stopReelPreview);
$('#playShowreel').addEventListener('focus',startReelPreview);
$('#playShowreel').addEventListener('blur',stopReelPreview);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopReelPreview()});

document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}})});
let enabled=false,volume=.6,ctx,lastHover=0;const sounds={...window.ASTRALE_SOUNDS},activeAudio=new Set();
function stopSounds(){activeAudio.forEach(a=>{a.pause();a.currentTime=0});activeAudio.clear();if(ctx&&ctx.state==='running')ctx.suspend().catch(()=>{})}
function syncSoundLabels(){for(const button of [$('#soundToggle')]){button.setAttribute('aria-pressed',enabled);button.textContent=enabled?'Sound on':'Sound off'}}
function setSound(value,cue=true){enabled=value;window.ASTRALE_AMBIENCE.enable(enabled);syncSoundLabels();if(enabled&&cue)playSound('open');else if(!enabled)stopSounds()}
$('#soundToggle').onclick=()=>setSound(!enabled);

window.addEventListener('atmospherestate',syncSoundLabels);
$('#volume').oninput=e=>{volume=Number(e.target.value);activeAudio.forEach(a=>a.volume=volume)};
function playSound(type,force=false){if((!enabled&&!force)||document.hidden||document.querySelector('dialog[open]'))return;
 if(sounds[type]){const audio=new Audio(sounds[type]);audio.volume=volume;activeAudio.add(audio);audio.onended=()=>activeAudio.delete(audio);audio.play().catch(()=>{activeAudio.delete(audio);$('#soundStatus').textContent='That sound could not play. Please try again.'});return}
 try{ctx??=new (window.AudioContext||window.webkitAudioContext)();ctx.resume();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';const t=ctx.currentTime;osc.frequency.setValueAtTime(type==='hover'?820:type==='click'?440:330,t);osc.frequency.exponentialRampToValueAtTime(type==='open'?660:240,t+.09);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume*.11,t+.005);gain.gain.exponentialRampToValueAtTime(.0001,t+.13);osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.14);osc.onended=()=>{osc.disconnect();gain.disconnect()}}catch{ $('#soundStatus').textContent='Audio is not supported in this browser.' }
}
window.ASTRALE_PLAY_SOUND=playSound;
document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const control=e.target.closest('button,a');if(!control||control.contains(e.relatedTarget))return;const now=performance.now();if(now-lastHover>100){lastHover=now;playSound('hover')}});
document.addEventListener('click',e=>{if(e.target.closest('button,a')&&!e.target.closest('#soundToggle,#playShowreel,.project,[data-view]'))playSound('click')});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSounds()});

// Persistent navigation with cancellable, lightweight screen transitions.
const screenIds=['reel','work','about','credits','settings'];let entered=false,transitionId=0;
const contentPane=document.querySelector('main');
const transitionMotion=matchMedia('(prefers-reduced-motion: reduce)');
let screenAnimation,mosaicTimer;
function clearMosaic(){
 clearTimeout(mosaicTimer);
 document.querySelector('.mosaic-reveal')?.remove();
}
function revealMosaic(){
 clearMosaic();
 const layer=document.createElement('div');
 layer.className='mosaic-reveal';layer.setAttribute('aria-hidden','true');
 const fragment=document.createDocumentFragment();
 for(let i=0;i<48;i++){
   const tile=document.createElement('span');
   tile.style.setProperty('--delay',((i*37%17)*13)+'ms');
   fragment.append(tile);
 }
 layer.append(fragment);document.querySelector('.content-shell').append(layer);
 mosaicTimer=setTimeout(clearMosaic,650);
}
async function showView(id,focus=true){
 if(!screenIds.includes(id))id='reel';
 const revision=++transitionId;
 clearMosaic();
 screenAnimation?.cancel();
 contentPane.hidden=false;
 document.querySelectorAll('[data-view]').forEach(a=>{
   if(a.dataset.view===id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
 });
 const next=document.getElementById(id),previous=document.querySelector('.view:not([hidden])');
 const canAnimate=!transitionMotion.matches&&typeof next.animate==='function';
 if(previous&&previous!==next&&canAnimate){
   previous.inert=true;
   screenAnimation=previous.animate([
     {opacity:1,transform:'translateX(0)',filter:'blur(0)'},
     {opacity:0,transform:'translateX(-10px)',filter:'blur(3px)'}
   ],{duration:140,easing:'ease-in',fill:'forwards'});
   try{await screenAnimation.finished}catch{}
   if(revision!==transitionId)return;
 }
 if(revision!==transitionId)return;
 screenAnimation?.cancel();
 document.querySelectorAll('.view').forEach(v=>{v.hidden=v!==next;v.inert=v!==next});
 contentPane.scrollTop=0;
 window.dispatchEvent(new CustomEvent('astraleviewopen',{detail:{id}}));
 if(focus)next.querySelector('h2,button,a')?.focus({preventScroll:true});
 if(canAnimate&&previous!==next){
   revealMosaic();
   screenAnimation=next.animate([
     {opacity:0,transform:'translateX(16px)',filter:'blur(4px)'},
     {opacity:.8,offset:.65,transform:'translateX(2px)',filter:'blur(.7px)'},
     {opacity:1,transform:'translateX(0)',filter:'blur(0)'}
   ],{duration:320,easing:'cubic-bezier(.16,1,.3,1)'});
   try{await screenAnimation.finished}catch{}
 }
}
function navigate(id,focus=true){history.pushState(null,'','#'+id);showView(id,focus)}
function enter(id='reel'){
 if(entered||document.body.classList.contains('booting'))return;
 entered=true;window.ASTRALE_AMBIENCE.enable(enabled);
 document.querySelector('#experience').inert=false;
 navigate(id);playSound('open');
}
document.querySelectorAll('[data-view]').forEach(a=>a.addEventListener('click',e=>{
 e.preventDefault();
 if(entered){navigate(a.dataset.view);playSound('open')}else enter(a.dataset.view);
}));

// Game-menu keyboard controls. Arrow navigation stays out of forms and media controls.
const navigationItems=[...document.querySelectorAll('.game-nav [data-view]')];
document.addEventListener('keydown',event=>{
 const target=event.target;
 const inForm=target.closest('input,textarea,select,[contenteditable="true"],.cinema-controls');
 if(document.querySelector('dialog[open]')||inForm)return;
 const key=event.key;
 if((key===' '||key==='Spacebar')&&target.matches('.game-nav a')){
   event.preventDefault();target.click();return;
 }
 const direction=key==='ArrowUp'||key==='ArrowLeft'?-1:key==='ArrowDown'||key==='ArrowRight'?1:0;
 const edge=key==='Home'?0:key==='End'?navigationItems.length-1:-1;
 if(!direction&&edge<0)return;
 event.preventDefault();
 const active=document.querySelector('.game-nav [data-view][aria-current="page"]');
 let index=Math.max(0,navigationItems.indexOf(active));
 index=edge>=0?edge:(index+direction+navigationItems.length)%navigationItems.length;
 const item=navigationItems[index];
 if(!entered)enter(item.dataset.view);else{navigate(item.dataset.view,false);playSound('open')}
 item.focus({preventScroll:true});
});

window.addEventListener('hashchange',()=>{if(entered)showView(location.hash.slice(1))});
document.querySelector('.brand')?.addEventListener('click',e=>{e.preventDefault();navigate('reel')});
if(document.body.classList.contains('booting'))window.addEventListener('bootcomplete',()=>{
 setSound(true,false);enter(location.hash.slice(1)||'reel');
},{once:true});
else{setSound(true,false);enter(location.hash.slice(1)||'reel')}
