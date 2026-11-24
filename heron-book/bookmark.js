// The same page strip works with a pointer, the arrow keys, or a tap on a page.
window.BookmarkStrip = function (host, pages, label, onChoose = () => {}) {
  const strip = document.createElement('div');
  strip.className = 'page-strip';
  strip.setAttribute('role', 'group');
  strip.setAttribute('aria-label', label);
  const range = document.createElement('input');
  range.type = 'range';
  range.min = 0;
  range.max = pages.length - 1;
  range.value = 0;
  range.setAttribute('aria-label', label + '，拖动书签或用方向键翻页');
  const output = document.createElement('output');
  output.setAttribute('aria-live', 'polite');
  const buttons = pages.map((page, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = page;
    button.setAttribute('aria-label', '第' + page + '页');
    button.onclick = () => choose(index);
    strip.append(button);
    return button;
  });
  host.classList.add('bookmark');
  host.append(strip, range, output);
  let value = '';
  function paint(index) {
    range.value = index < 0 ? 0 : index;
    const words = index < 0 ? '尚未放书签' : '书签放在第 ' + pages[index] + ' 页';
    range.setAttribute('aria-valuetext', words);
    output.textContent = words;
    buttons.forEach((btn, i) => btn.setAttribute('aria-pressed', String(i === index)));
    value = index < 0 ? '' : String(pages[index]);
  }
  function choose(index) { paint(index); onChoose(value); }
  range.oninput = () => choose(Number(range.value));
  range.onclick = () => choose(Number(range.value));
  paint(-1);
  return {
    get value() { return value; },
    set value(v) { paint(pages.map(String).indexOf(String(v))); },
    set disabled(disabled) {
      range.disabled = disabled;
      buttons.forEach(b => { b.disabled = disabled; });
    },
    focus() { buttons[0].focus(); }
  };
};
