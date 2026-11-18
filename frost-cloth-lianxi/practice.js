'use strict';
const PAGE = 'frost-cloth-lianxi';
const questions = window.ClothQuestions;
const byId = id => document.getElementById(id);
const solved = {}, misses = {}, drafts = {};
const progress = () => '已做对 ' + questions.filter(q => solved[q.id]).length + ' / ' + questions.length + ' 题';
function paint() {
  byId('prog').textContent = progress();
  if (byId('snProg')) byId('snProg').textContent = progress();
}
function render(q) {
  for (const region of mapChoices(q)) {
    region.classList.toggle('picked', drafts[q.id][q.fields[0][0]] === region.getAttribute('data-pick'));
  }
  for (const [key] of q.fields) {
    for (const b of byId(q.id + '-' + key).querySelectorAll('button')) {
      b.setAttribute('aria-pressed', String(drafts[q.id][key] === b.getAttribute('data-value')));
    }
  }
}
function mapChoices(q) {
  return byId('box-' + q.id).querySelectorAll('[data-pick]');
}
function reset(q) {
  drafts[q.id] = {};
  byId('fb-' + q.id).textContent = '';
  byId('ans-' + q.id).open = Number(misses[q.id] || 0) >= 2;
  render(q);
}
function mark(q) {
  drafts[q.id] = {...q.answers};
  render(q);
  const box = byId('box-' + q.id);
  box.classList.add('done');
  for (const button of box.querySelectorAll('button')) button.disabled = true;
  const n = Number(misses[q.id] || 0);
  byId('fb-' + q.id).textContent = n ? '第' + (n + 1) + '次对。' : '一次对。';
  paint();
}
function restore() {
  const previous = {...solved};
  KejianReport.restorePractice({pageId:PAGE, questions, solved, misses, mark, paint});
  for (const q of questions) {
    if (!solved[q.id] && previous[q.id]) reset(q);
    byId('ans-' + q.id).open = Number(misses[q.id] || 0) >= 2;
  }
}
const hints = [
  ['手指先停在布头，再向大号迈一步。','从起点出发，只在手指跨过空档时计数。'],
  ['放布头的时候，这根桩也要夹牢。','沿着编号逐根点，两头都别漏。'],
  ['把两个相邻桩号找出来，比画一下它们之间的距离。','每跨过一个空档，就用掉一段同样长的布。'],
  ['名牌要挂在能钉钉子的地方。','在起点挂好一张，然后再迈步。'],
  ['看看目的地的号码比起点大还是小。','先数步子跨过几档，再看一档几米。'],
  ['把指尖放在棉带左头，往右走一小格。','沿棉带数小格，留意尺的起点。'],
  ['手指放好后再数第一步。','每走一档，把那一档用的布长记下来。'],
  ['从布头出发，每到下一根桩再数一档。','如果桩挨得更近，编号和布长会怎样？']
];
function check(q, index) {
  if (solved[q.id]) return;
  const values = drafts[q.id], feedback = byId('fb-' + q.id);
  if (q.fields.some(([key]) => !values[key])) {
    feedback.textContent = '两步都摆好再检查，这次不记错。';
    return;
  }
  const wrong = q.fields.findIndex(([key]) => values[key] !== q.answers[key]);
  if (wrong >= 0) {
    misses[q.id] = Number(misses[q.id] || 0) + 1;
    KejianReport.miss(q.id, JSON.stringify(values));
    feedback.textContent = hints[index][wrong];
    if (misses[q.id] >= 2) byId('ans-' + q.id).open = true;
    return;
  }
  solved[q.id] = 1;
  KejianReport.pass(q.id, JSON.stringify(values));
  mark(q);
}
questions.forEach((q,i) => {
  reset(q);
  for (const region of mapChoices(q)) {
    region.onclick = () => {
      if (solved[q.id]) return;
      drafts[q.id][q.fields[0][0]] = region.getAttribute('data-pick');
      render(q);
    };
  }
  for (const [key] of q.fields) {
    for (const b of byId(q.id + '-' + key).querySelectorAll('button')) {
      b.onclick = () => {
        drafts[q.id][key] = b.getAttribute('data-value');
        render(q);
      };
    }
  }
  byId('check-' + q.id).onclick = () => check(q,i);
  byId('reset-' + q.id).onclick = () => reset(q);
});
window.addEventListener('kejian-progress-synced', event => {
  if (event.detail && event.detail.pageId === PAGE) restore();
});
KejianReport.mount({id:PAGE, name:'霜降前的蓝布卷配套练习', questions, noButton:true}).then(restore);
SiteNav.mount({title:'蓝布卷练习',pageId:PAGE,reportId:PAGE,report:true,total:questions.length,progress,dir:'../index.html'});
byId('submit-work').onclick = () => KejianReport.submit();
paint();
