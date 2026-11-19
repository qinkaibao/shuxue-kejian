'use strict';
{
  let step = 0;
  const descriptions=['按住窗面，先看窗下的墙脚。','苇面沿窗边转过一个直角。','桥面随下一道折痕转过来，隔着盒心对着窗。','坡面在最后一边合拢，又回到了窗旁。'];
  const prev=document.getElementById('unfold'), next=document.getElementById('fold');
  function show(){
    for(const el of document.querySelectorAll('[data-layer]')){
      const from=el.getAttribute('data-from'), until=el.getAttribute('data-until'), only=el.getAttribute('data-only');
      el.style.display=(from===null||step>=Number(from))&&(until===null||step<=Number(until))&&(only===null||step===Number(only))?'inline':'none';
    }
    document.getElementById('caption').textContent=descriptions[step];
    prev.disabled=step===0; next.disabled=step===3;
  }
  prev.onclick=()=>{if(step>0)step--;show();};
  next.onclick=()=>{if(step<3)step++;show();};
  show();
  SiteNav.mount({title:'小窗里的纸月亮',pageId:'moon-window',reading:true,dir:'../index.html'});
}
