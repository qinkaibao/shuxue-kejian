(() => {
  const pageId = 'sparrow-dish-lianxi';
  const questions = window.DishQuestions;
  const report = window.KejianReport;
  const solved = {}, misses = {};
  const el = id => document.getElementById(id);
  const inputs = q => q.fields.map((_, i) => el(q.id + '-' + i));
  const progress = () => '已完成 ' + questions.filter(q => solved[q.id]).length + ' / ' + questions.length + ' 题';
  function paint() {
    for (const id of ['progress','snProg']) if (el(id)) el(id).textContent = progress();
  }
  function reflect(q) {
    const done = Boolean(solved[q.id]);
    el('box-' + q.id).classList.toggle('done', done);
    inputs(q).forEach((input,i) => {
      input.disabled = done;
      if (done) input.value = q.fields[i].answer;
    });
    el('check-' + q.id).disabled = done;
    el('reset-' + q.id).disabled = done;
    const answer = el('ans-' + q.id);
    answer.hidden = !(misses[q.id] >= 2);
    answer.open = !answer.hidden;
    if (done) el('fb-' + q.id).textContent = misses[q.id] ? '重试后答对了。' : '这题已完成。';
  }
  function check(q) {
    if (solved[q.id]) return;
    const values = inputs(q).map(input => input.value);
    const fb = el('fb-' + q.id);
    if (values.some(v => v === '')) { fb.textContent = '还有一处没选好，可以接着选。'; return; }
    const index = values.findIndex((v,i) => v !== q.fields[i].answer);
    const draft = q.fields.map((f,i) => f.label + '：' + values[i]).join('，');
    if (index < 0) {
      solved[q.id] = 1;
      report?.pass(q.id,draft);
    } else {
      misses[q.id] = (misses[q.id] || 0) + 1;
      report?.miss(q.id,draft);
      fb.textContent = (index > 0 ? q.fields[0].label + '选对了。' : '') + q.fields[index].hint;
    }
    reflect(q);
    paint();
  }
  function restore() {
    const previous = {...solved}, oldMisses = {...misses};
    report.restorePractice({pageId,questions,solved,misses,mark:reflect,paint});
    questions.forEach(q => {
      const id = q.id;
      if (!solved[id] && (previous[id] || (oldMisses[id] || 0) > (misses[id] || 0))) {
        inputs(q).forEach(input => { input.value = ''; });
        el('fb-' + id).textContent = '';
      }
      reflect(q);
    });
  }
  questions.forEach(q => {
    el('check-' + q.id).onclick = () => check(q);
    el('reset-' + q.id).onclick = () => {
      if (solved[q.id]) return;
      inputs(q).forEach(input => { input.value = ''; });
      el('fb-' + q.id).textContent = '可以重新选择。';
    };
  });
  paint();
  if (report) {
    window.addEventListener('kejian-progress-synced', event => {
      if (event.detail?.pageId === pageId) restore();
    });
    const ready = report.mount({id:pageId,name:'给麻雀留一汪水配套练习',questions,noButton:true});
    Promise.resolve(ready).then(restore);
    window.SiteNav?.mount({pageId,reportId:pageId,total:questions.length,report:true,title:'浅水盘练习',progress,dir:'../index.html'});
    el('submit-work').onclick = () => {
      report.updatePageExtras({transferNote:'第八题的作答日期与是否独立需另行观察'});
      report.submit();
    };
  }
})();
