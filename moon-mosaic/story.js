'use strict';
function showLayers(root, step) {
  for (const layer of root.querySelectorAll('[data-layer]')) {
    const from = layer.getAttribute('data-from');
    const until = layer.getAttribute('data-until');
    const only = layer.getAttribute('data-only');
    const visible = (from === null || step >= Number(from)) &&
      (until === null || step <= Number(until)) && (only === null || step === Number(only));
    layer.style.display = visible ? 'inline' : 'none';
  }
}
let laid = 0;
function displayFrame() {
  showLayers(document, laid);
  document.getElementById('frame-count').textContent = '已经铺满' + laid + '方';
  document.getElementById('back').disabled = laid === 0;
  document.getElementById('pack').disabled = laid === 2;
}
document.getElementById('pack').onclick = () => { laid++; displayFrame(); };
document.getElementById('back').onclick = () => { laid--; displayFrame(); };
displayFrame();
SiteNav.mount({ title: '月鱼墙上最后一片白', pageId: 'moon-mosaic', reading: true, dir: '../index.html' });
