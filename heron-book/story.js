(() => {
  const mini = document.querySelector('#mini');
  BookmarkStrip(mini, [1,2,3,4,5,6], '前三张已经读过，下次从哪张接读', value => {
    const n = Number(value);
    document.querySelector('#mini-note').textContent = n === 4
      ? '前三张已经讲完；第四张正好接上。'
      : n <= 3 ? '这张已经讲过。顺着三个已读的页角再往前找。'
        : '从这张开口，会漏掉第四张。把书签往回挪一挪。';
  });
  const rows = document.querySelector('#days');
  const pieces = [];
  for (let i = 0; i < 5; i++) {
    const row = document.createElement('div');
    row.className = 'day-row';
    const title = document.createElement('span');
    title.textContent = '第' + (i+1) + '晚';
    const block = document.createElement('div');
    block.className = 'day-block';
    for (let j = 0; j < 12; j++) {
      const page = document.createElement('span');
      page.textContent = i*12+j+1;
      block.append(page);
    }
    row.append(title,block); rows.append(row); pieces.push(row);
  }
  let completed = 0;
  const back = document.querySelector('#back'), next = document.querySelector('#next');
  function show() {
    pieces.forEach((row,i) => {
      row.classList.toggle('read', i < completed);
      row.firstChild.textContent = '第' + (i+1) + '晚' + (i < completed ? ' ✓' : '');
    });
    const count = 12*completed;
    const tail = count === 60 ? '全书读完，可以合上书。' : '接读第 ' + (count+1) + ' 页。';
    document.querySelector('#days-note').textContent = completed + ' 晚讲完，共 ' + count + ' 页。' + (count ? '末页是第 ' + count + ' 页。' : '') + tail;
    back.disabled = completed === 0;
    next.disabled = completed === 5;
  }
  back.onclick = () => {completed--;show();};
  next.onclick = () => {completed++;show();};
  show();
  const captions = ['三十六页：小鱼像银针一样跃出水面。','三十七页：两圈水纹，一根苇尖。','三十八页：白鹭向黄船头飞去。'];
  const river = document.querySelector('#river');
  const picture = BookmarkStrip(river,[36,37,38],'翻看河面上的三幅画',v=>openPage(Number(v)));
  function openPage(n) {
    document.querySelectorAll('[data-page]').forEach(layer => { layer.style.display = Number(layer.getAttribute('data-page')) === n ? '' : 'none'; });
    document.querySelector('#picture-caption').textContent = captions[n-36];
    document.querySelector('#river-picture').setAttribute('aria-label',captions[n-36]);
  }
  picture.value=36; openPage(36);
  SiteNav.mount({title:'白鹭不见的那一页',pageId:'heron-book',reading:true,dir:'../index.html'});
})();
