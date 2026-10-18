/* 练习页引擎：主页、关卡地图、三阶段做题、右侧「我的解答」、星星。
   进度仍写回各页原来的 localStorage 键。 */
(function (global) {
  var PRAISE = ['对啦！', '真棒！', '完全正确！', '好厉害！', '你想清楚了！'];
  var STG = ['阅读理解', '分析解答', '回顾反思'];
  var cfg, app, S, TOTAL;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function starSVG(on) {
    return '<svg class="star" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" fill="' +
      (on ? '#ffc107' : '#e9ecef') + '" stroke="' + (on ? '#e09f00' : '#ced4da') + '" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  }
  function curQ() { return cfg.levels[S.L].qs[S.Q]; }
  function doneCount() { var n = 0; for (var k in S.prog) if (S.prog[k] > 0) n++; return n; }
  function totalStars() { var t = 0; for (var k in S.prog) t += S.prog[k] || 0; return t; }
  function lvStars(i) { var t = 0; cfg.levels[i].qs.forEach(function (q) { t += S.prog[q.id] || 0; }); return t; }
  function lvDone(i) { return cfg.levels[i].qs.every(function (q) { return S.prog[q.id] > 0; }); }

  function save() {
    try { localStorage.setItem(cfg.key, JSON.stringify(S.raw)); } catch (e) {}
  }
  function load() {
    var raw = {};
    var existed = false;
    try {
      var text = localStorage.getItem(cfg.key);
      existed = text != null && text !== '';
      raw = text ? JSON.parse(text) : {};
      if (!raw || typeof raw !== 'object') raw = {};
    } catch (e) { raw = {}; existed = false; }
    var changed = false;
    S.prog = {};
    if (cfg.shape === 'map') {
      Object.keys(raw).forEach(function (k) {
        var row = raw[k];
        if (!row || typeof row !== 'object' || Array.isArray(row)) return;
        if (row.correct && !row.stars) { row.stars = 3; changed = true; }
        if (row.stars) S.prog[k] = row.stars;
      });
    } else {
      if (!raw.correct || typeof raw.correct !== 'object') { raw.correct = {}; changed = true; }
      if (!raw.draft || typeof raw.draft !== 'object') { raw.draft = {}; changed = true; }
      if (typeof raw.bars !== 'number') { raw.bars = 0; changed = true; }
      if (typeof raw.rev !== 'number') { raw.rev = 0; changed = true; }
      if (!raw.stars || typeof raw.stars !== 'object') { raw.stars = {}; changed = true; }
      Object.keys(raw.correct).forEach(function (k) {
        if (raw.correct[k] && !raw.stars[k]) { raw.stars[k] = 3; changed = true; }
      });
      Object.keys(raw.stars).forEach(function (k) { if (raw.stars[k]) S.prog[k] = raw.stars[k]; });
    }
    S.raw = raw;
    if (existed && changed) save();
  }
  function award(id, stars) {
    S.prog[id] = Math.max(S.prog[id] || 0, stars);
    if (cfg.shape === 'map') {
      if (!S.raw[id] || typeof S.raw[id] !== 'object' || Array.isArray(S.raw[id])) S.raw[id] = {};
      S.raw[id].correct = true;
      S.raw[id].stars = S.prog[id];
    } else {
      S.raw.correct[String(id)] = true;
      S.raw.stars[String(id)] = S.prog[id];
    }
    save();
  }
  function legacyIds() {
    var ids = [];
    if (cfg.shape === 'map') {
      Object.keys(S.raw).forEach(function (k) { if (S.raw[k] && S.raw[k].correct) ids.push(k); });
    } else {
      Object.keys(S.raw.correct || {}).forEach(function (k) { if (S.raw.correct[k]) ids.push(k); });
    }
    return ids;
  }

  function header() {
    var d = doneCount();
    return '<div class="hdr">' +
      '<a class="hbtn" href="../index.html">🏠 回总目录</a>' +
      '<button type="button" class="hbtn" data-act="home">本页开头</button>' +
      '<button type="button" class="hbtn" data-act="map">关卡</button>' +
      '<div class="htitle">' + esc(cfg.title) + '</div>' +
      '<div class="prog"><div class="pbar"><div class="pfill" style="width:' + (TOTAL ? d / TOTAL * 100 : 0) + '%"></div></div>' +
      '<div class="ptxt">已完成 ' + d + ' / ' + TOTAL + ' 题</div></div>' +
      '<div class="stars">★ <span id="starN">' + totalStars() + '</span></div>' +
      '<button type="button" class="hbtn" data-act="report">交作业</button></div>';
  }
  function paintProg() {
    var d = doneCount();
    var pf = $('.pfill'); if (pf) pf.style.width = (TOTAL ? d / TOTAL * 100 : 0) + '%';
    var pt = $('.ptxt'); if (pt) pt.textContent = '已完成 ' + d + ' / ' + TOTAL + ' 题';
    var sn = $('#starN'); if (sn) sn.textContent = String(totalStars());
  }

  function fitHeader() {
    var hdr = app && app.querySelector('.hdr');
    if (!hdr) return;
    var h = hdr.offsetHeight;
    app.style.paddingTop = h + 'px';
    document.documentElement.style.setProperty('--hdr-h', h + 'px');
  }
  function render() {
    if (S.screen === 'home') renderHome();
    else if (S.screen === 'map') renderMap();
    else renderQ();
    fitHeader();
    window.scrollTo(0, 0);
  }
  window.addEventListener('resize', fitHeader);
  function renderHome() {
    var pts = (cfg.home.points || []).map(function (p) {
      return '<div><span class="no">' + esc(p.n) + '</span><b>' + esc(p.t) + '</b><small>' + esc(p.d) + '</small></div>';
    }).join('');
    app.innerHTML = header() +
      '<h1>' + esc(cfg.home.h1) + '</h1><div class="sub">' + esc(cfg.home.sub) + '</div>' +
      '<div class="card"><div class="three">' + pts + '</div>' +
      '<div class="flow"><span>阅读理解</span><i>→</i><span>分析解答</span><i>→</i><span>回顾反思</span></div></div>' +
      '<div id="extra">' + (cfg.homeHTML || '') + '</div>' +
      '<button type="button" class="bigbtn" data-act="map">开始闯关 ▶</button>' +
      '<p style="text-align:center"><button type="button" class="linkbtn" data-act="reset">清空进度</button></p>';
    if (cfg.bindHome) cfg.bindHome({ raw: function () { return S.raw; }, save: save });
  }
  function renderMap() {
    var h = header() + '<h1 style="font-size:28px">选一关开始吧</h1>';
    if (S.celebrate) {
      h += '<div class="card endbox"><div class="prompt">全部闯完了，一共 ★ ' + totalStars() + '</div>' +
        '<p>没看讲解是 3 颗星，看了 1 次是 2 颗星，看了更多是 1 颗星。可以再进关卡刷新星星。</p></div>';
    }
    h += '<div class="levels">';
    cfg.levels.forEach(function (l, i) {
      var max = l.qs.length * 3;
      h += '<button type="button" class="lv' + (lvDone(i) ? ' done' : '') + '" data-act="level" data-i="' + i + '">' +
        '<div class="ic">' + l.icon + '</div><div><b>' + esc(l.name) + '</b><small>' + esc(l.desc) + '</small>' +
        '<div class="lvst">★ ' + lvStars(i) + ' / ' + max + ' · ' + l.qs.length + ' 题</div></div></button>';
    });
    app.innerHTML = h + '</div>';
  }
  function renderQ() {
    var q = curQ();
    var l = cfg.levels[S.L];
    app.innerHTML = header() +
      '<div class="qtext"><div class="qt">' + esc(l.name) + ' · 第 ' + (S.Q + 1) + ' / ' + l.qs.length + ' 题</div>' +
      '<div class="qh">' + esc(q.title) + '</div><div>' + esc(q.text) + '</div></div>' +
      '<div class="stages" id="stages"></div>' +
      '<div class="layout"><div><div class="card" id="step"></div></div>' +
      '<aside class="board' + (S.dockShut ? ' shut' : '') + '" id="board"><h3>我的解答</h3>' +
      '<button type="button" class="btn" id="dockBtn" data-act="dock"></button><div class="bbody" id="bbody"></div></aside></div>';
    renderBoard();
    renderStep();
  }
  function setStages(n) {
    var e = $('#stages'); if (!e) return;
    e.innerHTML = STG.map(function (name, i) {
      return '<span class="' + (i === n ? 'on' : (i < n ? 'past' : '')) + '">' + name + '</span>';
    }).join('<i>→</i>');
  }
  function renderBoard() {
    var body = $('#bbody'); if (!body) return;
    if (!S.board.length) body.innerHTML = '<p class="empty">做对一步，这里就多一行。</p>';
    else body.innerHTML = S.board.map(function (row, i) {
      return '<div class="bstep"><span class="bn">' + (i + 1) + '</span><div><b>' + esc(row[0]) + '</b>' +
        (row[1] ? '<small>' + esc(row[1]) + '</small>' : '') + '</div></div>';
    }).join('');
    var btn = $('#dockBtn');
    if (btn) btn.textContent = (S.dockShut ? '打开' : '收起') + '我的解答 · ' + S.board.length + ' 行';
  }
  function paintDock() {
    var board = $('#board');
    if (!board) return;
    board.classList.toggle('shut', !!S.dockShut);
    renderBoard();
  }

  function fb(cls, text) {
    var e = $('#fb'); if (e) e.innerHTML = '<div class="' + cls + '">' + text + '</div>';
  }
  function nextBtn() {
    var box = $('#btns'); if (!box) return;
    box.innerHTML = '<button type="button" class="btn go" id="nextB">下一步 ▶</button>';
    $('#nextB').onclick = function () { nextStep(); };
  }
  function nextStep() {
    S.si++;
    renderStep();
    var s = $('#step');
    if (s) { try { s.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {} }
  }
  function complete(st, explained) {
    S.busy = true;
    if (explained) S.exp++;
    if (st.line) S.board.push([st.line, st.note || '']);
    renderBoard();
    if (!explained) fb('good', '✓ ' + pick(PRAISE));
    nextBtn();
  }
  function wrong(st, hint, reveal) {
    S.att++;
    if (global.KejianReport) global.KejianReport.miss(curQ().id, S._lastWrong || '答错');
    if (S.att === 1 && hint) { fb('hint', '💡 提示：' + esc(hint) + ' 再试一次！'); return false; }
    fb('exp', '📖 讲解：' + esc(st.exp || ''));
    if (reveal) reveal();
    complete(st, true);
    return true;
  }

  var KP = { blanks: [], cur: 0, onEnter: null };
  function padHTML() {
    var keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'clr', 0, 'del'];
    return '<div class="pad">' + keys.map(function (k) {
      var label = k === 'del' ? '⌫' : (k === 'clr' ? '清空' : k);
      return '<button type="button" class="' + (k === 'del' || k === 'clr' ? 'del' : '') + '" data-k="' + k + '">' + label + '</button>';
    }).join('') + '</div>';
  }
  function bindPad(root) {
    $$('.pad button', root).forEach(function (btn) {
      btn.onclick = function () { padKey(btn.getAttribute('data-k')); };
    });
    $$('.blank', root).forEach(function (bl, i) {
      bl.onclick = function () { if (!S.busy) focusBlank(i); };
    });
  }
  function focusBlank(i) {
    KP.cur = i;
    KP.blanks.forEach(function (b, j) { b.classList.toggle('focus', j === i); });
  }
  function padKey(k) {
    if (S.busy) return;
    var b = KP.blanks[KP.cur]; if (!b || b.classList.contains('ok')) return;
    b.classList.remove('bad');
    var v = b.textContent;
    if (k === 'del') v = v.slice(0, -1);
    else if (k === 'clr') v = '';
    else if (v.length < 6) v = (v === '0' ? '' : v) + k;
    b.textContent = v;
  }
  document.addEventListener('keydown', function (e) {
    if (!KP.blanks.length || !document.body.contains(KP.blanks[0])) return;
    if (/^[0-9]$/.test(e.key)) { padKey(e.key); e.preventDefault(); }
    else if (e.key === 'Backspace') { padKey('del'); e.preventDefault(); }
    else if (e.key === 'Enter' && KP.onEnter) { KP.onEnter(); e.preventDefault(); }
  });

  function stChoice(st, root) {
    root.innerHTML = '<div class="opts">' + st.opts.map(function (o, i) {
      return '<button type="button" class="opt' + (st.center ? ' c' : '') + '" data-i="' + i + '">' + esc(o) + '</button>';
    }).join('') + '</div>';
    $$('.opt', root).forEach(function (btn) {
      btn.onclick = function () {
        if (S.busy) return;
        var i = +btn.getAttribute('data-i');
        if (i === st.a) {
          btn.classList.add('ok');
          $$('.opt', root).forEach(function (x) { x.disabled = true; });
          complete(st, false);
        } else {
          btn.classList.remove('bad'); void btn.offsetWidth; btn.classList.add('bad');
          S._lastWrong = '选了「' + st.opts[i] + '」';
          wrong(st, st.hint, function () {
            $$('.opt', root)[st.a].classList.add('ok');
            $$('.opt', root).forEach(function (x) { x.disabled = true; });
          });
        }
      };
    });
  }
  function stNum(st, root) {
    var html = '<div class="eqs"><div class="eqline">' + esc(st.expr) + ' <span class="blank"></span></div>';
    if (st.units) {
      html += '<div class="units">' + st.units.map(function (u) {
        return '<button type="button" class="unit" data-u="' + esc(u) + '">' + esc(u) + '</button>';
      }).join('') + '</div>';
    }
    root.innerHTML = html + '</div>' + padHTML();
    var unit = '';
    $$('.unit', root).forEach(function (u) {
      u.onclick = function () {
        if (S.busy) return;
        $$('.unit', root).forEach(function (x) { x.classList.remove('sel', 'bad'); });
        u.classList.add('sel');
        unit = u.getAttribute('data-u');
      };
    });
    KP.blanks = $$('.blank', root);
    bindPad(root);
    focusBlank(0);
    $('#btns').innerHTML = '<button type="button" class="btn" id="chk">检查 ✓</button>';
    var check = function () {
      if (S.busy) return;
      var bl = KP.blanks[0];
      var v = bl.textContent;
      if (v === '') { fb('hint', '先用下面的数字键填上得数。'); return; }
      if (st.units && !unit) { fb('hint', '再点一个单位。'); return; }
      var nOk = +v === st.a;
      var uOk = !st.units || unit === st.u;
      bl.classList.add(nOk ? 'ok' : 'bad');
      if (st.units) {
        var us = $('.unit.sel', root);
        if (us) us.classList.add(uOk ? 'ok' : 'bad');
      }
      if (nOk && uOk) { complete(st, false); return; }
      S._lastWrong = '填了 ' + v + (unit || '');
      wrong(st, nOk ? (st.uhint || '单位要和问题一致。') : st.hint, function () {
        bl.textContent = String(st.a);
        bl.classList.remove('bad'); bl.classList.add('ok');
        if (st.units) $$('.unit', root).forEach(function (x) {
          x.classList.remove('sel', 'bad');
          if (x.getAttribute('data-u') === st.u) x.classList.add('ok');
        });
      });
    };
    $('#chk').onclick = check;
    KP.onEnter = check;
  }
  function lineHTML(line) {
    var parts = String(line).split('{}');
    var html = esc(parts[0]);
    for (var i = 1; i < parts.length; i++) html += '<span class="blank"></span>' + esc(parts[i]);
    return html;
  }
  function stBlanks(st, root) {
    root.innerHTML = '<div class="eqs">' + st.lines.map(function (l) {
      return '<div class="eqline">' + lineHTML(l) + '</div>';
    }).join('') + '</div>' + padHTML();
    KP.blanks = $$('.blank', root);
    bindPad(root);
    focusBlank(0);
    $('#btns').innerHTML = '<button type="button" class="btn" id="chk">检查 ✓</button>';
    var check = function () {
      if (S.busy) return;
      var empty = -1;
      KP.blanks.forEach(function (x, i) { if (empty < 0 && x.textContent === '') empty = i; });
      if (empty >= 0) { fb('hint', '还有空没填。点一下方框可以换位置。'); focusBlank(empty); return; }
      var all = true;
      KP.blanks.forEach(function (x, i) {
        if (+x.textContent === st.a[i]) x.classList.add('ok');
        else { x.classList.add('bad'); all = false; }
      });
      if (all) { complete(st, false); return; }
      S._lastWrong = '填了 ' + KP.blanks.map(function (x) { return x.textContent || '空'; }).join('、');
      wrong(st, st.hint, function () {
        KP.blanks.forEach(function (x, i) {
          x.textContent = String(st.a[i]);
          x.classList.remove('bad'); x.classList.add('ok');
        });
      });
    };
    $('#chk').onclick = check;
    KP.onEnter = check;
  }
  function stCompares(st, root) {
    root.innerHTML = st.rows.map(function (r, i) {
      return '<div class="cmp" data-i="' + i + '"><div class="lab">' + esc(r.t) + '</div><div class="signs">' +
        ['>', '<', '='].map(function (s) {
          return '<button type="button" class="opt c" data-s="' + esc(s) + '">' + esc(s) + '</button>';
        }).join('') + '</div></div>';
    }).join('');
    $$('.signs button', root).forEach(function (btn) {
      btn.onclick = function () {
        if (S.busy) return;
        $$('button', btn.parentNode).forEach(function (b) { b.classList.remove('sel'); });
        btn.classList.add('sel');
      };
    });
    $('#btns').innerHTML = '<button type="button" class="btn" id="chk">检查 ✓</button>';
    $('#chk').onclick = function () {
      if (S.busy) return;
      var rows = $$('.cmp', root);
      var missing = rows.some(function (row) { return !row.querySelector('.sel'); });
      if (missing) { fb('hint', '每个 ○ 都要选。'); return; }
      var all = true;
      var wrongs = [];
      rows.forEach(function (row, i) {
        var sel = row.querySelector('.sel');
        var sign = sel.getAttribute('data-s');
        var ok = sign === st.rows[i].a;
        sel.classList.add(ok ? 'ok' : 'bad');
        if (!ok) { all = false; wrongs.push(st.rows[i].t + ' 选成 ' + sign); }
      });
      if (all) { complete(st, false); return; }
      S._lastWrong = wrongs.join('；');
      wrong(st, st.hint, function () {
        rows.forEach(function (row, i) {
          $$('button', row).forEach(function (b) {
            b.classList.remove('sel', 'bad', 'ok');
            if (b.getAttribute('data-s') === st.rows[i].a) b.classList.add('ok');
          });
        });
      });
    };
  }
  function stSort(st, root) {
    S.picked = [];
    function draw() {
      var slots = st.order.map(function (_, i) {
        var label = S.picked[i] ? S.picked[i] : ('第 ' + (i + 1) + ' 个（从大到小）');
        return '<button type="button" class="slot" data-i="' + i + '">' + esc(label) + '</button>';
      }).join('');
      var pool = st.items.filter(function (it) { return S.picked.indexOf(it) < 0; }).map(function (it) {
        return '<button type="button" class="opt" data-item="' + esc(it) + '">' + esc(it) + '</button>';
      }).join('');
      root.innerHTML = '<div class="slots">' + slots + '</div><div class="pool">' + pool + '</div>';
      $$('.slot', root).forEach(function (btn) {
        btn.onclick = function () {
          if (S.busy) return;
          var i = +btn.getAttribute('data-i');
          if (S.picked[i]) { S.picked.splice(i, 1); draw(); }
        };
      });
      $$('.pool .opt', root).forEach(function (btn) {
        btn.onclick = function () {
          if (S.busy || S.picked.length >= st.order.length) return;
          S.picked.push(btn.getAttribute('data-item'));
          draw();
        };
      });
    }
    draw();
    $('#btns').innerHTML = '<button type="button" class="btn" id="chk">检查 ✓</button>';
    $('#chk').onclick = function () {
      if (S.busy) return;
      if (S.picked.length < st.order.length) { fb('hint', '还没排满，点长度放进格子。'); return; }
      var ok = S.picked.every(function (it, i) { return it === st.order[i]; });
      if (ok) {
        $$('.slot', root).forEach(function (s) { s.classList.add('ok'); });
        complete(st, false);
        return;
      }
      $$('.slot', root).forEach(function (s, i) { if (S.picked[i] !== st.order[i]) s.classList.add('bad'); });
      S._lastWrong = '排成 ' + S.picked.join('、');
      wrong(st, st.hint, function () {
        S.picked = st.order.slice();
        draw();
        $$('.slot', root).forEach(function (s) { s.classList.add('ok'); });
      });
    };
  }
  function stMix(st, root) {
    root.innerHTML = '<div class="eqs">' + st.lines.map(function (l) {
      return '<div class="eqline">' + lineHTML(l) + '</div>';
    }).join('') + '</div>' + padHTML() +
      '<p class="prompt" style="margin-top:12px">' + esc(st.choice.q) + '</p><div class="opts">' +
      st.choice.opts.map(function (o, i) {
        return '<button type="button" class="opt" data-i="' + i + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
    var chosen = -1;
    $$('.opt', root).forEach(function (btn) {
      btn.onclick = function () {
        if (S.busy) return;
        chosen = +btn.getAttribute('data-i');
        $$('.opt', root).forEach(function (x) { x.classList.remove('sel'); });
        btn.classList.add('sel');
      };
    });
    KP.blanks = $$('.blank', root);
    bindPad(root);
    focusBlank(0);
    $('#btns').innerHTML = '<button type="button" class="btn" id="chk">检查 ✓</button>';
    var check = function () {
      if (S.busy) return;
      var empty = KP.blanks.some(function (x) { return x.textContent === ''; });
      if (empty) { fb('hint', '先填得数。'); return; }
      if (chosen < 0) { fb('hint', '再选能不能到达。'); return; }
      var numsOk = KP.blanks.every(function (x, i) { return +x.textContent === st.a[i]; });
      var chOk = chosen === st.choice.a;
      KP.blanks.forEach(function (x, i) { x.classList.add(+x.textContent === st.a[i] ? 'ok' : 'bad'); });
      $$('.opt', root)[chosen].classList.add(chOk ? 'ok' : 'bad');
      if (numsOk && chOk) { complete(st, false); return; }
      S._lastWrong = '填了 ' + KP.blanks.map(function (x) { return x.textContent; }).join('、') + '，选了「' + st.choice.opts[chosen] + '」';
      wrong(st, st.hint, function () {
        KP.blanks.forEach(function (x, i) { x.textContent = String(st.a[i]); x.classList.remove('bad'); x.classList.add('ok'); });
        $$('.opt', root).forEach(function (x, i) { x.classList.remove('bad', 'sel'); if (i === st.choice.a) x.classList.add('ok'); });
      });
    };
    $('#chk').onclick = check;
    KP.onEnter = check;
  }

  function diagramPack(st, step) {
    if (st.kind === 'caps') {
      return { max: st.caps.length - 1, cap: st.caps[step], html: '' };
    }
    if (st.kind === 'rope') {
      var caps = ['一根彩绳，总长 90 厘米。', '先出现一段：8 厘米。', '同样的一段一共 3 段。', '虚线的那一段才是 ?。'];
      var boxes = '';
      var n = step >= 2 ? 3 : (step >= 1 ? 1 : 0);
      for (var i = 0; i < n; i++) boxes += '<rect x="' + (24 + i * 36) + '" y="70" width="30" height="36" rx="4" fill="#ffb4a2"/><text x="' + (39 + i * 36) + '" y="94" text-anchor="middle" font-size="16" fill="#7a2e1b">8</text>';
      if (step >= 3) boxes += '<rect x="132" y="70" width="200" height="36" rx="6" fill="#fff" stroke="#2fa36b" stroke-width="3" stroke-dasharray="7 4"/><text x="232" y="94" text-anchor="middle" font-size="22" fill="#2fa36b">?</text>';
      var html = '<svg viewBox="0 0 360 150"><rect width="360" height="150" rx="16" fill="#fff8ee"/><text x="180" y="36" text-anchor="middle" font-size="20" fill="#7a4b00">总长 90 厘米</text>' + boxes + '</svg>';
      return { max: 3, cap: caps[step], html: html };
    }
    if (st.kind === 'bear') {
      var caps2 = ['小兔这一段是 7 个。', '小熊第 1 段也是 7 个。', '第 2 段还是 7 个。', '第 3 段还是 7 个。', '第 4 段也是 7 个。4 段同样多，就是 4 倍。'];
      var rabbit = '<text x="16" y="48" font-size="18" fill="#7a4b00">小兔</text><rect x="70" y="24" width="64" height="32" rx="5" fill="#ffd43b"/><text x="102" y="46" text-anchor="middle" font-size="16">7个</text>';
      var bear = '<text x="16" y="108" font-size="18" fill="#7a4b00">小熊</text>';
      for (var b = 0; b < step; b++) {
        bear += '<rect x="' + (70 + b * 70) + '" y="84" width="64" height="32" rx="5" fill="' + (b % 2 ? '#ffe066' : '#ffd43b') + '"/><text x="' + (102 + b * 70) + '" y="106" text-anchor="middle" font-size="16">7个</text>';
      }
      return { max: 4, cap: caps2[step], html: '<svg viewBox="0 0 360 150"><rect width="360" height="150" rx="16" fill="#f3f7ff"/>' + rabbit + bear + '</svg>' };
    }
    if (st.kind === 'blue') {
      var caps3 = ['红绳是 25 厘米。', '蓝绳先有同样的 25 厘米。', '再多出 16 厘米这一截，不是 16 倍。'];
      var red = '<text x="12" y="46" font-size="18" fill="#c92a2a">红绳</text><rect x="70" y="22" width="160" height="32" rx="5" fill="#ff8787"/><text x="150" y="44" text-anchor="middle" font-size="16" fill="#fff">25 厘米</text>';
      var blue = '';
      if (step >= 1) blue += '<text x="12" y="108" font-size="18" fill="#1c7ed6">蓝绳</text><rect x="70" y="84" width="160" height="32" rx="5" fill="#ff8787"/><text x="150" y="106" text-anchor="middle" font-size="16" fill="#fff">25 厘米</text>';
      if (step >= 2) blue += '<rect x="232" y="84" width="100" height="32" rx="5" fill="#74c0fc"/><text x="282" y="106" text-anchor="middle" font-size="16">16 厘米</text>';
      return { max: 2, cap: caps3[step], html: '<svg viewBox="0 0 360 150"><rect width="360" height="150" rx="16" fill="#fff4f0"/>' + red + blue + '</svg>' };
    }
    if (st.kind === 'bars') {
      var chunk = st.step || 1;
      var chunks = Math.ceil(st.n / chunk);
      var shown = Math.min(st.n, (step + 1) * chunk);
      var cells = '';
      var visual = Math.min(shown, 10);
      for (var c = 0; c < visual; c++) cells += '<rect x="' + (16 + (c % 5) * 66) + '" y="' + (c < 5 ? 24 : 78) + '" width="58" height="44" rx="8" fill="#cfe8ff" stroke="#224488" stroke-width="2"/><text x="' + (45 + (c % 5) * 66) + '" y="' + (c < 5 ? 52 : 106) + '" text-anchor="middle" font-size="14" fill="#1d3f8a">10厘米</text>';
      return {
        max: chunks - 1,
        cap: shown + ' 根分米条 = ' + shown + ' 分米 = ' + (shown * 10) + ' 厘米',
        html: '<svg viewBox="0 0 360 140"><rect width="360" height="140" rx="16" fill="#f5f9ff"/>' + cells + '</svg>'
      };
    }
    if (st.kind === 'stairs') {
      var names = ['千米', '米', '分米', '厘米', '毫米'];
      var jumps = ['', '×1000', '×10', '×10', '×10'];
      var bits = '';
      for (var s = 0; s <= step && s < 5; s++) {
        bits += '<rect x="' + (20 + s * 18) + '" y="' + (24 + s * 22) + '" width="120" height="36" rx="8" fill="' + (s === step ? '#ffd166' : '#fff') + '" stroke="#e0a800"/><text x="' + (80 + s * 18) + '" y="' + (48 + s * 22) + '" text-anchor="middle" font-size="18" fill="#7a4b00">' + names[s] + (jumps[s] && s ? '  ' + jumps[s] : '') + '</text>';
      }
      var cap = step === 0 ? '从千米开始，往下是更小的单位。' : ('到「' + names[step] + '」：下楼 ' + jumps[step] + '，上楼就用除法。');
      return { max: 4, cap: cap, html: '<svg viewBox="0 0 360 180"><rect width="360" height="180" rx="16" fill="#fff6e8"/>' + bits + '</svg>' };
    }
    if (st.kind === 'ruler') {
      var capsR = ['尺子的 0 在最左边。', '纸条左端对着 3 厘米。', '右端对着 8 厘米 5 毫米。', '长度要用右端减去左端，先化成毫米。'];
      var marks = '<line x1="30" y1="70" x2="330" y2="70" stroke="#222" stroke-width="4"/>';
      for (var m = 0; m <= 10; m++) marks += '<line x1="' + (30 + m * 30) + '" y1="58" x2="' + (30 + m * 30) + '" y2="82" stroke="#222" stroke-width="2"/><text x="' + (30 + m * 30) + '" y="100" text-anchor="middle" font-size="12">' + m + '</text>';
      if (step >= 1) marks += '<path d="M120 48 v-16" stroke="#c92a2a" stroke-width="3"/><text x="120" y="24" text-anchor="middle" fill="#c92a2a" font-size="14">左 3 厘米</text>';
      if (step >= 2) marks += '<path d="M285 48 v-16" stroke="#1c7ed6" stroke-width="3"/><text x="250" y="24" text-anchor="middle" fill="#1c7ed6" font-size="14">右 8 厘米 5 毫米</text>';
      return { max: 3, cap: capsR[step], html: '<svg viewBox="0 0 360 120"><rect width="360" height="120" rx="16" fill="#fff8ee"/>' + marks + '</svg>' };
    }
    return { max: 0, cap: '', html: '' };
  }
  function stDiagram(st, root) {
    S.dstep = 0;
    function draw() {
      var pack = diagramPack(st, S.dstep);
      root.innerHTML = '<div class="fig">' + pack.html + '</div><p class="cap">' + esc(pack.cap) + '</p>';
      var last = S.dstep >= pack.max;
      $('#btns').innerHTML = '<button type="button" class="btn' + (last ? ' go' : '') + '" id="dn">' +
        (last ? '看懂了，继续 ▶' : ('下一步 ▶（' + (S.dstep + 1) + '/' + (pack.max + 1) + '）')) + '</button>';
      $('#dn').onclick = function () {
        if (!last && S.dstep < pack.max) { S.dstep++; draw(); return; }
        if (st.line) { S.board.push([st.line, '']); renderBoard(); }
        nextStep();
      };
    }
    draw();
  }

  function renderStep() {
    var q = curQ();
    var st = q.steps[S.si];
    if (!st) { finishQ(); return; }
    S.busy = false;
    S.att = 0;
    KP.blanks = [];
    KP.onEnter = null;
    setStages(st.stage);
    var host = $('#step');
    host.innerHTML = '<div class="prompt" id="sp"></div><div id="sbody"></div><div id="fb"></div><div class="row" id="btns"></div>';
    $('#sp').textContent = st.p || '';
    var body = $('#sbody');
    if (st.type === 'choice') stChoice(st, body);
    else if (st.type === 'num') stNum(st, body);
    else if (st.type === 'blanks') stBlanks(st, body);
    else if (st.type === 'compares') stCompares(st, body);
    else if (st.type === 'sort') stSort(st, body);
    else if (st.type === 'mix') stMix(st, body);
    else if (st.type === 'diagram') stDiagram(st, body);
  }
  function finishQ() {
    var q = curQ();
    var l = cfg.levels[S.L];
    var stars = S.exp === 0 ? 3 : (S.exp === 1 ? 2 : 1);
    award(q.id, stars);
    if (global.KejianReport) global.KejianReport.pass(q.id);
    setStages(3);
    paintProg();
    var last = S.Q >= l.qs.length - 1;
    var actions = '';
    if (!last) actions = '<button type="button" class="btn go" data-act="nextq">下一题 ▶</button>';
    else if (S.L < cfg.levels.length - 1) actions = '<button type="button" class="btn go" data-act="level" data-i="' + (S.L + 1) + '">下一关 ▶</button>';
    else actions = '<button type="button" class="btn go" data-act="alldone">完成全部</button>';
    actions += '<button type="button" class="btn" data-act="map">回关卡地图</button>';
    $('#step').innerHTML = '<div class="endbox"><div class="prompt">第 ' + (S.Q + 1) + ' 题完成</div><div class="endstars">' +
      [0, 1, 2].map(function (i) { return starSVG(i < stars); }).join('') + '</div>' +
      '<div>' + (stars === 3 ? '一次讲解都没看，太棒了！' : '看了讲解也没关系，下次试着自己想出来。') + '</div>' +
      (last ? '<div class="sum">' + esc(l.sum) + '</div>' : '') +
      '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px">' + actions + '</div></div>';
  }
  function resetAll() {
    if (!confirm('确定清空这台手机上的做题进度吗？')) return;
    try { localStorage.removeItem(cfg.key); } catch (e) {}
    if (global.KejianReport) global.KejianReport.clear();
    location.reload();
  }
  function startQ() {
    S.si = 0; S.att = 0; S.exp = 0; S.board = []; S.busy = false; S.screen = 'q';
    renderQ();
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t || !app || !app.contains(t)) return;
    var act = t.getAttribute('data-act');
    if (act === 'home') { S.screen = 'home'; render(); }
    else if (act === 'map') { S.screen = 'map'; render(); }
    else if (act === 'level') { S.L = +t.getAttribute('data-i'); S.Q = 0; startQ(); }
    else if (act === 'nextq') { S.Q++; startQ(); }
    else if (act === 'dock') { S.dockShut = !S.dockShut; paintDock(); }
    else if (act === 'report') { if (global.KejianReport && global.KejianReport.open) global.KejianReport.open(); }
    else if (act === 'reset') resetAll();
    else if (act === 'alldone') { S.celebrate = true; S.screen = 'map'; render(); }
  });

  function start(options) {
    cfg = options;
    app = document.getElementById('app');
    TOTAL = 0;
    cfg.levels.forEach(function (l) { TOTAL += l.qs.length; });
    S = { screen: 'home', L: 0, Q: 0, si: 0, att: 0, exp: 0, board: [], prog: {}, raw: {}, dockShut: false, celebrate: false };
    try { S.dockShut = window.matchMedia('(max-width:800px)').matches; } catch (e) {}
    load();
    if (global.KejianReport && cfg.report) {
      global.KejianReport.mount({
        id: cfg.report.id,
        name: cfg.report.name,
        questions: cfg.report.questions,
        legacySolved: legacyIds(),
        noButton: true
      });
    }
    render();
  }

  global.KejianPlay = { start: start };
})(window);
