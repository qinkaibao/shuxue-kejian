'use strict';
(function () {
  var pageId = 'woodpecker-pause-lianxi';
  var questions = (typeof WoodpeckerQuestions !== 'undefined') ? WoodpeckerQuestions : [];
  var byId = {};
  questions.forEach(function (q) { byId[q.id] = q; });

  function $(id) { return document.getElementById(id); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var answers = { q1: '1', q2a: '1', q2b: '1', q3: '1', q4: '2', q5: '5' };
  var solved = {};
  var misses = {};
  var selected = { q1: null, q2a: null, q2b: null, q3: null, q4: null };

  function report() { return window.KejianReport; }

  function fb(id, text) {
    var el = $('fb-' + id);
    if (el) el.textContent = text || '';
  }

  function showExplain(id, on) {
    var box = $('ans-' + id);
    if (!box) return;
    var q = byId[id];
    if (on && q && !box.getAttribute('data-filled')) {
      var body = box.querySelector('p.ans-body');
      if (!body) {
        body = document.createElement('p');
        body.className = 'ans-body';
        box.appendChild(body);
      }
      body.textContent = q.explain || '';
      box.setAttribute('data-filled', '1');
    }
    box.hidden = !on;
    if (on) box.open = true;
  }

  function progress() {
    var n = questions.filter(function (q) { return solved[q.id]; }).length;
    var t = '已做对 ' + n + ' / ' + questions.length + ' 题';
    ['prog', 'snProg', 'progress'].forEach(function (id) { if ($(id)) $(id).textContent = t; });
    return t;
  }

  function isBlankQ1() { return !selected.q1; }
  function isBlankQ2() { return selected.q2a === null || selected.q2b === null; }
  function isBlankQ3() { return !selected.q3; }
  function isBlankQ4() { return !selected.q4; }
  function isBlankQ5() {
    var v = String(($('q5-val') || {}).value || '').trim();
    return v === '';
  }

  function setChoice(qid, value, btn) {
    selected[qid] = value;
    var root = btn && btn.closest ? btn.closest('.choices') : document.querySelector('.choices[data-q="' + qid + '"]');
    if (root) {
      qsa('button[data-value]', root).forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-value') === value ? 'true' : 'false');
      });
    }
  }

  function recordExtras() {
    var r = report();
    if (r && r.updatePageExtras) {
      r.updatePageExtras({
        selected: Object.assign({}, selected),
        q5: ($('q5-val') || {}).value || ''
      });
    }
  }
  function saveExtras() { recordExtras(); }

  function mark(q) {
    solved[q.id] = true;
    var box = $('box-' + q.id);
    if (box) box.classList.add('done');
    if (!($('fb-' + q.id) && $('fb-' + q.id).textContent)) fb(q.id, '对了。');
    progress();
  }

  function paint() { progress(); }

  function hintOf(id) {
    var q = byId[id];
    return (q && q.hint) || '再看一看题目里的约定。';
  }

  function markMiss(id, record) {
    misses[id] = (misses[id] || 0) + 1;
    var r = report();
    if (r && r.miss) r.miss(id, record);
    fb(id, hintOf(id));
    if (misses[id] >= 2) showExplain(id, true);
  }

  function markPass(id, msg, record) {
    solved[id] = true;
    fb(id, msg || '对了。');
    var box = $('box-' + id);
    if (box) box.classList.add('done');
    var r = report();
    if (r && r.pass) r.pass(id, record);
    progress();
    saveExtras();
  }

  function checkQ1() {
    if (isBlankQ1()) { fb('q1', '先选一个再核对。'); return; }
    if (selected.q1 === answers.q1) markPass('q1', '对了。旧扣的孔距比较大。', selected.q1);
    else markMiss('q1', selected.q1);
  }
  function checkQ2() {
    if (isBlankQ2()) { fb('q2', '两小问都选完再核对。空白先不算错。'); return; }
    var rec = selected.q2a + ',' + selected.q2b;
    if (selected.q2a === answers.q2a && selected.q2b === answers.q2b) {
      markPass('q2', '对了。针尖放在 V，另一脚向右落下。', rec);
    } else markMiss('q2', rec);
  }
  function checkQ3() {
    if (isBlankQ3()) { fb('q3', '先选一个再核对。'); return; }
    if (selected.q3 === answers.q3) markPass('q3', '对了。从 J 起六厘米，落在乙。', selected.q3);
    else markMiss('q3', selected.q3);
  }
  function checkQ4() {
    if (isBlankQ4()) { fb('q4', '先选一个再核对。'); return; }
    if (selected.q4 === answers.q4) markPass('q4', '对了。还要补上松梅这一段。', selected.q4);
    else markMiss('q4', selected.q4);
  }
  function checkQ5() {
    var v = String(($('q5-val') || {}).value || '').trim();
    if (isBlankQ5()) { fb('q5', '先填一个得数再核对。'); return; }
    if (v === answers.q5) markPass('q5', '对了。两头相差 5 厘米。', v);
    else markMiss('q5', v);
  }

  var checkers = { q1: checkQ1, q2: checkQ2, q3: checkQ3, q4: checkQ4, q5: checkQ5 };

  function resetQ(id) {
    solved[id] = false;
    misses[id] = 0;
    fb(id, '');
    showExplain(id, false);
    var box = $('box-' + id);
    if (box) box.classList.remove('done');
    if (id === 'q1' || id === 'q3' || id === 'q4') selected[id] = null;
    if (id === 'q2') { selected.q2a = null; selected.q2b = null; }
    if (id === 'q5' && $('q5-val')) $('q5-val').value = '';
    if (box) qsa('.choices button', box).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    saveExtras();
    progress();
  }

  function applyChoiceState() {
    Object.keys(selected).forEach(function (qid) {
      if (!selected[qid]) return;
      var root = document.querySelector('.choices[data-q="' + qid + '"]');
      if (!root) return;
      qsa('button[data-value]', root).forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-value') === selected[qid] ? 'true' : 'false');
      });
    });
  }

  function restore() {
    var r = report();
    if (r && r.restorePractice) {
      r.restorePractice({ pageId: pageId, questions: questions, solved: solved, misses: misses, mark: mark, paint: paint });
    }
    questions.forEach(function (q) {
      if (Number(misses[q.id] || 0) >= 2) showExplain(q.id, true);
    });
    try {
      var saved = JSON.parse(window.localStorage.getItem('kejian-report-v1:' + pageId));
      var extras = saved && saved.pageExtras;
      if (extras) {
        if (extras.selected) selected = Object.assign(selected, extras.selected);
        if (extras.q5 && $('q5-val')) $('q5-val').value = extras.q5;
      }
    } catch (e) {}
    applyChoiceState();
    progress();
  }

  function onChoiceClick(ev) {
    var btn = ev.target.closest('button[data-value]');
    if (!btn) return;
    var root = btn.closest('.choices');
    if (!root) return;
    var qid = root.getAttribute('data-q');
    var main = qid.replace(/[ab]$/, '');
    if (solved[main] || solved[qid]) return;
    setChoice(qid, btn.getAttribute('data-value'), btn);
    saveExtras();
  }

  function bind() {
    qsa('.choices').forEach(function (root) { root.addEventListener('click', onChoiceClick); });
    qsa('[data-check]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-check');
        if (solved[id]) return;
        if (checkers[id]) checkers[id]();
        progress();
      });
    });
    qsa('[data-reset]').forEach(function (btn) {
      btn.addEventListener('click', function () { resetQ(btn.getAttribute('data-reset')); });
    });
    if ($('q5-val')) $('q5-val').addEventListener('input', saveExtras);
    if ($('submit-work')) $('submit-work').onclick = function () {
      if (report() && report().submit) report().submit();
    };
  }

  bind();

  if (window.SiteNav && SiteNav.mount) {
    window.SiteNav.mount({
      title: '啄木鸟练习',
      pageId: pageId,
      reportId: pageId,
      report: true,
      total: questions.length,
      progress: progress,
      dir: '../index.html'
    });
  }
  window.addEventListener('kejian-progress-synced', function (e) {
    if (e.detail && e.detail.pageId === pageId) restore();
  });

  var KR = report();
  var mounted = KR && KR.mount ? KR.mount({ id: pageId, name: '把啄木鸟的停顿留下来配套练习', questions: questions, noButton: true }) : null;
  if (mounted && typeof mounted.then === 'function') mounted.then(restore);
  else restore();
  paint();

  window.WoodpeckerPractice = {
    pageId: pageId,
    answers: answers,
    check: checkers,
    resetQ: resetQ,
    isBlank: { q1: isBlankQ1, q2: isBlankQ2, q3: isBlankQ3, q4: isBlankQ4, q5: isBlankQ5 },
    _state: function () { return { selected: selected, solved: solved, misses: misses }; }
  };
})();
