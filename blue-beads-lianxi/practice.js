'use strict';
{
  const pageId = 'blue-beads-lianxi';
  const questions = (typeof window !== 'undefined' && window.BlueBeadsQuestions) || [];
  const sortCards = (typeof window !== 'undefined' && window.BlueBeadsSortCards) || [];
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
  const $ = (id) => document.getElementById(id);
  const solved = {};
  const misses = {};
  const resets = {};
  const restores = { count: 0 };
  const state = {
    cakesIn: [],
    sort: sortCards.map((c) => c.id),
    ropeShown: false,
    q8Deferred: false,
    stoneUsed: 0
  };

  function report() {
    return (typeof window !== 'undefined' && window.KejianReport) ? window.KejianReport : {
      mount: () => Promise.resolve(),
      miss() {}, pass() {}, submit() {}, restorePractice() {}, updatePageExtras() {}
    };
  }

  function progress() {
    return '已做对 ' + questions.filter((q) => solved[q.id]).length + ' / ' + questions.length + ' 题';
  }

  function paint() {
    const t = progress();
    ['prog', 'snProg'].forEach((id) => { if ($(id)) $(id).textContent = t; });
  }

  function showAns(id, on) {
    const box = $('ans-' + id);
    if (!box) return;
    const q = byId[id];
    if (on && q && !box.dataset.filled) {
      box.textContent = q.explain;
      box.dataset.filled = '1';
    }
    box.hidden = !on;
  }

  function fb(id, text) {
    const el = $('fb-' + id);
    if (el) el.textContent = text || '';
  }

  function chosen(group) {
    const root = document.querySelector('.choices[data-q="' + group + '"]');
    if (!root) return '';
    const b = root.querySelector('button[aria-pressed="true"]');
    return b ? b.getAttribute('data-value') : '';
  }

  function setChosen(group, value) {
    const root = document.querySelector('.choices[data-q="' + group + '"]');
    if (!root) return;
    root.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-pressed', b.getAttribute('data-value') === value ? 'true' : 'false');
    });
  }

  function val(id) {
    const el = $(id);
    return el ? String(el.value || '').trim().normalize('NFKC') : '';
  }

  function setVal(id, v) {
    const el = $(id);
    if (el) el.value = v;
  }

  function recordExtras() {
    const r = report();
    if (typeof r.updatePageExtras === 'function') {
      r.updatePageExtras({
        resets: { ...resets },
        restores: restores.count,
        q8Deferred: !!state.q8Deferred
      });
    }
  }

  function cakeEls() {
    return Array.from(document.querySelectorAll('.loose-cake'));
  }

  function cakeHome(el) {
    if (!el.dataset.home) el.dataset.home = el.getAttribute('transform') || 'translate(0 0)';
    return el.dataset.home;
  }

  function cakeDest(i) {
    // Move into the 全部区 on the right, without cloning.
    const spots = ['translate(-134 110)', 'translate(-130 110)', 'translate(-78 76)'];
    return spots[i] || 'translate(0 94)';
  }

  function paintCakes() {
    const inSet = new Set(state.cakesIn);
    cakeEls().forEach((el) => {
      const i = Number(el.getAttribute('data-cake'));
      cakeHome(el);
      el.setAttribute('transform', inSet.has(i) ? cakeDest(i) : el.dataset.home);
    });
    const n = state.cakesIn.length;
    const note = $('cake-count');
    if (note) note.textContent = '已加入 ' + n + ' 块。满盘仍是 8 盘×4 块。';
    const left = $('cake-left');
    if (left) left.textContent = '旁边 ' + (3 - n) + ' 块';
  }

  function addCake(index) {
    if (solved.q2) return;
    const left = [0, 1, 2].filter((i) => !state.cakesIn.includes(i));
    if (!left.length) return;
    const next = Number.isInteger(index) ? index : left[0];
    if (!left.includes(next)) return;
    state.cakesIn.push(next);
    paintCakes();
  }

  function backCake() {
    if (solved.q2) return;
    state.cakesIn.pop();
    paintCakes();
  }

  function renderSort() {
    const box = $('sort6');
    if (!box) return;
    box.innerHTML = '';
    state.sort.forEach((id, idx) => {
      const card = sortCards.find((c) => c.id === id);
      if (!card) return;
      const row = document.createElement('div');
      row.className = 'sort-item';
      row.setAttribute('data-id', id);
      const txt = document.createElement('div');
      txt.className = 'txt';
      txt.textContent = card.text;
      const move = document.createElement('div');
      move.className = 'move';
      const up = document.createElement('button');
      up.type = 'button';
      up.textContent = '上移';
      up.disabled = idx === 0 || !!solved.q6;
      up.onclick = () => moveSort(idx, -1);
      const down = document.createElement('button');
      down.type = 'button';
      down.textContent = '下移';
      down.disabled = idx === state.sort.length - 1 || !!solved.q6;
      down.onclick = () => moveSort(idx, 1);
      move.append(up, down);
      row.append(txt, move);
      box.append(row);
    });
  }

  function moveSort(idx, dir) {
    if (solved.q6) return;
    const j = idx + dir;
    if (j < 0 || j >= state.sort.length) return;
    const next = state.sort.slice();
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    state.sort = next;
    renderSort();
  }

  function setSort(order) {
    state.sort = order.slice();
    renderSort();
  }

  function shuffleSort() {
    const ids = sortCards.map((c) => c.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    if (ids.join() === byId.q6.order.join()) ids.push(ids.shift());
    state.sort = ids;
    renderSort();
  }

  function showRope(withTotal) {
    const box = $('ropeBox');
    const tpl = $(withTotal ? 'tpl-rope1' : 'tpl-rope0');
    if (!box || !tpl) return;
    box.hidden = false;
    box.innerHTML = '';
    const node = tpl.content ? tpl.content.cloneNode(true) : null;
    if (node) box.appendChild(node);
    else box.innerHTML = tpl.innerHTML;
    state.ropeShown = true;
  }

  function readDraft(id) {
    if (id === 'q1') return { choice: chosen('q1') };
    if (id === 'q2') return { expr: chosen('q2-expr'), cakes: state.cakesIn.length, total: val('q2-total') };
    if (id === 'q3') return { choice: chosen('q3') };
    if (id === 'q4') return { full: val('q4-full'), all: val('q4-all') };
    if (id === 'q5') return { choice: chosen('q5') };
    if (id === 'q6') return { order: state.sort.slice(), value: val('q6-val') };
    if (id === 'q7') return { choice: chosen('q7') };
    if (id === 'q8') return { length: val('q8-len'), why: chosen('q8-why') };
    return {};
  }

  function isBlank(id, draft) {
    if (id === 'q1' || id === 'q3' || id === 'q5' || id === 'q7') return !draft.choice;
    if (id === 'q2') return !draft.expr && draft.cakes === 0 && !draft.total;
    if (id === 'q4') return !draft.full && !draft.all;
    if (id === 'q6') return !draft.value; // 排序总会有一个顺序，空白只看□
    if (id === 'q8') return !draft.length && !draft.why;
    return true;
  }

  function incomplete(id, draft) {
    if (isBlank(id, draft)) return '先把这一题想选或想填的都写好，再核对。这次不记错。';
    if (id === 'q2' && (!draft.expr || !draft.total)) return '满盘算式和总数都要完成，再核对。这次不记错。';
    if (id === 'q4' && (!draft.full || !draft.all)) return '两个空都填好，再核对。这次不记错。';
    if (id === 'q8' && (!draft.length || !draft.why)) return '原长和说明都要完成，再核对。这次不记错。';
    return '';
  }

  function judge(id, draft) {
    const q = byId[id];
    if (id === 'q1' || id === 'q3' || id === 'q5' || id === 'q7') {
      if (draft.choice === q.answer) return { ok: true, record: draft.choice };
      return { ok: false, hint: q.hint, record: draft.choice };
    }
    if (id === 'q2') {
      if (draft.expr !== q.expr) return { ok: false, hint: q.hintExpr, field: 'expr', record: draft.expr };
      if (draft.cakes !== q.cakes) return { ok: false, hint: q.hintCake, field: 'cakes', record: '加入' + draft.cakes };
      if (draft.total !== q.total) return { ok: false, hint: q.hintTotal, field: 'total', record: draft.total };
      return { ok: true, record: '4×8，加入3，35' };
    }
    if (id === 'q4') {
      if (draft.full !== q.full) return { ok: false, hint: q.hintFull, field: 'full', record: draft.full };
      if (draft.all !== q.all) return { ok: false, hint: q.hintAll, field: 'all', record: draft.full + ',' + draft.all };
      return { ok: true, record: '48,53' };
    }
    if (id === 'q6') {
      const orderOk = draft.order.join() === q.order.join();
      const valueOk = draft.value === q.value;
      if (orderOk && valueOk) return { ok: true, record: '①②③，47' };
      if (!orderOk && !valueOk) return { ok: false, hint: q.hintOrder + ' 排序还没排对，□里的数也还要再算。', field: 'both', record: draft.order.join('-') + ',' + draft.value };
      if (!orderOk) return { ok: false, hint: q.hintOrder + ' 这一次是排序还没对，不是□算错。', field: 'order', record: draft.order.join('-') };
      return { ok: false, hint: q.hintValue + ' 卡片顺序对了，是□里的数还要再算。', field: 'value', record: draft.value };
    }
    if (id === 'q8') {
      if (draft.length !== q.length) return { ok: false, hint: q.hint, field: 'length', record: draft.length + ',' + draft.why };
      if (draft.why !== q.why) return { ok: false, hint: q.hint, field: 'why', record: draft.length + ',' + draft.why };
      return { ok: true, record: '43,A' };
    }
    return { ok: false, hint: '再看一看。', record: '' };
  }

  function mark(q) {
    const box = $('box-' + q.id);
    if (box) {
      box.classList.add('done');
      box.querySelectorAll('button,input').forEach((el) => {
        if (el.getAttribute('data-reset') === q.id) return;
        if (el.id === 'submit-work') return;
        el.disabled = true;
      });
    }
    // fill canonical answers
    if (q.id === 'q1' || q.id === 'q3' || q.id === 'q5' || q.id === 'q7') setChosen(q.id, q.answer);
    if (q.id === 'q2') {
      setChosen('q2-expr', q.expr);
      state.cakesIn = [0, 1, 2];
      paintCakes();
      setVal('q2-total', q.total);
    }
    if (q.id === 'q4') { setVal('q4-full', q.full); setVal('q4-all', q.all); }
    if (q.id === 'q6') { setSort(q.order); setVal('q6-val', q.value); }
    if (q.id === 'q8') {
      setVal('q8-len', q.length);
      setChosen('q8-why', q.why);
    }
    const n = Number(misses[q.id] || 0);
    fb(q.id, n ? '第' + (n + 1) + '次对。' : '一次对。');
    paint();
  }

  function check(id) {
    if (solved[id]) return { kind: 'already' };
    const draft = readDraft(id);
    const wait = incomplete(id, draft);
    if (wait) {
      fb(id, wait);
      return { kind: 'blank' };
    }
    const result = judge(id, draft);
    if (!result.ok) {
      misses[id] = Number(misses[id] || 0) + 1;
      report().miss(id, result.record);
      fb(id, result.hint);
      if (id === 'q8') showRope(misses[id] >= 2);
      if (misses[id] >= 2) showAns(id, true);
      return { kind: 'miss', times: misses[id], field: result.field || '' };
    }
    solved[id] = 1;
    report().pass(id, result.record);
    mark(byId[id]);
    return { kind: 'pass' };
  }

  function resetQuestion(id) {
    resets[id] = Number(resets[id] || 0) + 1;
    recordExtras();
    if (solved[id]) {
      fb(id, '这题已经做对，记录还在。草稿不再擦掉。');
      return { kind: 'locked' };
    }
    if (id === 'q1' || id === 'q3' || id === 'q5' || id === 'q7') setChosen(id, '');
    if (id === 'q2') {
      setChosen('q2-expr', '');
      state.cakesIn = [];
      paintCakes();
      setVal('q2-total', '');
    }
    if (id === 'q4') { setVal('q4-full', ''); setVal('q4-all', ''); if ($('note4ani')) $('note4ani').textContent = ''; }
    if (id === 'q5') {
      document.querySelectorAll('.demo-stone').forEach((g) => g.removeAttribute('transform'));
      state.stoneUsed = 0;
      $('stoneMsg').textContent = '';
    }
    if (id === 'q6') { shuffleSort(); setVal('q6-val', ''); }
    if (id === 'q8') { setVal('q8-len', ''); setChosen('q8-why', ''); $('ropeBox').hidden = true; state.ropeShown = false; }
    fb(id, '已擦去这次草稿。这次不算错。');
    return { kind: 'reset', times: resets[id] };
  }

  function replay4() {
    document.querySelectorAll('[data-card]').forEach((card, i) => {
      card.querySelectorAll('g').forEach((button) => {
        button.getAnimations().forEach((animation) => animation.cancel());
        button.animate([{ opacity: 0, translate: '0 12px' }, { opacity: 1, translate: '0 0' }],
          { delay: i * 250, duration: 240, fill: 'backwards' });
      });
    });
    $('note4ani').textContent = '每八枚放回一张卡。数一数满卡，再看看旁边还剩几枚。';
  }

  function demoStones(stone) {
    if (!stone || stone.getAttribute('transform') || solved.q5) return;
    stone.setAttribute('transform', 'translate(0 26)');
    state.stoneUsed += 1;
    const msg = $('stoneMsg');
    if (!msg) return;
    if (state.stoneUsed < 7) msg.textContent = '已经点了 ' + state.stoneUsed + ' 颗，还不够再装一盒。';
    else msg.textContent = '七颗刚好再装一盒，所以剩下七颗时还不能停。';
    // never change option buttons
  }

  function restore() {
    // The report stores extras together with this page's solved and miss maps.
    try {
      const saved = JSON.parse(window.localStorage.getItem('kejian-report-v1:' + pageId));
      if (saved && saved.pageExtras) {
        Object.assign(resets, saved.pageExtras.resets);
        state.q8Deferred = !!saved.pageExtras.q8Deferred;
        restores.count = Math.max(restores.count, Number(saved.pageExtras.restores) || 0);
      }
    } catch {} // Offline preview also works when storage is unavailable.
    restores.count += 1;
    report().restorePractice({ pageId, questions, solved, misses, mark, paint });
    questions.forEach((q) => {
      showAns(q.id, Number(misses[q.id] || 0) >= 2);
    });
  }

  function bindChoices() {
    document.querySelectorAll('.choices').forEach((root) => {
      root.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', () => {
          const qid = (root.getAttribute('data-q') || '').split('-')[0];
          if (solved[qid]) return;
          root.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
        });
      });
    });
  }

  function bind() {
    document.querySelectorAll('[data-check]').forEach((btn) => {
      const id = btn.getAttribute('data-check');
      if (!btn.id) btn.id = 'check-' + id;
      btn.addEventListener('click', () => check(id));
    });
    document.querySelectorAll('[data-reset]').forEach((btn) => {
      const id = btn.getAttribute('data-reset');
      if (!btn.id) btn.id = 'reset-' + id;
      btn.addEventListener('click', () => resetQuestion(id));
    });
    document.querySelectorAll('[data-bag], #loose-shells').forEach((group) => {
      group.style.cursor = 'pointer';
      group.addEventListener('click', () => {
        if (!solved.q1) setChosen('q1', group.id === 'loose-shells' ? 'C' : 'A');
      });
    });
    cakeEls().forEach((cake) => {
      cake.style.cursor = 'pointer';
      cake.addEventListener('click', () => addCake(Number(cake.getAttribute('data-cake'))));
    });
    if ($('cake-add')) $('cake-add').onclick = addCake;
    if ($('cake-back')) $('cake-back').onclick = backCake;
    if ($('btnReplay4')) $('btnReplay4').onclick = replay4;
    document.querySelectorAll('.demo-stone').forEach((g) => {
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => demoStones(g));
    });
    if ($('submit-work')) $('submit-work').onclick = () => report().submit();
    bindChoices();
    paintCakes();
    if ($('sort6') && !state._sorted) {
      // Keep a non-correct default if this is a fresh page.
      if (state.sort.join() === 'c1,c2,c3') shuffleSort();
      else renderSort();
    }
  }

  bind();

  const KR = report();
  if (typeof window !== 'undefined' && window.SiteNav) {
    window.SiteNav.mount({
      title: '五颗蓝珠练习',
      pageId,
      reportId: pageId,
      report: true,
      total: questions.length,
      progress,
      dir: '../index.html'
    });
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('kejian-progress-synced', (e) => {
      if (e.detail && e.detail.pageId === pageId) restore();
    });
  }
  const mounted = KR.mount({ id: pageId, name: '雨檐下的五颗蓝珠配套练习', questions, noButton: true });
  if (mounted && typeof mounted.then === 'function') mounted.then(restore);
  else restore();
  paint();

  window.BlueBeadsPractice = {
    pageId,
    check,
    reset: resetQuestion,
    addCake,
    backCake,
    setSort,
    shuffleSort,
    setChosen,
    setVal,
    showRope,
    replay4,
    demoStones,
    deferQ8() { state.q8Deferred = true; recordExtras(); },
    getState() {
      return {
        solved: { ...solved },
        misses: { ...misses },
        resets: { ...resets },
        restores: restores.count,
        cakesIn: state.cakesIn.slice(),
        sort: state.sort.slice(),
        ropeShown: state.ropeShown,
        q8Deferred: state.q8Deferred,
        stoneUsed: state.stoneUsed
      };
    },
    readDraft,
    restore
  };
}
