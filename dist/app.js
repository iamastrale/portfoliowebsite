'use strict';
const $ = s => document.querySelector(s);
const projects = [
 {title:'ASTRALE',detail:'Artist',meta:'',kind:'music',player:'music',thumb:'social-preview.png'},
 {title:'VALORANT',detail:'Music Producer · Sunset Map',meta:'',kind:'music',src:'video/work/valorant-sunset-map-music.mp4',thumb:'images/work/thumbnails/valorant.jpg'},
 {title:'CODE RED',detail:'Gameplay',meta:'Lead Sound Designer · Composer',kind:'sound',src:'video/work/code-red-gameplay.mov?v=gameplay-2026-10-20',preview:'video/work/code-red-gameplay.mov?v=gameplay-2026-10-20'},
 {title:'CODE RED',detail:'Slot Machine Audio Implementation',meta:'Lead Sound Designer · Composer',kind:'sound',src:'video/work/code-red-slot-machine.mp4',preview:'video/work/code-red-slot-machine.mp4'},
 {title:'Deadline Delivery',detail:'Gameplay',meta:'Lead Sound Designer · Composer',kind:'sound',src:'video/work/deadline-delivery.mp4',thumb:'images/work/thumbnails/deadline-delivery.jpg'},
 {title:'Deadline Delivery',detail:'Velocity-Driven Doppler System',meta:'',kind:'technical',player:'technical',src:'video/work/deadline-doppler-pass-01.mp4',thumb:'images/work/thumbnails/deadline-doppler.jpg'},
 {title:'Apex Legends',detail:'Sound Redesign',meta:'',kind:'sound',src:'video/work/apex-redesign.mp4',thumb:'images/work/thumbnails/apex.jpg'},
 {title:'Marathon',detail:'Sound Redesign',meta:'',kind:'sound',src:'video/work/marathon-sound-redesign.mp4',thumb:'images/work/thumbnails/marathon.jpg'}
];
const projectGlyphs={
 sound:'<svg class="project-play" viewBox="0 0 28 24" aria-hidden="true"><circle cx="14" cy="12" r="2" fill="currentColor"/><path d="M10.2 8.2a5.4 5.4 0 0 0 0 7.6m7.6-7.6a5.4 5.4 0 0 1 0 7.6M6.8 4.8a10.2 10.2 0 0 0 0 14.4m14.4-14.4a10.2 10.2 0 0 1 0 14.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
 technical:'<svg class="project-play" viewBox="0 0 28 24" aria-hidden="true"><path d="M6 6h8v6h8M14 9v9" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="6" r="2.5" fill="currentColor"/><circle cx="23" cy="12" r="2.5" fill="currentColor"/><circle cx="14" cy="19" r="2.5" fill="currentColor"/></svg>',
 music:'<svg class="project-play" viewBox="0 0 28 24" aria-hidden="true"><rect x="3" y="9" width="3" height="6" rx="1" fill="currentColor"/><rect x="8" y="5" width="3" height="14" rx="1" fill="currentColor"/><rect x="13" y="8" width="3" height="8" rx="1" fill="currentColor"/><rect x="18" y="3" width="3" height="18" rx="1" fill="currentColor"/><rect x="23" y="10" width="2" height="4" rx="1" fill="currentColor"/></svg>'
};
const projectGroupNames={sound:'Sound Design',technical:'Technical Audio',music:'Music'};
const workKinds=['sound','technical','music'];
let currentWorkFilter='sound';
function makeProject(p){
 const b=document.createElement('button');b.className='project project-'+p.kind;b.dataset.kind=p.kind;b.setAttribute('aria-label','Play '+p.title+' — '+p.detail);
 const thumbnail=p.preview?`<video class="project-thumbnail project-preview-video" muted loop playsinline autoplay preload="metadata" aria-hidden="true" tabindex="-1"><source src="${p.preview}"></video>`:p.thumb?`<img class="project-thumbnail" src="${p.thumb}" alt="" loading="lazy" decoding="async" aria-hidden="true">`:'';
 const meta=p.meta?`<small>${p.meta}</small>`:'';
 b.innerHTML=`${thumbnail}${projectGlyphs[p.kind]}<span class="project-info"><h3>${p.title}</h3><p>${p.detail}</p>${meta}</span>`;
 b.onclick=()=>p.player==='music'?window.ASTRALE_MUSIC.open():p.player==='technical'?openTechnicalCase():window.ASTRALE_REEL.open({src:p.src,title:p.title+' / '+p.detail});
 return b;
}
function renderProjects(filter=currentWorkFilter) {
 if(!workKinds.includes(filter))filter='sound';
 currentWorkFilter=filter;
 const container=$('#projects');container.replaceChildren();
 const headingWrap=$('#work .section-heading');
 headingWrap.hidden=true;
 $('#work').classList.add('work-browser-view');
 container.className='projects work-browser projects-filtered-'+filter;

 const nav=document.createElement('nav');nav.className='work-category-nav';nav.setAttribute('aria-label','Work categories');nav.setAttribute('role','tablist');
 for(const kind of workKinds){
  const button=document.createElement('button');button.type='button';button.className='work-category work-category-'+kind+(kind===filter?' active':'');button.dataset.workKind=kind;button.setAttribute('role','tab');button.setAttribute('aria-selected',String(kind===filter));button.setAttribute('aria-controls','work-project-panel');
  button.innerHTML=projectGlyphs[kind].replace('project-play','work-category-icon')+'<span><strong>'+projectGroupNames[kind]+'</strong></span>';
  button.onclick=()=>{renderProjects(kind);document.querySelector('[data-work-kind="'+kind+'"]')?.focus({preventScroll:true})};
  nav.append(button);
 }

 const panel=document.createElement('section');panel.id='work-project-panel';panel.className='work-project-panel work-project-panel-'+filter;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-label',projectGroupNames[filter]);
 const grid=document.createElement('div');grid.className='work-project-grid';
 projects.filter(project=>project.kind===filter).forEach(project=>grid.append(makeProject(project)));
 panel.append(grid);container.append(nav,panel);
}
renderProjects();
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
const technicalCase=$('#technicalCaseStudy');
const blueprintLightbox=$('#blueprintLightbox');
const expandBlueprint=$('#expandBlueprint');
expandBlueprint.onclick=()=>{
 if(blueprintLightbox.open)return;
 blueprintLightbox.showModal();
 blueprintLightbox.querySelector('.close').focus({preventScroll:true});
};
blueprintLightbox.addEventListener('close',()=>expandBlueprint.focus({preventScroll:true}));
const technicalIcons={
 play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
 pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
 sound:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
 muted:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4zM16 9l6 6m0-6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
 fullscreen:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
};
const technicalClock=seconds=>Math.floor((seconds||0)/60)+':'+String(Math.floor((seconds||0)%60)).padStart(2,'0');
technicalCase.querySelectorAll('.technical-player').forEach(player=>{
 const video=player.querySelector('video'),playButtons=[...player.querySelectorAll('[data-tech-play]')],seek=player.querySelector('[data-tech-seek]'),time=player.querySelector('[data-tech-time]'),mute=player.querySelector('[data-tech-mute]'),full=player.querySelector('[data-tech-full]');
 const sync=()=>{
  playButtons.forEach(button=>button.innerHTML=video.paused?technicalIcons.play:technicalIcons.pause);
  playButtons.forEach(button=>button.setAttribute('aria-label',video.paused?'Play video':'Pause video'));
  player.querySelector('.technical-center-play').hidden=!video.paused;
  const ready=Number.isFinite(video.duration)&&video.duration>0;
  seek.disabled=!ready;seek.max=ready?video.duration:100;seek.value=video.currentTime;
  seek.style.setProperty('--fill',(ready?video.currentTime/video.duration*100:0)+'%');
  time.textContent=technicalClock(video.currentTime)+' / '+technicalClock(video.duration);
  mute.innerHTML=video.muted||video.volume===0?technicalIcons.muted:technicalIcons.sound;
  mute.setAttribute('aria-label',video.muted?'Unmute video':'Mute video');
 };
 const toggle=()=>{if(video.paused){technicalCase.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause()});video.play().catch(()=>{})}else video.pause()};
 playButtons.forEach(button=>button.onclick=toggle);
 video.onclick=toggle;
 seek.oninput=()=>{video.currentTime=Number(seek.value);sync()};
 mute.onclick=()=>{video.muted=!video.muted;sync()};
 full.onclick=()=>{if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else if(player.requestFullscreen)player.requestFullscreen().catch(()=>{})};
 for(const event of ['loadedmetadata','timeupdate','play','pause','volumechange','ended'])video.addEventListener(event,sync);
 video.addEventListener('contextmenu',event=>event.preventDefault());
 video.addEventListener('dragstart',event=>event.preventDefault());
 full.innerHTML=technicalIcons.fullscreen;sync();
});
function openTechnicalCase(){
 if(technicalCase.open)return;
 window.ASTRALE_PLAY_SOUND?.('videoClick');
 technicalCase.showModal();
 technicalCase.querySelector('video')?.focus({preventScroll:true});
}
technicalCase.addEventListener('close',()=>{
 technicalCase.querySelectorAll('video').forEach(video=>video.pause());
});
let enabled=false,volume=.6,ctx,lastHover=0;const sounds={...window.ASTRALE_SOUNDS},activeAudio=new Set();
function stopSounds(){activeAudio.forEach(a=>{a.pause();a.currentTime=0});activeAudio.clear();if(ctx&&ctx.state==='running')ctx.suspend().catch(()=>{})}
function syncSoundLabels(){for(const button of [$('#soundToggle')]){button.setAttribute('aria-pressed',enabled);button.textContent=enabled?'Interface sound on':'Interface sound off'}}
function setSound(value,cue=true){enabled=value;syncSoundLabels();if(enabled&&cue)playSound('open');else if(!enabled)stopSounds()}
$('#soundToggle').onclick=()=>setSound(!enabled);
$('#volume').oninput=e=>{volume=Number(e.target.value);activeAudio.forEach(a=>a.volume=volume)};
function playSound(type,force=false){if((!enabled&&!force)||document.hidden||document.querySelector('dialog[open]'))return;
 if(sounds[type]){const audio=new Audio(sounds[type]);audio.volume=volume;activeAudio.add(audio);audio.onended=()=>activeAudio.delete(audio);audio.play().catch(()=>activeAudio.delete(audio));return}
 try{ctx??=new (window.AudioContext||window.webkitAudioContext)();ctx.resume();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';const t=ctx.currentTime;osc.frequency.setValueAtTime(type==='hover'?820:type==='click'?440:330,t);osc.frequency.exponentialRampToValueAtTime(type==='open'?660:240,t+.09);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume*.11,t+.005);gain.gain.exponentialRampToValueAtTime(.0001,t+.13);osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.14);osc.onended=()=>{osc.disconnect();gain.disconnect()}}catch{}
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
 if(id==='work')renderProjects();
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
function enter(id='reel',cue=true){
 if(entered)return;
 entered=true;
 document.querySelector('#experience').inert=false;
 navigate(id);if(cue)playSound('open');
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
setSound(true,false);enter(location.hash.slice(1)||'reel',false);
