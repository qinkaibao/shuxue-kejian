'use strict';
(function () {
  var pageId = 'qianwan-lianxi';
  var questions = (typeof QianwanQuestions !== 'undefined') ? QianwanQuestions : [];
  var byId = {};
  questions.forEach(function (q) { byId[q.id] = q; });

  function $(id) { return document.getElementById(id); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var answers = {
    q1: 'B',
    q2: '02-10-008',
    q3: 'C',
    q4a: 'C',
    q4b: 'B',
    q5: 'C',
    q6: 'B',
    q7: 'C',
    q8a: '8',
    q8b: '16',
    q8c: 'B'
  };

  var solved = {};
  var misses = {};
  var selected = { q1: null, q3: null, q4a: null, q4b: null, q5: null, q6: null, q7: null, q8c: null };
  var cells = ['', '', '', '', '', '', ''];
  var activeCell = 0;
  var chosenDigit = null;
  var drawMode = 'plain';

  function report() {
    return window.KejianReport;
  }

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
  function isBlankQ2() { return cells.every(function (c) { return c === ''; }); }
  function isBlankQ3() { return !selected.q3; }
  function isBlankQ4() { return !selected.q4a || !selected.q4b; }
  function isBlankQ5() { return !selected.q5; }
  function isBlankQ6() { return !selected.q6; }
  function isBlankQ7() { return !selected.q7; }
  function isBlankQ8() {
    var a = String(($('q8-ab') || {}).value || '').trim();
    var b = String(($('q8-all') || {}).value || '').trim();
    return !a || !b || !selected.q8c;
  }

  function setChoice(qid, value, btn) {
    selected[qid] = value;
    var root = btn && btn.closest ? btn.closest('.choices') : document.querySelector('.choices[data-q="' + qid + '"]');
    if (root) {
      qsa('button', root).forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-value') === value ? 'true' : 'false');
      });
    }
  }

  function codeFromCells() {
    return cells.slice(0, 2).join('') + '-' + cells.slice(2, 4).join('') + '-' + cells.slice(4, 7).join('');
  }

  function paintCells() {
    cells.forEach(function (v, i) {
      var el = $('cell-' + i);
      if (!el) return;
      el.textContent = v;
      el.setAttribute('aria-pressed', i === activeCell ? 'true' : 'false');
      el.setAttribute('aria-label', '第' + (i + 1) + '格，当前是' + (v || '空'));
    });
    var preview = $('q2-preview');
    if (preview) preview.textContent = isBlankQ2() ? '格子还空着' : ('现在写成：' + codeFromCells());
  }

  function putDigit(d) {
    if (activeCell < 0 || activeCell > 6) activeCell = 0;
    cells[activeCell] = String(d);
    if (activeCell < 6) activeCell += 1;
    paintCells();
    saveExtras();
  }

  function showVariant(hostId, name) {
    var host = $(hostId);
    if (!host) return;
    var list = host.querySelectorAll('.fig-variant');
    for (var i = 0; i < list.length; i++) {
      list[i].hidden = list[i].getAttribute('data-name') !== name;
    }
  }

  function swapFig4(mode) {
    drawMode = mode || 'plain';
    showVariant('q4-fig', drawMode);
  }

  function recordExtras() {
    var r = report();
    if (r && r.updatePageExtras) {
      r.updatePageExtras({
        cells: cells.slice(),
        selected: Object.assign({}, selected),
        drawMode: drawMode,
        q8a: ($('q8-ab') || {}).value || '',
        q8b: ($('q8-all') || {}).value || ''
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

  function paint() {
    progress();
  }

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
    if (selected.q1 === answers.q1) markPass('q1', '对了。格子要从左边用0配齐。', selected.q1);
    else markMiss('q1', selected.q1);
  }
  function checkQ2() {
    if (isBlankQ2()) { fb('q2', '先把数字放进格子再核对。'); return; }
    var got = codeFromCells();
    if (got === answers.q2) markPass('q2', '对了。02-10-008，排桩中间的0留下来了。', got);
    else {
      if (got.indexOf('10') === -1 && (got.indexOf('01') !== -1 || got === '2-1-8' || got === '02-01-008' || got === '02-1-008')) {
        fb('q2', '排桩是10，中间那个0要留下，不能变成1。');
      } else if (got === '20-10-800' || got === '20-10-080' || got === '2-10-800') {
        fb('q2', '空着的格应补在左边，不要把0补到右边去。');
      } else {
        fb('q2', hintOf('q2'));
      }
      misses.q2 = (misses.q2 || 0) + 1;
      var r = report();
      if (r && r.miss) r.miss('q2', got);
      if (misses.q2 >= 2) showExplain('q2', true);
    }
  }
  function checkQ3() {
    if (isBlankQ3()) { fb('q3', '先选一个再核对。'); return; }
    if (selected.q3 === answers.q3) markPass('q3', '对了。三个泊位并不相同。', selected.q3);
    else markMiss('q3', selected.q3);
  }
  function checkQ4() {
    if (isBlankQ4()) { fb('q4', '两小问都选完再核对。空白先不算错。'); return; }
    if (selected.q4a === answers.q4a && selected.q4b === answers.q4b) {
      markPass('q4', '对了。直线向两端延长；线段的端点恰好在P、Q上。', selected.q4a + ',' + selected.q4b);
    } else markMiss('q4', (selected.q4a || '') + ',' + (selected.q4b || ''));
  }
  function checkQ5() {
    if (isBlankQ5()) { fb('q5', '先选一个再核对。'); return; }
    if (selected.q5 === answers.q5) markPass('q5', '对了。两端箭头表示直线还可以延伸，不能因此说它是射线。', selected.q5);
    else markMiss('q5', selected.q5);
  }
  function checkQ6() {
    if (isBlankQ6()) { fb('q6', '先选一个再核对。'); return; }
    if (selected.q6 === answers.q6) markPass('q6', '对了。绳子像线段；灯光只是可被画成射线的实物，它不会拐弯。', selected.q6);
    else markMiss('q6', selected.q6);
  }
  function checkQ7() {
    if (isBlankQ7()) { fb('q7', '先选一个再核对。'); return; }
    if (selected.q7 === answers.q7) markPass('q7', '对了。字写不全时，要先问清楚。', selected.q7);
    else markMiss('q7', selected.q7);
  }
  function checkQ8() {
    var a = String(($('q8-ab') || {}).value || '').trim();
    var b = String(($('q8-all') || {}).value || '').trim();
    if (isBlankQ8()) { fb('q8', '两处得数和第3小问都完成后再核对。空白先不算错。'); return; }
    var rec = a + ',' + b + ',' + selected.q8c;
    if (a === answers.q8a && b === answers.q8b && selected.q8c === answers.q8c) {
      markPass('q8', '对了。线段AB是8步，全程5＋8＋3＝16步。', rec);
    } else {
      if (a !== answers.q8a) fb('q8', '线段AB只指A到B中间这一段。');
      else if (b !== answers.q8b) fb('q8', '船还要走外侧一段、中间一段和里侧一段。把三段加起来。');
      else fb('q8', '只量两桩之间，两边延长线上的路还在不在里面？');
      misses.q8 = (misses.q8 || 0) + 1;
      var r = report();
      if (r && r.miss) r.miss('q8', rec);
      if (misses.q8 >= 2) showExplain('q8', true);
    }
  }

  var checkers = { q1: checkQ1, q2: checkQ2, q3: checkQ3, q4: checkQ4, q5: checkQ5, q6: checkQ6, q7: checkQ7, q8: checkQ8 };

  function resetQ(id) {
    solved[id] = false;
    misses[id] = 0;
    fb(id, '');
    showExplain(id, false);
    var box = $('box-' + id);
    if (box) box.classList.remove('done');
    if (id === 'q1' || id === 'q3' || id === 'q5' || id === 'q6' || id === 'q7') selected[id] = null;
    if (id === 'q4') { selected.q4a = null; selected.q4b = null; swapFig4('plain'); }
    if (id === 'q2') { cells = ['', '', '', '', '', '', '']; activeCell = 0; chosenDigit = null; paintCells(); }
    if (id === 'q8') {
      selected.q8c = null;
      if ($('q8-ab')) $('q8-ab').value = '';
      if ($('q8-all')) $('q8-all').value = '';
    }
    if (box) qsa('.choices button', box).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    saveExtras();
    progress();
  }

  function applyChoiceState() {
    Object.keys(selected).forEach(function (qid) {
      if (!selected[qid]) return;
      var root = document.querySelector('.choices[data-q="' + qid + '"]');
      if (!root) return;
      qsa('button', root).forEach(function (b) {
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
        if (extras.cells) cells = extras.cells.slice();
        if (extras.selected) selected = Object.assign(selected, extras.selected);
        if (extras.drawMode) swapFig4(extras.drawMode);
        if (extras.q8a && $('q8-ab')) $('q8-ab').value = extras.q8a;
        if (extras.q8b && $('q8-all')) $('q8-all').value = extras.q8b;
      }
    } catch (e) {}
    paintCells();
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
    if (qid === 'q4a') {
      var v = btn.getAttribute('data-value');
      swapFig4(v === 'A' ? 'segment' : v === 'B' ? 'ray' : v === 'C' ? 'line' : 'plain');
    }
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
    for (var i = 0; i < 7; i++) {
      (function (idx) {
        var el = $('cell-' + idx);
        if (!el) return;
        el.addEventListener('click', function () {
          if (solved.q2) return;
          activeCell = idx;
          if (chosenDigit !== null) {
            putDigit(chosenDigit);
            chosenDigit = null;
            qsa('.pad .chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
          } else paintCells();
        });
        el.addEventListener('dragover', function (e) { e.preventDefault(); el.classList.add('drop-over'); });
        el.addEventListener('dragleave', function () { el.classList.remove('drop-over'); });
        el.addEventListener('drop', function (e) {
          e.preventDefault();
          el.classList.remove('drop-over');
          if (solved.q2) return;
          var d = e.dataTransfer.getData('text/plain');
          if (d !== '') { activeCell = idx; putDigit(d); }
        });
      })(i);
    }
    qsa('.pad .chip').forEach(function (chip) {
      var d = chip.getAttribute('data-digit');
      chip.setAttribute('draggable', 'true');
      chip.addEventListener('click', function () {
        if (solved.q2) return;
        chosenDigit = d;
        qsa('.pad .chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        putDigit(d);
      });
      chip.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', d);
        chip.classList.add('dragging');
      });
      chip.addEventListener('dragend', function () { chip.classList.remove('dragging'); });
    });
    var clear = $('q2-clear-one');
    if (clear) clear.addEventListener('click', function () {
      if (solved.q2) return;
      cells[activeCell] = '';
      paintCells();
      saveExtras();
    });
    if ($('q8-ab')) $('q8-ab').addEventListener('input', saveExtras);
    if ($('q8-all')) $('q8-all').addEventListener('input', saveExtras);
    if ($('submit-work')) $('submit-work').onclick = function () {
      if (report() && report().submit) report().submit();
    };
  }

  bind();
  paintCells();

  if (window.SiteNav && SiteNav.mount) {
    window.SiteNav.mount({
      title: '浅湾埠练习',
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
  var mounted = KR && KR.mount ? KR.mount({ id: pageId, name: '浅湾埠的对桩灯配套练习', questions: questions, noButton: true }) : null;
  if (mounted && typeof mounted.then === 'function') mounted.then(restore);
  else restore();
  paint();

  window.QianwanPractice = {
    pageId: pageId,
    answers: answers,
    check: checkers,
    resetQ: resetQ,
    isBlank: { q1: isBlankQ1, q2: isBlankQ2, q3: isBlankQ3, q4: isBlankQ4, q5: isBlankQ5, q6: isBlankQ6, q7: isBlankQ7, q8: isBlankQ8 },
    _state: function () { return { cells: cells, selected: selected, solved: solved, misses: misses }; }
  };
})();
