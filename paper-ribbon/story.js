(() => {
  const initial = [6, 2, 0, 3];
  const tiles = Array.from(document.querySelectorAll('[data-slot]'));
  const result = document.getElementById('tray-result');
  const placeNames = ['百位', '十位', '个位', '条数'];
  let digits = initial.slice();
  let held = null;

  function paint() {
    tiles.forEach((tile, i) => {
      tile.textContent = digits[i];
      tile.setAttribute('aria-label', placeNames[i] + '：' + digits[i]);
      tile.setAttribute('aria-pressed', String(i === held));
    });
  }

  tiles.forEach((tile, i) => {
    tile.addEventListener('click', () => {
      if (held === null) {
        held = i;
        result.textContent = '选中了' + placeNames[i] + '的 ' + digits[i] + '，再点另一块牌。';
      } else if (held === i) {
        held = null;
        result.textContent = '已取消选中。';
      } else {
        [digits[held], digits[i]] = [digits[i], digits[held]];
        held = null;
        result.textContent = '两块牌换好了。';
      }
      paint();
    });
  });

  document.getElementById('measure').addEventListener('click', () => {
    held = null;
    paint();
    if (digits[0] === 0) {
      result.textContent = '百位放了 0，单条长度就不是三位数了。';
    } else if (digits[3] === 0) {
      result.textContent = '这张单取零条纸，换一个条数试试。';
    } else {
      const length = Number(digits.slice(0, 3).join(''));
      const count = digits[3];
      result.textContent = length + ' × ' + count + ' ＝ ' + length * count + '（厘米）';
    }
  });

  document.getElementById('restore-tray').addEventListener('click', () => {
    digits = initial.slice();
    held = null;
    paint();
    result.textContent = '摆回了故事里的领纸单。';
  });

  paint();
  window.SiteNav.mount({ title: '晒纸巷的四块字牌', pageId: 'paper-ribbon', reading: true, dir: '../index.html' });
})();
