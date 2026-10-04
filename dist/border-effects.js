// Small SVG strokes travel around the actual edges; no canvas redraw loop.
(() => {
 const panel=document.querySelector('.content-shell');
 const links=[...document.querySelectorAll('[data-view]')];
 const frames=[panel,...links].filter(Boolean);
 const markup='<svg class="edge-trails" aria-hidden="true" focusable="false" preserveAspectRatio="none"><rect class="edge-trail edge-trail-red" pathLength="100"/><rect class="edge-trail edge-trail-blue" pathLength="100"/><rect class="edge-trail edge-trail-sparks" pathLength="100"/></svg>';
 for(const frame of frames)frame.insertAdjacentHTML('beforeend',markup);

 // Match every trail to its host's real, responsive corner radius. Keeping the
 // stroke inset also prevents the burst's wider stroke from being clipped.
 const inset=3;
 function syncTrailGeometry(frame){
   const svg=frame.querySelector(':scope > .edge-trails');
   const width=frame.clientWidth;
   const height=frame.clientHeight;
   if(!svg||!width||!height)return;
   const styles=getComputedStyle(frame);
   const hostRadius=Math.max(
     parseFloat(styles.borderTopLeftRadius)||0,
     parseFloat(styles.borderTopRightRadius)||0,
     parseFloat(styles.borderBottomRightRadius)||0,
     parseFloat(styles.borderBottomLeftRadius)||0
   );
   const radius=Math.max(0,Math.min(hostRadius-inset,(width-inset*2)/2,(height-inset*2)/2));
   svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
   svg.querySelectorAll('.edge-trail').forEach(rect=>{
     rect.setAttribute('x',inset);
     rect.setAttribute('y',inset);
     rect.setAttribute('width',Math.max(0,width-inset*2));
     rect.setAttribute('height',Math.max(0,height-inset*2));
     rect.setAttribute('rx',radius);
     rect.setAttribute('ry',radius);
   });
 }
 frames.forEach(syncTrailGeometry);
 if('ResizeObserver' in window){
   const observer=new ResizeObserver(entries=>entries.forEach(({target})=>syncTrailGeometry(target)));
   frames.forEach(frame=>observer.observe(frame));
 }else window.addEventListener('resize',()=>frames.forEach(syncTrailGeometry));
 let timer;
 function settle(){clearTimeout(timer);frames.forEach(frame=>frame.classList.remove('edge-burst'))}
 window.addEventListener('astraleviewopen',event=>{
   settle();
   if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   panel.classList.add('edge-burst');
   links.find(link=>link.dataset.view===event.detail.id)?.classList.add('edge-burst');
   timer=setTimeout(settle,200);
 });
 document.getElementById('backToTitle')?.addEventListener('click',settle);
})();
