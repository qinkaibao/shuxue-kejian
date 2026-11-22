(() => {
  const figure = document.getElementById('cart');
  let count = 3;
  function paint() {
    figure.querySelectorAll('[data-from],[data-until],[data-only]').forEach(layer => {
      const from = layer.getAttribute('data-from');
      const until = layer.getAttribute('data-until');
      const only = layer.getAttribute('data-only');
      const visible = (from === null || count >= Number(from)) &&
        (until === null || count <= Number(until)) && (only === null || count === Number(only));
      layer.style.display = visible ? '' : 'none';
    });
    document.getElementById('weight').textContent = count + ' 包泥，共 ' + count * 260 + ' 克。';
    document.getElementById('less').disabled = count === 0;
    document.getElementById('more').disabled = count === 5;
  }
  document.getElementById('less').onclick = () => { if (count > 0) count--; paint(); };
  document.getElementById('more').onclick = () => { if (count < 5) count++; paint(); };
  paint();
  if (window.SiteNav) SiteNav.mount({title:'给麻雀留一汪水',reading:true,pageId:'sparrow-dish',dir:'../index.html'});
})();
