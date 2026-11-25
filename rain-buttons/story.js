(() => {
  const sample = document.querySelector('#sample-picture');
  let box = 0;
  const colors = ['青绿','藏青','米白','浅褐'];
  function showBox() {
    sample.replaceChildren();
    sample.setAttribute('aria-label', '第'+(box+1)+'匣，五张百板，每板一百颗，另有六颗散扣');
    for (const [kind,count] of [['card100',5],['single',6]]) {
      for(let n=0;n<count;n++) {
        const piece=document.createElement('span');
        piece.className=kind;
        sample.append(piece);
      }
    }
    sample.style.setProperty('--button-ink', ['#316255','#364f72','#ede7cf','#926443'][box]);
    sample.style.setProperty('--board-paper', ['#c1d7cf','#ced8e6','#6b706b','#eee2ce'][box]);
    document.querySelector('#box-label').textContent='第'+(box+1)+'匣 · '+colors[box]+'扣';
    document.querySelector('#box-buttons').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===box)));
  }
  document.querySelectorAll('#box-buttons button').forEach((b,i)=>b.onclick=()=>{box=i;showBox();});
  showBox();
  ButtonWorkshop(document.querySelector('#workshop'),506,4);
  const cells=Array.from(document.querySelectorAll('#slip b'));
  document.querySelectorAll('[data-slip]').forEach(button=>button.onclick=()=>{
    const number=button.getAttribute('data-slip');
    [...number.padStart(4,'·')].forEach((digit,i)=>cells[i].textContent=digit);
    document.querySelector('#slip-message').textContent=number==='224'?'收货人摆出两板、两串、四颗。两只千箱去了哪里？':'收货人摆出两箱、零板、两串、四颗。两边对上了。';
  });
  SiteNav.mount({title:'纽扣巷的雨声帘',pageId:'rain-buttons',reading:true,dir:'../index.html'});
})();
