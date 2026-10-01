'use strict';
const $ = s => document.querySelector(s);
const projects = [
 {title:'VALORANT',detail:'Sunset map · Music production',kind:'music',video:'96z6Kg4r_IE'},
 {title:'Deadline Delivery',detail:'Trailer · Sound design & composition',kind:'sound',video:'xaNMYG0I_Lw'},
 {title:'Apex Legends',detail:'Sound redesign',kind:'sound',video:'sy8lc9iooEE'},
 {title:'Valley of the Ancient',detail:'Wwise implementation',kind:'sound',video:'T1bYiNzXpJQ'},
 {title:'Jusant',detail:'Sound redesign',kind:'sound',video:'viVpRabL7ks'},
 {title:'Deadline Delivery',detail:'Soundtrack · Music composition',kind:'music',video:'xaNMYG0I_Lw'}
];
function renderProjects(filter='all') {
 $('#projects').replaceChildren();
 projects.forEach((p,i)=>{if(filter!=='all'&&p.kind!==filter)return;
 const b=document.createElement('button');b.className='project';b.setAttribute('aria-label','Play '+p.title+' — '+p.detail);
 b.innerHTML=`<div class="project-visual"><img src="https://i.ytimg.com/vi/${p.video}/hqdefault.jpg" alt="" loading="lazy"><div class="play-icon"><span>▷</span></div></div><div class="project-info"><div><h3>${p.title}</h3><p>${p.detail}</p></div></div>`;
 b.onclick=()=>openVideo(p.video,p.title+' / '+p.detail);$('#projects').append(b);});
}
renderProjects();
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',active)});renderProjects(b.dataset.filter)});
function openVideo(id,title,provider='youtube'){window.ASTRALE_AMBIENCE.duck(true);playSound('open');$('#playerTitle').textContent=title;const frame=document.createElement('iframe');frame.src=provider==='vimeo'?'https://player.vimeo.com/video/'+id+'?autoplay=1&title=0&byline=0&portrait=0':'https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0';frame.title=title;frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';$('#playerFrame').replaceChildren(frame);$('#player').showModal()}
$('#playShowreel').onclick=()=>window.ASTRALE_REEL.open();

document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}})});
$('#player').addEventListener('close',()=>{ $('#playerFrame').replaceChildren();window.ASTRALE_AMBIENCE.duck(false) });
document.querySelectorAll('#openSettings,#titleSettings').forEach(button=>button.onclick=()=>$('#settings').showModal());
let enabled=false,volume=.6,ctx,lastHover=0;const sounds={...window.ASTRALE_SOUNDS},activeAudio=new Set();
function stopSounds(){activeAudio.forEach(a=>{a.pause();a.currentTime=0});activeAudio.clear();if(ctx&&ctx.state==='running')ctx.suspend().catch(()=>{})}
function syncSoundLabels(){for(const button of [$('#soundToggle')]){button.setAttribute('aria-pressed',enabled);button.textContent=enabled?'◉ Sound on':'◌ Sound off'}}
function setSound(value,cue=true){enabled=value;window.ASTRALE_AMBIENCE.enable(enabled);syncSoundLabels();if(enabled&&cue)playSound('open');else if(!enabled)stopSounds()}
$('#soundToggle').onclick=()=>setSound(!enabled);

window.addEventListener('atmospherestate',syncSoundLabels);
$('#volume').oninput=e=>{volume=Number(e.target.value);activeAudio.forEach(a=>a.volume=volume)};
function playSound(type,force=false){if((!enabled&&!force)||document.hidden||document.querySelector('#reelPlayer[open]'))return;
 if(sounds[type]){const audio=new Audio(sounds[type]);audio.volume=volume;activeAudio.add(audio);audio.onended=()=>activeAudio.delete(audio);audio.play().catch(()=>{activeAudio.delete(audio);$('#soundStatus').textContent='That sound could not play. Please try again.'});return}
 try{ctx??=new (window.AudioContext||window.webkitAudioContext)();ctx.resume();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';const t=ctx.currentTime;osc.frequency.setValueAtTime(type==='hover'?820:type==='click'?440:330,t);osc.frequency.exponentialRampToValueAtTime(type==='open'?660:240,t+.09);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume*.11,t+.005);gain.gain.exponentialRampToValueAtTime(.0001,t+.13);osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.14);osc.onended=()=>{osc.disconnect();gain.disconnect()}}catch{ $('#soundStatus').textContent='Audio is not supported in this browser.' }
}
document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const control=e.target.closest('button,a');if(!control||control.contains(e.relatedTarget))return;const now=performance.now();if(now-lastHover>100){lastHover=now;playSound('hover')}});
document.addEventListener('click',e=>{if(e.target.closest('button,a')&&!e.target.closest('#soundToggle,#enterPortfolio,#playShowreel,.project,[data-view]'))playSound('click')});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSounds()});

// Persistent navigation with cancellable, lightweight screen transitions.
const screenIds=['reel','work','about','credits'];let entered=false,transitionId=0;
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
 document.querySelector('.game-nav').hidden=false;contentPane.hidden=false;
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
 if(focus)next.querySelector('h2').focus({preventScroll:true});
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
function navigate(id){history.pushState(null,'','#'+id);showView(id)}
function enter(){
 if(entered||document.body.classList.contains('booting'))return;
 entered=true;window.ASTRALE_AMBIENCE.enable(enabled);
 document.body.classList.remove('at-title');document.querySelector('#titleScreen').hidden=true;
 document.querySelector('#experience').inert=false;
 navigate('reel');playSound('open');
}
document.querySelector('#enterPortfolio').onclick=enter;
document.addEventListener('keydown',e=>{
 if(e.key==='Enter'&&!entered&&!document.body.classList.contains('booting')&&!document.querySelector('dialog[open]')&&!e.target.closest('button,a,input')){e.preventDefault();enter()}
});
document.querySelectorAll('[data-view]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate(a.dataset.view);playSound('open')}));

window.addEventListener('hashchange',()=>{if(entered)showView(location.hash.slice(1))});
document.querySelector('.brand').onclick=e=>{e.preventDefault();navigate('reel')};
document.querySelector('#backToTitle').onclick=()=>{
 entered=false;++transitionId;clearMosaic();screenAnimation?.cancel();document.querySelector('#experience').inert=true;
 document.querySelector('#titleScreen').hidden=false;document.body.classList.add('at-title');
 window.ASTRALE_AMBIENCE.duck(false);setSound(true,false);document.querySelector('#enterPortfolio').focus();
};
if(document.body.classList.contains('booting'))window.addEventListener('bootcomplete',()=>setSound(true,false),{once:true});
else setSound(true,false);
