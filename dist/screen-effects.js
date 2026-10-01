// Generate a tiny grain tile once. Moving layers use only compositor transforms.
(() => {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const pixels=ctx.createImageData(96,96);let seed=2317;
  for(let i=0;i<pixels.data.length;i+=4){
    seed=(seed*1664525+1013904223)>>>0;
    const value=seed>>>24;
    pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;
    pixels.data[i+3]=Math.round(value*.24);
  }
  ctx.putImageData(pixels,0,0);
  const grainImage=`url(${canvas.toDataURL()})`;
  document.querySelectorAll('.display-grain').forEach(layer=>layer.style.backgroundImage=grainImage);
  document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('display-idle',document.hidden));
})();
