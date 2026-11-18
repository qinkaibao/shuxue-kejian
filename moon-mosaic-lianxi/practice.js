'use strict';
const PAGE = 'moon-mosaic-lianxi';
const questions = window.MosaicQuestions;
const byId = id => document.getElementById(id);
const solved = {}, misses = {}, work = {};
const progress = () => '已做对 ' + questions.filter(q => solved[q.id]).length + ' / ' + questions.length + ' 题';
function paint() {
  byId('prog').textContent = progress();
  if (byId('snProg')) byId('snProg').textContent = progress();
}
function showLayers(root, step) {
  for (const layer of root.querySelectorAll('[data-layer]')) {
    const from = layer.getAttribute('data-from'), until = layer.getAttribute('data-until');
    const only = layer.getAttribute('data-only');
    const visible = (from === null || step >= Number(from)) &&
      (until === null || step <= Number(until)) && (only === null || step === Number(only));
    layer.style.display = visible ? 'inline' : 'none';
  }
}
function render(q) {
  const s = work[q.id];
  for (const [i,[key,,opts]] of q.fields.entries()) {
    const field = byId(q.id + '-' + key);
    field.hidden = q.id === 'q8' && i !== s.step && !solved[q.id];
    if (opts) for (const button of field.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-value') === s.values[key]));
    }
  }
  if (q.model) {
    showLayers(byId('box-' + q.id), s.packed);
    byId('move-' + q.id).textContent = '已装 ' + s.packed + ' 方';
    byId('act-' + q.id).disabled = (s.packed + 1) * 10 > q.model;
  }
  if (q.order) {
    q.order.forEach((card,i) => { byId('card-' + i).disabled = s.order.includes(card); });
    byId('move-' + q.id).textContent = s.order.join(' → ');
  }
  if (q.order || q.model) byId('undo-' + q.id).disabled = !s.order.length && !s.packed;
  if (q.id === 'q8') {
    byId('prev').disabled = s.step === 0;
    byId('next').disabled = s.step === q.fields.length - 1;
  }
}
function reset(q) {
  work[q.id] = {values:{}, packed:0, order:[], step:0};
  const box = byId('box-' + q.id);
  for (const el of box.querySelectorAll('button,input')) el.disabled = false;
  for (const input of box.querySelectorAll('input')) input.value = '';
  byId('fb-' + q.id).textContent = '';
  byId('ans-' + q.id).open = Number(misses[q.id] || 0) >= 2;
  render(q);
}
function mark(q) {
  const s = work[q.id];
  s.values = {...q.answers};
  if (q.order) s.order = q.answers.order.split('／');
  if (q.model) s.packed = Number(q.answers.packed);
  if (byId(q.id + '-input')) byId(q.id + '-input').value = q.answers.result;
  render(q);
  const box = byId('box-' + q.id);
  box.classList.add('done');
  for (const control of box.querySelectorAll('button,input')) control.disabled = true;
  byId('fb-' + q.id).textContent = misses[q.id] ? '第' + (Number(misses[q.id]) + 1) + '次对。' : '一次对。';
  paint();
}
function restore() {
  const before = {...solved};
  KejianReport.restorePractice({pageId:PAGE, questions, solved, misses, mark, paint});
  for (const q of questions) if (!solved[q.id]) {
    if (before[q.id]) reset(q);
    byId('ans-' + q.id).open = Number(misses[q.id] || 0) >= 2;
  }
}
const hints = {
  left:'只数还在框外的整行。装进满框的行已经搬走了。',
  carry:'每十行装成一方，数一数能装满几个框。',
  unit:'先想一行有几片，再想十行合起来该用哪个单位。',
  pieces:'圈里每一行都有十片，数的是十行里的所有片。',
  incoming:'先只数五盘散片，每凑足十片就添一行。',
  sum:'原有的整行和散片新贴的行都在桌上。',
  order:'还没数出有多少行，能确定要搬几方吗？',
  result:'按百、十、个的位置读一遍。散片用完的那一位也要写。'
};
function check(q) {
  if (solved[q.id]) return;
  const s = work[q.id], values = {...s.values}, feedback = byId('fb-' + q.id);
  if (q.order && s.order.length === q.order.length) values.order = s.order.join('／');
  if (q.model && q.model - 10*s.packed < 10) values.packed = String(s.packed);
  for (const [key,,opts] of q.fields) if (!opts) {
    values[key] = byId(q.id + '-input').value.normalize('NFKC').trim();
  }
  const keys = Object.keys(q.answers);
  const missing = keys.find(key => !values[key]);
  if (missing) {
    if (q.id === 'q8') {
      s.step = q.fields.findIndex(([key]) => key === missing);
      render(q);
    }
    feedback.textContent = '还有一步没完成。补齐后再检查，这次不记错。';
    return;
  }
  const wrong = keys.find(key => values[key] !== q.answers[key]);
  if (wrong) {
    if (q.id === 'q8') {
      s.step = q.fields.findIndex(([key]) => key === wrong);
      render(q);
    }
    misses[q.id] = Number(misses[q.id] || 0) + 1;
    KejianReport.miss(q.id, JSON.stringify(values));
    feedback.textContent = hints[wrong];
    if (misses[q.id] >= 2) {
      byId('ans-' + q.id).open = true;
      feedback.textContent += ' 可以对照下方讲解再试。';
    }
    return;
  }
  solved[q.id] = 1;
  KejianReport.pass(q.id, JSON.stringify(values));
  mark(q);
}
for (const q of questions) {
  reset(q);
  const state = () => work[q.id];
  for (const [key,,opts] of q.fields) if (opts) {
    for (const b of byId(q.id + '-' + key).querySelectorAll('button')) {
      b.onclick = () => { state().values[key] = b.getAttribute('data-value'); render(q); };
    }
  }
  if (q.model) byId('act-' + q.id).onclick = () => { state().packed++; render(q); };
  if (q.order) q.order.forEach((card,i) => {
    byId('card-' + i).onclick = () => { state().order.push(card); render(q); };
  });
  if (q.model || q.order) byId('undo-' + q.id).onclick = () => {
    if (q.model) state().packed--; else state().order.pop();
    render(q);
  };
  if (q.id === 'q8') {
    byId('next').onclick = () => { state().step++; render(q); };
    byId('prev').onclick = () => { state().step--; render(q); };
  }
  byId('check-' + q.id).onclick = () => check(q);
  byId('reset-' + q.id).onclick = () => reset(q);
}
window.addEventListener('kejian-progress-synced', event => {
  if (event.detail && event.detail.pageId === PAGE) restore();
});
KejianReport.mount({id:PAGE,name:'月鱼墙上最后一片白配套练习',questions,noButton:true}).then(restore);
SiteNav.mount({title:'月鱼墙练习',pageId:PAGE,reportId:PAGE,report:true,total:questions.length,progress,dir:'../index.html'});
byId('submit-work').onclick = () => KejianReport.submit();
paint();
