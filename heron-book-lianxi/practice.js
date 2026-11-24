(() => {
  const pageId = 'heron-book-lianxi';
  const name = '白鹭不见的那一页配套练习';
  const questions = window.HeronQuestions;
  const report = window.KejianReport;
  const solved = {};
  const misses = {};
  const views = new Map();
  const list = document.getElementById('questions');
  const progress = () => '已完成 ' + questions.filter(q => solved[q.id]).length + ' / ' + questions.length + ' 题';

  function make(tag, text, attributes = {}) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    return element;
  }

  function paint() {
    document.getElementById('progress').textContent = progress();
    const navProgress = document.getElementById('snProg');
    if (navProgress) navProgress.textContent = progress();
  }

  function reflect(q) {
    const view = views.get(q.id);
    const done = Boolean(solved[q.id]);
    view.box.classList.toggle('done', done);
    view.inputs.forEach((input, index) => {
      input.disabled = done;
      if (done) input.value = q.fields[index].answer;
    });
    view.submit.disabled = done;
    view.reset.disabled = done;
    const showAnswer = Number(misses[q.id]) >= 2;
    view.answer.hidden = !showAnswer;
    view.answer.open = showAnswer;
    if (done) view.feedback.textContent = misses[q.id] ? '重试后答对了。' : '这题已完成。';
  }

  function clearDraft(view) {
    view.inputs.forEach(input => { input.value = ''; });
    view.feedback.textContent = '';
  }

  function restore() {
    const previous = { ...solved };
    const oldMisses = { ...misses };
    report.restorePractice({ pageId, questions, solved, misses, mark: reflect, paint });
    for (const q of questions) {
      if (!solved[q.id] && (previous[q.id] || (oldMisses[q.id] || 0) > (misses[q.id] || 0))) {
        clearDraft(views.get(q.id));
      }
      reflect(q);
    }
  }

  function check(q, view) {
    if (solved[q.id]) return;
    const values = view.inputs.map(input => input.value.trim().replace(/[０-９]/g, d => String(d.charCodeAt(0) - 65296)));
    if (values.some(value => !value)) {
      view.feedback.textContent = '还有一处没填好，或有一枚书签没放。';
      return;
    }
    const wrong = values.findIndex((value, index) => value !== q.fields[index].answer);
    const draft = q.fields.map((field, index) => field.label + '：' + values[index]).join('，');
    if (wrong < 0) {
      solved[q.id] = 1;
      report.pass(q.id, draft);
    } else {
      misses[q.id] = (misses[q.id] || 0) + 1;
      report.miss(q.id, draft);
      view.feedback.textContent = '提示：' + q.fields[wrong].hint;
    }
    reflect(q);
    paint();
  }

  questions.forEach((q, index) => {
    const box = make('article', '', { id: 'box-' + q.id, class: 'exercise' });
    const form = make('form');
    const inputs = q.fields.map((field, i) => {
      const id = q.id + '-' + i;
      if (field.pages) {
        const heading = make('p', field.label);
        const host = make('div', '', { id });
        form.append(heading, host);
        return BookmarkStrip(host, field.pages, field.label);
      }
      const label = make('label', field.label, { for: id });
      const input = field.options ? make('select', '', { id })
        : make('input', '', { id, inputmode:'numeric', class:'numeric', autocomplete:'off' });
      if (field.options) {
        input.append(make('option', '请选择', { value: '' }));
        for (const option of field.options) input.append(make('option', option, { value: option }));
      }
      label.append(input);
      form.append(label);
      return input;
    });
    const buttons = make('div', '', { class: 'controls' });
    const submit = make('button', '核对这一题', { type: 'submit', class: 'primary submit' });
    const reset = make('button', '重选', { type: 'button' });
    buttons.append(submit, reset);
    const feedback = make('p', '', { id: 'fb-' + q.id, class: 'fb', role: 'status' });
    const answer = make('details', '', { id: 'ans-' + q.id, hidden: '' });
    answer.append(make('summary', '看解答'), make('p', q.explain));
    form.append(buttons, feedback, answer);
    box.append(make('h2', (index + 1) + '　' + q.brief), make('p', q.prompt), form);
    list.append(box);

    const view = { box, inputs, submit, reset, feedback, answer };
    views.set(q.id, view);
    form.addEventListener('submit', event => {
      event.preventDefault();
      check(q, view);
    });
    reset.addEventListener('click', () => {
      clearDraft(view);
      view.feedback.textContent = '本题可以重新作答。';
      inputs[0].focus();
    });
  });

  window.addEventListener('kejian-progress-synced', event => {
    if (event.detail?.pageId === pageId) restore();
  });
  const ready = report.mount({ id: pageId, name, questions, noButton: true });
  window.SiteNav.mount({ pageId, reportId: pageId, total: questions.length, title: '白鹭接读练习', report: true, progress, dir: '../index.html' });
  restore();
  Promise.resolve(ready).then(restore);
})();
