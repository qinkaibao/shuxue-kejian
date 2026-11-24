// Codes are strings. Converting a field to a number would lose a leading zero.
window.LabelTray = function (host, fields, onChange = () => {}) {
  let values = fields.map(() => '');
  let locked = false;
  const output = document.createElement('output');
  output.setAttribute('aria-live', 'polite');

  function make(tag, className, text = '') {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    if (tag === 'button') element.type = 'button';
    return element;
  }

  const grid = make('div', 'tag-fields');
  grid.style.setProperty('--columns', fields.length);
  const rows = fields.map((field, index) => {
    const row = make('div', 'tag-field');
    const seat = make('b', 'tag-seat');
    seat.setAttribute('aria-hidden', 'true');
    const rack = make('div', 'chip-rack');
    rack.setAttribute('role', 'group');
    rack.setAttribute('aria-label', field.label);
    const chips = field.choices.map(choice => {
      const chip = make('button', 'tag-chip', choice);
      chip.setAttribute('aria-label', field.label + ' ' + choice);
      let start, ghost, moved = false;
      function select() {
        if (locked) return;
        values[index] = choice;
        paint();
        onChange(result());
      }
      function stop() {
        start = null;
        ghost?.remove();
        ghost = null;
        seat.classList.remove('drop-ready');
      }
      chip.onclick = event => {
        if (event.detail === 0 || !moved) select();
        moved = false;
      };
      chip.onpointerdown = event => {
        if (locked || event.button !== 0 || !event.isPrimary) return;
        moved = false;
        start = [event.clientX, event.clientY];
        chip.setPointerCapture(event.pointerId);
      };
      chip.onpointermove = event => {
        if (!start || Math.hypot(event.clientX - start[0], event.clientY - start[1]) < 8) return;
        moved = true;
        if (!ghost) {
          ghost = make('span', 'tag-ghost', choice);
          ghost.setAttribute('aria-hidden','true');
          document.body.append(ghost);
        }
        ghost.style.left = event.clientX + 'px';
        ghost.style.top = event.clientY + 'px';
        seat.classList.add('drop-ready');
      };
      chip.onpointerup = event => {
        if (!start) return;
        const target = document.elementFromPoint(event.clientX, event.clientY);
        stop();
        if (moved && seat.contains(target)) select();
      };
      chip.onpointercancel = stop;
      chip.onlostpointercapture = stop;
      rack.append(chip);
      return chip;
    });
    row.append(make('strong','',field.label), seat, rack);
    grid.append(row);
    return {seat, chips};
  });

  function result() {
    return values.every(Boolean) ? values.join('') : '';
  }
  function paint() {
    for (const [i, row] of rows.entries()) {
      row.seat.textContent = values[i] || '·'.repeat(fields[i].width);
      row.chips.forEach(chip => {
        chip.disabled = locked;
        chip.setAttribute('aria-pressed', String(chip.textContent === values[i]));
      });
    }
    output.textContent = result() ? '合起来是 ' + result() : '已放 ' + values.filter(Boolean).length + ' / ' + fields.length + ' 段';
  }
  host.append(grid, output);
  paint();
  return {
    get value() { return result(); },
    set value(code) {
      let offset = 0;
      values = fields.map(field => {
        const part = code.slice(offset, offset + field.width);
        offset += field.width;
        return field.choices.includes(part) ? part : '';
      });
      paint();
    },
    set disabled(value) { locked = value; paint(); },
    focus() { rows[0].chips[0].focus(); }
  };
};
