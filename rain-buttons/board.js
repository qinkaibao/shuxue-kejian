// counts run from ones to thousands. Ten unit pictures always exchange for one at the next place.
window.ButtonWorkshop = function (host, perBox, boxes) {
  const names = ['散扣', '扣串', '百板', '千箱'];
  const places = ['个位', '十位', '百位', '千位'];
  const initial = names.map((_, i) => (Math.floor(perBox / 10 ** i) % 10) * boxes);
  let counts = initial.slice(), history = [], locked = false;
  const create = (tag, cls, txt) => {
    const el = document.createElement(tag);
    el.className = cls;
    if (txt) el.textContent = txt;
    return el;
  };
  const grid = create('div','place-grid');
  const status = create('output','board-status');
  status.setAttribute('aria-live','polite');
  const undo = create('button','undo','撤回上一步');
  undo.type = 'button';
  host.append(grid, undo, status);
  function pieces(level, count) {
    const row = create('span','pieces');
    row.setAttribute('aria-hidden','true');
    for (let i=0; i<count; i++) row.append(create('i','unit u'+level));
    return row;
  }
  function exchange(i, focus) {
    if (locked || i >= 3 || counts[i] < 10) return;
    history.push(counts.slice());
    counts[i] -= 10;
    counts[i+1]++;
    render();
    status.textContent = '十份' + names[i] + '换成一份' + names[i+1] + '，扣子总数没变。';
    if (focus) (grid.querySelector('button') || undo).focus();
  }
  function render() {
    grid.replaceChildren();
    for (const i of [3,2,1,0]) {
      const col = create('div','place');
      col.dataset.level = i;
      col.append(create('strong','',places[i]), create('small','',names[i]+' × '+counts[i]));
      for (let n=0; n<Math.floor(counts[i]/10); n++) {
        const stack = create('button','stack');
        stack.type='button';
        stack.disabled=locked;
        stack.setAttribute('aria-label','把十份'+names[i]+'换成一份'+names[i+1]);
        stack.append(pieces(i,10));
        stack.onclick = () => exchange(i,true);
        // A short tap is a normal button click. A drag exchanges only on the next column.
        let start, ghost;
        stack.onpointerdown = e => {
          if (!e.isPrimary || e.button !== 0) return;
          start=[e.clientX,e.clientY];
          stack.setPointerCapture(e.pointerId);
        };
        stack.onpointermove = e => {
          if (!start || Math.hypot(e.clientX-start[0],e.clientY-start[1]) < 7) return;
          if (!ghost) {
            ghost = create('div','exchange-ghost');
            ghost.setAttribute('aria-hidden','true');
            ghost.append(pieces(i,10));
            document.body.append(ghost);
          }
          ghost.style.left = e.clientX + 'px';
          ghost.style.top = e.clientY + 'px';
          stack.classList.add('moving');
          grid.querySelector('[data-level="'+(i+1)+'"]').classList.add('target');
        };
        const stop = () => {
          start=null;ghost?.remove();ghost=null;stack.classList.remove('moving');
          grid.querySelector('.target')?.classList.remove('target');
        };
        stack.onpointercancel=stop;
        stack.onpointerup=e=>{
          if (!start) return;
          const moved=stack.classList.contains('moving') || Math.hypot(e.clientX-start[0],e.clientY-start[1])>=7;
          stop();
          if (!moved) return;
          stack.addEventListener('click',e=>e.stopImmediatePropagation(),{once:true,capture:true});
          const next=document.elementFromPoint(e.clientX,e.clientY)?.closest('.place');
          if (next && grid.contains(next) && Number(next.dataset.level)===i+1) exchange(i,false);
          else { render(); status.textContent='松在左邻的一格才会换组；也可以直接点一框。'; }
        };
        col.append(stack);
      }
      if(counts[i]%10) col.append(pieces(i,counts[i]%10));
      grid.append(col);
    }
    undo.disabled=locked || history.length===0;
  }
  undo.onclick=()=>{ if(history.length){counts=history.pop();render();status.textContent='已撤回。';} };
  render();
  return {
    ready:()=>counts.every(n=>n<10),
    started:()=>history.length>0,
    reset(){ locked=false; counts=initial.slice();history=[];status.textContent='';render(); },
    finish(){ if(locked)return; locked=true;counts=names.map((_,i)=>Math.floor(perBox*boxes/10**i)%10);render(); }
  };
};
