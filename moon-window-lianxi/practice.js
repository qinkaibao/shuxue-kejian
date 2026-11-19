'use strict';
{
  const pageId='moon-window-lianxi', questions=window.MoonCards;
  const get=id=>document.getElementById(id);
  const solved={}, misses={};
  const fields=q=>q.dir?['hinge','far']:['far'];
  const progress=()=> '已做对 '+questions.filter(q=>solved[q.id]).length+' / '+questions.length+' 题';
  function paint(){for(const id of ['prog','snProg']) if(get(id)) get(id).textContent=progress();}
  function mark(q){
    const box=get('box-'+q.id);
    box.classList.add('done');
    fields(q).forEach(k=>{get(q.id+'-'+k).value=q[k];});
    box.querySelectorAll('button,input').forEach(el=>{el.disabled=true;});
    const n=Number(misses[q.id]||0);
    get('fb-'+q.id).textContent=n?'第'+(n+1)+'次对。':'一次对。';
    paint();
  }
  function restore(){
    KejianReport.restorePractice({pageId,questions,solved,misses,mark,paint});
    for(const q of questions) get('ans-'+q.id).hidden=Number(misses[q.id]||0)<2;
  }
  function check(q){
    if(solved[q.id]) return;
    const fb=get('fb-'+q.id), keys=fields(q);
    const draft=Object.fromEntries(keys.map(k=>[k,get(q.id+'-'+k).value.trim().normalize('NFKC')]));
    if(keys.some(k=>!draft[k])){fb.textContent='把想选的面号都填好，再核对。这次不记错。';return;}
    const wrong=keys.find(k=>draft[k]!==q[k]);
    const record=(q.dir?'跨到 '+draft.hinge+' 号，':'')+'对面 '+draft.far+' 号';
    if(wrong){
      misses[q.id]=Number(misses[q.id]||0)+1;
      KejianReport.miss(q.id,record);
      fb.textContent=wrong==='hinge'?(draft.far===q.far?'对面找到了。':'')+'按住起点，照题中方向滑过一条共边就停。':(q.dir?'跨到的面号对了。':'')+'按住起点，把其他面沿折痕围起来。哪一面与它隔着盒心？';
      if(misses[q.id]>=2)get('ans-'+q.id).hidden=false;
      return;
    }
    solved[q.id]=1;KejianReport.pass(q.id,record);mark(q);
  }
  questions.forEach(q=>{
    get('check-'+q.id).onclick=()=>check(q);
    get('reset-'+q.id).onclick=()=>{
      if(solved[q.id])return;
      fields(q).forEach(k=>{get(q.id+'-'+k).value='';});
      get('fb-'+q.id).textContent='已擦去这次草稿。';
    };
  });
  window.addEventListener('kejian-progress-synced',e=>{if(e.detail?.pageId===pageId)restore();});
  KejianReport.mount({id:pageId,name:'小窗里的纸月亮配套练习',questions,noButton:true}).then(restore);
  SiteNav.mount({title:'纸月亮练习',pageId,reportId:pageId,report:true,total:questions.length,progress,dir:'../index.html'});
  get('submit-work').onclick=()=>KejianReport.submit();
  paint();
}
