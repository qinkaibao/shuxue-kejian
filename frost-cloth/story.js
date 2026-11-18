'use strict';
let laid = 0;
function showLayers(step) {
  for (const layer of document.querySelectorAll('[data-layer]')) {
    const from = layer.getAttribute('data-from');
    const until = layer.getAttribute('data-until');
    const only = layer.getAttribute('data-only');
    const visible = (from === null || step >= Number(from)) &&
      (until === null || step <= Number(until)) && (only === null || step === Number(only));
    layer.style.display = visible ? 'inline' : 'none';
  }
  document.getElementById('laid').textContent = '已铺 ' + step + ' 档';
  document.getElementById('back').disabled = step === 0;
  document.getElementById('lay').disabled = step === 4;
}
document.getElementById('lay').onclick = () => showLayers(++laid);
document.getElementById('back').onclick = () => showLayers(--laid);
showLayers(laid);
SiteNav.mount({title:'霜降前的蓝布卷',pageId:'frost-cloth',reading:true,dir:'../index.html'});
