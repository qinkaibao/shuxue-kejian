(() => {
  const slits = document.querySelector('#slits');
  const options = [
    { parts:['2','1','12'], label:'二区 · 一号柜 · 十二号格', object:'鸟爪印', icon:'prints' },
    { parts:['2','11','2'], label:'二区 · 十一号柜 · 二号格', object:'缺角海星印', icon:'star' }
  ];
  const buttons = document.querySelectorAll('[data-split]');
  function split(index) {
    const item = options[index];
    slits.replaceChildren(...item.parts.map(part => {
      const span = document.createElement('span');
      span.textContent = part;
      return span;
    }));
    buttons.forEach((button,i) => button.setAttribute('aria-pressed',String(i===index)));
    document.querySelector('#split-note').textContent = item.label + '，打开后是' + item.object + '。';
    document.querySelectorAll('[data-object]').forEach(element => {
      element.style.display = element.getAttribute('data-object') === item.icon ? '' : 'none';
    });
  }
  buttons.forEach((button,i) => button.onclick = () => split(i));
  split(0);

  const tray = LabelTray(document.querySelector('#tray'), [
    {label:'展区',width:1,choices:['2','3']},
    {label:'展柜',width:2,choices:['01','04','11']},
    {label:'格号',width:2,choices:['02','07','12']}
  ], code => {
    const result = document.querySelector('#tray-note');
    if (!code) { result.textContent='三段都要放好。'; return; }
    const findings = {'20112':'这张签找到鸟爪印。', '21102':'这张签找到缺角海星印。'};
    result.textContent = findings[code] || '按这次布展清单，这个地址没有要找的两件展品。';
  });

  let moved = false;
  const move = document.querySelector('#move-star');
  const location = document.querySelector('#star-location');
  const slots = document.querySelectorAll('#move-diagram .shelf-slot');
  const pin = document.querySelector('#star-piece');
  function showMove() {
    slots[Number(moved)].append(pin);
    location.textContent = moved ? '新地址 30407 · 三区、四号柜、七号格' : '原地址 21102 · 二区、十一号柜、二号格';
    move.textContent = moved ? '搬回原柜' : '把海星搬到三区';
  }
  move.onclick = () => {moved = !moved; showMove();};
  document.querySelector('#clear-tray').onclick = () => {
    tray.value = '';
    document.querySelector('#tray-note').textContent = '';
    tray.focus();
  };
  showMove();
  SiteNav.mount({title:'潮痕馆的两张纸签',pageId:'tide-tags',reading:true,dir:'../index.html'});
})();
