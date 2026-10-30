(function(){
  const Q=window.XiansuoQuestions;
  const tags=['问什么与单位','多和少的对照','几倍与多几','还剩与还差','平均分与条件'];
  const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  Q.forEach((q,i)=>{
    const article=document.createElement('article');article.className='question';article.id='box-'+q.id;article.setAttribute('aria-labelledby','title-'+q.id);
    let body='<h3 id="title-'+q.id+'">第'+(i+1)+'题　'+esc(q.prompt)+'</h3>';
    if(q.diagram)body+='<div class="diagram" data-diagram="'+q.diagram+'"></div>';
    if(q.choices)body+=q.choices.map((c,j)=>'<button type="button" class="option" data-choice="'+j+'">'+String.fromCharCode(65+j)+'. '+esc(c)+'</button>').join('');
    else body+='<form novalidate><div class="answer-row"><label for="in-'+q.id+'">'+esc(q.label)+'：</label><input id="in-'+q.id+'" type="text" inputmode="numeric" autocomplete="off" aria-label="第'+(i+1)+'题 '+esc(q.label)+'（'+esc(q.unit)+'）"><span>'+esc(q.unit)+'</span></div><button type="submit" class="submit">核对答案</button></form>';
    body+='<p class="feedback" id="fb-'+q.id+'" role="status"></p><details id="ans-'+q.id+'"><summary>看图想一想 · 查看讲解</summary>'+(q.explainDiagram?'<div class="diagram" data-diagram="'+q.explainDiagram+'"></div>':'')+'<p>'+esc(q.explain)+'</p></details>';
    article.innerHTML=body;document.querySelector('[data-section="'+q.s+'"]').appendChild(article);
  });
  KejianReport.mount({id:'xiansuo-lianxi',name:'线索街的对照灯配套练习',questions:Q.map(q=>({id:q.id,brief:q.prompt+(q.unit?'（答：'+q.unit+'）':''),tag:tags[q.s-1]+'／'+q.type,category:'看图列式与数量关系'}))});
  let saved={};try{const data=JSON.parse(localStorage.getItem('kejian-report-v1:xiansuo-lianxi'));if(data&&typeof data==='object')saved=data;}catch(e){}
  const solved=saved.solved&&typeof saved.solved==='object'?saved.solved:{};
  const misses=saved.misses&&typeof saved.misses==='object'?saved.misses:{};
  function feedback(q,message){document.getElementById('fb-'+q.id).textContent=message;}
  function explain(q){document.getElementById('ans-'+q.id).open=true;}
  function progress(){const message='已完成 '+Q.filter(q=>solved[q.id]).length+' / '+Q.length+' 题';document.getElementById('prog').textContent=message;const nav=document.getElementById('snProg');if(nav)nav.textContent=message;}
  function mark(q,restored){
    const article=document.getElementById('box-'+q.id);article.classList.add('done');
    article.querySelectorAll('input').forEach(el=>{el.value=q.answer;el.disabled=true;});
    article.querySelectorAll('.option').forEach(el=>{el.disabled=true;if(Number(el.dataset.choice)===q.answer)el.classList.add('correct');});
    const submit=article.querySelector('.submit');if(submit)submit.hidden=true;
    feedback(q,(restored?'已恢复本题完成记录。':'答对了。')+' 可以对照讲解，说说每一步表示什么。');explain(q);progress();
  }
  function attempt(q,value,display){
    if(solved[q.id])return;
    if(value===q.answer){KejianReport.pass(q.id,display);solved[q.id]=1;mark(q,false);}
    else{KejianReport.miss(q.id,display);misses[q.id]=(Number(misses[q.id])||0)+1;feedback(q,q.hint+(misses[q.id]>=2?' 讲解已展开，可以慢慢看，也可以先去别节。':' 也可以直接打开下面的讲解。'));if(misses[q.id]>=2)explain(q);}
  }
  Q.forEach(q=>{
    const article=document.getElementById('box-'+q.id);
    article.querySelectorAll('.option').forEach(btn=>btn.addEventListener('click',()=>{const n=Number(btn.dataset.choice);if(solved[q.id])return;if(n!==q.answer)btn.classList.add('wrong');attempt(q,n,q.choices[n]);}));
    const form=article.querySelector('form');if(form)form.addEventListener('submit',e=>{e.preventDefault();const input=form.querySelector('input');const value=input.value.trim().replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-65248));if(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))){feedback(q,'请填写一个完整的非负整数。空白和未写完的内容不计入尝试。');input.focus();return;}attempt(q,Number(value),value+' '+q.unit);});
    if(solved[q.id])mark(q,true);else if(Number(misses[q.id])>=2){explain(q);feedback(q,'已恢复之前的两次错答记录；讲解已展开，随时可以继续。');}
  });progress();
  document.getElementById('reset').addEventListener('click',()=>{if(confirm('清空本页14题的作答记录及成绩单？其他页面的记录不受影响。')){KejianReport.clear();location.reload();}});
  window.addEventListener('beforeprint',()=>document.querySelectorAll('details').forEach(el=>el.open=true));
})();
