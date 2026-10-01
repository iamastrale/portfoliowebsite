// Small SVG strokes travel around the actual edges; no canvas redraw loop.
(() => {
 const panel=document.querySelector('.content-shell');
 const links=[...document.querySelectorAll('[data-view]')];
 const frames=[panel,...links];
 const markup='<svg class="edge-trails" aria-hidden="true" focusable="false"><rect class="edge-trail edge-trail-red" pathLength="100"/><rect class="edge-trail edge-trail-blue" pathLength="100"/><rect class="edge-trail edge-trail-sparks" pathLength="100"/></svg>';
 for(const frame of frames)frame.insertAdjacentHTML('beforeend',markup);
 let timer;
 function settle(){clearTimeout(timer);frames.forEach(frame=>frame.classList.remove('edge-burst'))}
 window.addEventListener('astraleviewopen',event=>{
   settle();
   if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   panel.classList.add('edge-burst');
   links.find(link=>link.dataset.view===event.detail.id)?.classList.add('edge-burst');
   timer=setTimeout(settle,200);
 });
 document.getElementById('backToTitle').addEventListener('click',settle);
})();
