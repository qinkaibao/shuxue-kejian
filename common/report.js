/* 成绩单。新的故事或练习若会判对错，引入本文件并调用 KejianReport。
   记录写在单独的 localStorage 键 kejian-report-v1:<页面id>，不改各页原来的进度键。 */
(function (global) {
  var PREFIX = 'kejian-report-v1:';
  var ATTEMPTS_MAX = 500;
  var current = '';
  var opts = null;
  var styled = false;

  function sid(id) { return String(id); }

  function empty() {
    return { misses: {}, firstWrong: {}, solved: {}, legacy: {}, history: [], attempts: [] };
  }

  function storageKey() { return PREFIX + current; }

  function load() {
    var data = empty();
    if (!current) return data;
    try {
      var raw = localStorage.getItem(storageKey());
      if (!raw) return data;
      var o = JSON.parse(raw);
      if (!o || typeof o !== 'object') return data;
      if (o.misses && typeof o.misses === 'object') data.misses = o.misses;
      if (o.firstWrong && typeof o.firstWrong === 'object') data.firstWrong = o.firstWrong;
      if (o.solved && typeof o.solved === 'object') data.solved = o.solved;
      if (o.legacy && typeof o.legacy === 'object') data.legacy = o.legacy;
      if (Array.isArray(o.history)) data.history = o.history;
      if (Array.isArray(o.attempts)) data.attempts = o.attempts;
    } catch (e) {}
    return data;
  }

  function save(data) {
    if (!current) return;
    try { localStorage.setItem(storageKey(), JSON.stringify(data)); } catch (e) {}
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function nowText() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function fileStamp() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes());
  }

  function safeFileName(s) {
    return String(s == null ? '' : s).replace(/[\\/:*?"<>|\s]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || '练习';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function trimAnswer(answer) {
    return String(answer == null ? '' : answer).replace(/\s+/g, ' ').slice(0, 200);
  }

  function pushAttempt(data, id, ok, answer) {
    if (!Array.isArray(data.attempts)) data.attempts = [];
    data.attempts.push({
      id: id,
      ok: !!ok,
      answer: trimAnswer(answer),
      at: nowText()
    });
    if (data.attempts.length > ATTEMPTS_MAX) {
      data.attempts = data.attempts.slice(data.attempts.length - ATTEMPTS_MAX);
    }
  }

  function statusOf(q, data) {
    var id = sid(q.id);
    var misses = data.misses[id] || 0;
    var wrong = data.firstWrong[id] || '';
    if (data.solved[id]) {
      if (misses === 0 && !wrong) return { label: '一次对', kind: 'once', wrong: '' };
      var n = misses > 0 ? misses + 1 : 2;
      return { label: '第' + n + '次对', kind: 'later', wrong: wrong };
    }
    if (data.legacy[id] && misses === 0 && !wrong) {
      return { label: '已对（接入前完成）', kind: 'old', wrong: '' };
    }
    return { label: '未对', kind: 'no', wrong: wrong };
  }

  function summarize() {
    var data = load();
    var questions = (opts && opts.questions) || [];
    var rows = [];
    var once = 0, later = 0, none = 0, old = 0, correct = 0;
    for (var i = 0; i < questions.length; i++) {
      var st = statusOf(questions[i], data);
      if (st.kind === 'once') { once++; correct++; }
      else if (st.kind === 'later') { later++; correct++; }
      else if (st.kind === 'old') { old++; correct++; }
      else none++;
      rows.push({ q: questions[i], st: st, no: i + 1 });
    }
    return {
      rows: rows,
      total: questions.length,
      correct: correct,
      once: once,
      later: later,
      none: none,
      old: old,
      when: nowText(),
      name: (opts && opts.name) || '练习',
      pageId: current || ((opts && opts.id) ? sid(opts.id) : '')
    };
  }

  function buildText(model) {
    var lines = [];
    lines.push('成绩单');
    lines.push('页面：' + model.name);
    lines.push('页面ID：' + (model.pageId || ''));
    lines.push('时间：' + model.when);
    lines.push('');
    for (var i = 0; i < model.rows.length; i++) {
      var row = model.rows[i];
      lines.push(row.no + '. ' + row.q.brief);
      lines.push('知识点：' + row.q.tag);
      lines.push('结果：' + row.st.label);
      lines.push('首次错答：' + (row.st.wrong || '无'));
      lines.push('');
    }
    var rate = model.total ? Math.round(model.correct / model.total * 100) : 0;
    lines.push('正确率：' + model.correct + '/' + model.total + '（' + rate + '%）');
    lines.push('一次对 ' + model.once + ' 题，多次后对 ' + model.later + ' 题，未对 ' + model.none + ' 题，接入前已对 ' + model.old + ' 题');
    return lines.join('\n');
  }

  function buildExportPayload(model) {
    var data = load();
    var questions = [];
    for (var i = 0; i < model.rows.length; i++) {
      var row = model.rows[i];
      var item = {
        id: sid(row.q.id),
        brief: row.q.brief || '',
        tag: row.q.tag || '',
        status: row.st.label,
        firstWrong: row.st.wrong || ''
      };
      if (row.q.category) item.category = row.q.category;
      questions.push(item);
    }
    return {
      pageId: model.pageId || '',
      pageName: model.name || '',
      when: model.when,
      summary: {
        once: model.once,
        later: model.later,
        none: model.none,
        old: model.old,
        correct: model.correct,
        total: model.total
      },
      questions: questions,
      attempts: Array.isArray(data.attempts) ? data.attempts.slice() : []
    };
  }

  function buildExportHtml(model, text) {
    var payload = buildExportPayload(model);
    var rate = model.total ? Math.round(model.correct / model.total * 100) : 0;
    var rowsHtml = '';
    for (var i = 0; i < model.rows.length; i++) {
      var row = model.rows[i];
      rowsHtml += '<tr><td>' + row.no + '</td><td>' + esc(row.q.brief) + '</td><td>' + esc(row.q.tag)
        + '</td><td>' + esc(row.st.label) + '</td><td>' + esc(row.st.wrong || '无') + '</td></tr>';
    }
    var jsonStr = JSON.stringify(payload).replace(/</g, '\\u003c');
    return '<!DOCTYPE html>\n<html lang="zh-CN"><head><meta charset="UTF-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<title>成绩单 · ' + esc(model.name) + '</title>'
      + '<style>'
      + 'body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;'
      + 'margin:0;padding:16px;color:#222;background:#fff8ef;line-height:1.5}'
      + 'h1{font-size:24px;color:#e8590c;margin:0 0 8px}'
      + '.meta{color:#666;font-size:15px;margin:0 0 16px}'
      + '.meta b{color:#333}'
      + 'table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;'
      + 'box-shadow:0 2px 8px rgba(0,0,0,.06);font-size:15px}'
      + 'th,td{padding:10px 8px;border-bottom:1px solid #f0e0c8;text-align:left;vertical-align:top}'
      + 'th{background:#fff3bf;color:#7a4b00}'
      + '.sum{margin:16px 0;padding:12px 14px;background:#fff;border-radius:12px;font-size:16px}'
      + 'pre{white-space:pre-wrap;word-break:break-word;background:#fff;padding:12px;border-radius:12px;'
      + 'border:1px solid #f0d9a8;font-size:14px}'
      + '.hint{margin-top:20px;font-size:13px;color:#888}'
      + '</style></head><body>'
      + '<h1>成绩单 · ' + esc(model.name) + '</h1>'
      + '<p class="meta">页面：<b>' + esc(model.name) + '</b><br>'
      + '页面ID：<b>' + esc(model.pageId || '') + '</b><br>'
      + '时间：' + esc(model.when) + '</p>'
      + '<div class="sum">正确率 <b>' + rate + '%</b>（' + model.correct + '/' + model.total
      + '） · 一次对 ' + model.once + ' · 多次后对 ' + model.later
      + ' · 未对 ' + model.none + ' · 接入前已对 ' + model.old + '</div>'
      + '<table><thead><tr><th>#</th><th>题目</th><th>知识点</th><th>结果</th><th>首次错答</th></tr></thead>'
      + '<tbody>' + rowsHtml + '</tbody></table>'
      + '<h2 style="font-size:18px;margin:20px 0 8px;color:#7a4b00">纯文本成绩单</h2>'
      + '<pre>' + esc(text) + '</pre>'
      + '<p class="hint">下方 JSON 供助手解析，勿删。</p>'
      + '<script type="application/json" id="kejian-report-data">' + jsonStr + '</script>'
      + '</body></html>';
  }

  function downloadExport(model, text) {
    var html = buildExportHtml(model, text);
    var fname = '成绩单_' + safeFileName(model.name) + '_' + fileStamp() + '.html';
    try {
      var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fname;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        try { URL.revokeObjectURL(url); } catch (e) {}
        try { a.remove(); } catch (e2) {}
      }, 1500);
      return true;
    } catch (e) {
      return false;
    }
  }

  function ensureStyle() {
    if (styled) return;
    styled = true;
    var css = ''
      + '.kr{max-width:1100px;margin:0 auto;padding:8px 12px 48px;box-sizing:border-box;'
      + 'font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC",sans-serif;color:#333}'
      + '.kr *{box-sizing:border-box}'
      + '.kr-go,.kr-copy,.kr-export,.kr-review{display:block;width:100%;max-width:420px;margin:12px auto;border:none;border-radius:20px;color:#fff;font-size:28px;font-weight:bold;padding:14px 28px;min-height:64px;cursor:pointer;touch-action:manipulation}'
      + '.kr-go{background:#fb8500;box-shadow:0 5px 0 #c96a00}'
      + '.kr-go:active{transform:translateY(3px);box-shadow:0 2px 0 #c96a00}'
      + '.kr-copy{background:#3b82f6;box-shadow:0 4px 0 #1d5fd0;font-size:24px;min-height:58px}'
      + '.kr-copy:active{transform:translateY(2px);box-shadow:0 2px 0 #1d5fd0}'
      + '.kr-export{background:#16a34a;box-shadow:0 4px 0 #0f7a36;font-size:24px;min-height:58px}'
      + '.kr-export:active{transform:translateY(2px);box-shadow:0 2px 0 #0f7a36}'
      + '.kr-review{background:#7c3aed;box-shadow:0 4px 0 #5b21b6;font-size:24px;min-height:58px}'
      + '.kr-review:active{transform:translateY(2px);box-shadow:0 2px 0 #5b21b6}'
      + '.kr-saved{text-align:center;font-size:22px;color:#14692c;font-weight:bold;min-height:28px;margin:4px 0 0}'
      + '.kr-card{background:#fff;border-radius:20px;box-shadow:0 4px 14px rgba(200,140,0,.15);padding:16px 16px 8px;margin-top:8px}'
      + '.kr-title{font-size:34px;color:#e8590c;margin:4px 0;text-align:center;line-height:1.3}'
      + '.kr-sub{text-align:center;color:#8a6d3b;font-size:20px;margin:0 0 8px}'
      + '.kr-stages{display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;margin:4px 0 12px;font-size:18px}'
      + '.kr-stages span{padding:3px 12px;border-radius:12px;background:#eee;color:#666}'
      + '.kr-stages i{color:#ccc;font-style:normal}'
      + '.kr-wrap{display:grid;grid-template-columns:1fr;gap:12px}'
      + '.kr-board{order:1}.kr-main{order:2}'
      + '@media(min-width:960px){.kr-wrap{grid-template-columns:1fr 270px;align-items:start}.kr-main{order:1}.kr-board{order:2;position:sticky;top:12px}}'
      + '.kr-q{background:#fff8e7;border-radius:16px;padding:12px 14px;margin:0 0 10px;box-shadow:0 3px 0 #f1c26b}'
      + '.kr-no{display:inline-block;min-width:32px;height:32px;line-height:32px;text-align:center;border-radius:50%;background:#fb8500;color:#fff;font-weight:bold;font-size:18px;margin-right:8px}'
      + '.kr-q b{font-size:22px;color:#c2410c;line-height:1.35}'
      + '.kr-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;align-items:center}'
      + '.kr-tag{background:#fff3bf;border:2px dashed #f59f00;border-radius:12px;padding:2px 10px;font-size:18px;font-weight:bold}'
      + '.kr-res{border-radius:12px;padding:2px 10px;font-size:18px;font-weight:bold}'
      + '.kr-res.once{background:#dcfce7;color:#14692c}'
      + '.kr-res.later{background:#fff4e0;color:#9a4b00}'
      + '.kr-res.no{background:#ffe3e3;color:#c92a2a}'
      + '.kr-res.old{background:#e7f0ff;color:#1d3f8a}'
      + '.kr-wrong{display:block;margin-top:6px;font-size:18px;color:#5c5346;line-height:1.45}'
      + '.kr-board{background:#fff;border-radius:20px;box-shadow:0 4px 14px rgba(200,140,0,.15);padding:14px 16px}'
      + '.kr-board h3{margin:0 0 8px;font-size:22px;color:#c2410c}'
      + '.kr-rate{font-size:42px;font-weight:bold;color:#e8590c;line-height:1.1;margin:0}'
      + '.kr-rate small{display:block;font-size:18px;color:#8a6d3b;font-weight:normal;margin-top:4px}'
      + '.kr-board ul{list-style:none;margin:10px 0 0;padding:0}'
      + '.kr-board li{font-size:20px;padding:8px 0;border-bottom:1px dashed #f0d9a8}'
      + '.kr-msg{text-align:center;font-size:20px;color:#1e7b34;font-weight:bold;min-height:28px;margin:8px 0}'
      + '.kr-raw{margin:8px 0 12px}'
      + '.kr-raw summary{cursor:pointer;font-size:20px;font-weight:bold;color:#1d5fd0;min-height:44px;line-height:44px}'
      + '.kr-ta{width:100%;min-height:220px;font-size:18px;line-height:1.5;border:3px solid #9bbcf5;border-radius:12px;padding:10px;color:#1f2d4d}'
      + '.kr-overlay{position:fixed;inset:0;z-index:90;background:rgba(40,24,0,.45);overflow:auto;padding:16px 12px 32px}'
      + '.kr-x{display:block;margin:0 auto 8px;border:none;background:#fff;color:#7a4b00;font-size:20px;font-weight:bold;min-height:44px;border-radius:12px;padding:6px 16px}'
      + '@media(max-width:700px){.kr-title{font-size:30px}.kr-q b{font-size:22px}.kr-go{font-size:26px}}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function hostEl() {
    var host = document.getElementById('kejian-report');
    if (host) return host;
    host = document.createElement('section');
    host.id = 'kejian-report';
    host.className = 'kr';
    document.body.appendChild(host);
    return host;
  }

  function render(model, text, copiedMsg) {
    ensureStyle();
    var rate = model.total ? Math.round(model.correct / model.total * 100) : 0;
    var list = '';
    for (var i = 0; i < model.rows.length; i++) {
      var row = model.rows[i];
      list += '<div class="kr-q"><b><span class="kr-no">' + row.no + '</span>' + esc(row.q.brief) + '</b>'
        + '<div class="kr-meta"><span class="kr-tag">' + esc(row.q.tag) + '</span>'
        + '<span class="kr-res ' + row.st.kind + '">' + esc(row.st.label) + '</span></div>'
        + '<span class="kr-wrong">首次错答：' + esc(row.st.wrong || '无') + '</span></div>';
    }
    var overlay = document.getElementById('krOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'krOverlay';
      overlay.className = 'kr-overlay kr';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = ''
      + '<button type="button" class="kr-x" id="krClose">关闭</button>'
      + '<div class="kr-card" id="krCard">'
      + '<h2 class="kr-title">成绩单</h2>'
      + '<p class="kr-sub">' + esc(model.name) + ' · ' + esc(model.when) + '</p>'
      + '<div class="kr-stages"><span>一次对</span><i>→</i><span>第 N 次对</span><i>→</i><span>未对</span></div>'
      + '<div class="kr-wrap"><div class="kr-main">' + list + '</div>'
      + '<aside class="kr-board"><h3>汇总</h3>'
      + '<p class="kr-rate">' + rate + '%<small>做对 ' + model.correct + ' / ' + model.total + ' 题</small></p>'
      + '<ul><li>一次对 ' + model.once + ' 题</li>'
      + '<li>多次后对 ' + model.later + ' 题</li>'
      + '<li>未对 ' + model.none + ' 题</li>'
      + '<li>接入前已对 ' + model.old + ' 题</li></ul></aside></div>'
      + '<p class="kr-msg" id="krMsg" role="status">' + esc(copiedMsg || '') + '</p>'
      + '<button type="button" class="kr-export" id="krExport">导出文件</button>'
      + '<button type="button" class="kr-copy" id="krCopy">再复制一次</button>'
      + '<details class="kr-raw" id="krRaw"><summary>纯文本（复制失败时，长按下面全选）</summary>'
      + '<textarea class="kr-ta" id="krTa" readonly>' + esc(text) + '</textarea></details>'
      + '</div>';
    document.getElementById('krClose').onclick = function () { overlay.remove(); };
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
    document.getElementById('krCopy').onclick = function () { copyText(model, text); };
    document.getElementById('krExport').onclick = function () {
      var ok = downloadExport(model, text);
      var msg = document.getElementById('krMsg');
      if (msg) {
        msg.textContent = ok
          ? '已下载成绩单文件。若没看到下载，请再点一次「导出文件」，或长按下面纯文本复制。'
          : '这个浏览器不好下载文件。请长按下面的纯文本，全选后复制发给家长。';
      }
      if (!ok) {
        var raw = document.getElementById('krRaw');
        if (raw) raw.open = true;
        var ta = document.getElementById('krTa');
        if (ta) { ta.focus(); ta.select(); }
      }
    };
    if (copiedMsg && copiedMsg.indexOf('长按') >= 0) {
      var raw = document.getElementById('krRaw');
      if (raw) raw.open = true;
      var ta = document.getElementById('krTa');
      if (ta) { ta.focus(); ta.select(); }
    }
  }

  function copyText(model, text) {
    function fallback() {
      render(model, text, '正在准备文本…');
      var ta = document.getElementById('krTa');
      var raw = document.getElementById('krRaw');
      if (raw) raw.open = true;
      var ok = false;
      if (ta) {
        ta.focus();
        ta.select();
        try { ok = document.execCommand('copy'); } catch (e) {}
      }
      var msg = document.getElementById('krMsg');
      if (msg) {
        msg.textContent = ok
          ? '已复制成绩单，可以贴到微信或备忘录。'
          : '这个浏览器不能自动复制。请长按下面的文本，全选后复制；也可点「导出文件」下载。';
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        render(model, text, '已复制成绩单，可以贴到微信或备忘录。');
      }, fallback);
    } else fallback();
  }

  function dayStamp(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /* 一次就对率 = 一次就对的题 / 已做对的题。已做对为 0 时记 0。 */
  function onceRate(once, correct) {
    if (!correct) return 0;
    return Math.round(once / correct * 100);
  }

  function appendHistory(model) {
    var data = load();
    if (!Array.isArray(data.history)) data.history = [];
    var buckets = {};
    for (var i = 0; i < model.rows.length; i++) {
      var row = model.rows[i];
      var cat = row.q.category || '';
      if (!cat) continue;
      if (!buckets[cat]) buckets[cat] = { once: 0, correct: 0, total: 0 };
      buckets[cat].total++;
      if (row.st.kind === 'once') {
        buckets[cat].once++;
        buckets[cat].correct++;
      } else if (row.st.kind === 'later' || row.st.kind === 'old') {
        buckets[cat].correct++;
      }
    }
    var byCategory = {};
    Object.keys(buckets).forEach(function (cat) {
      var b = buckets[cat];
      byCategory[cat] = {
        once: b.once,
        correct: b.correct,
        total: b.total,
        onceRate: onceRate(b.once, b.correct)
      };
    });
    var now = new Date();
    data.history.push({
      date: dayStamp(now),
      onceRate: onceRate(model.once, model.correct),
      once: model.once,
      correct: model.correct,
      total: model.total,
      byCategory: byCategory
    });
    if (data.history.length > 60) data.history = data.history.slice(-60);
    save(data);
  }

  /* 小朋友交作业：只把本次成绩写入本页 localStorage，不下载、不抢剪贴板。 */
  function submitHomework() {
    var model = summarize();
    appendHistory(model);
    ensureStyle();
    var host = hostEl();
    var tip = host.querySelector('#krSaved');
    if (!tip) {
      tip = document.createElement('p');
      tip.id = 'krSaved';
      tip.className = 'kr-saved';
      tip.setAttribute('role', 'status');
      host.appendChild(tip);
    }
    var rate = model.total ? Math.round(model.correct / model.total * 100) : 0;
    tip.textContent = '已保存 ✓ 做对 ' + model.correct + '/' + model.total + '（' + rate + '%）。家长若要复制或导出，请点下面「复习导出」。';
  }

  /* 家长复习：打开成绩单浮层，可复制纯文本或导出 HTML 文件。 */
  function openReview() {
    var model = summarize();
    var text = buildText(model);
    render(model, text, '家长可点「导出文件」下载，或「再复制一次」复制纯文本。');
    var overlay = document.getElementById('krOverlay');
    if (overlay) overlay.scrollTop = 0;
  }


  function mount(options) {
    opts = options || {};
    current = sid(opts.id || 'page');
    var data = load();
    var legacy = opts.legacySolved || [];
    var changed = false;
    for (var i = 0; i < legacy.length; i++) {
      var id = sid(legacy[i]);
      if (!data.solved[id] && !(data.misses[id] > 0) && !data.firstWrong[id] && !data.legacy[id]) {
        data.legacy[id] = 1;
        changed = true;
      }
    }
    if (changed) save(data);
    ensureStyle();
    if (!opts.noButton) {
      var host = hostEl();
      host.innerHTML = ''
        + '<button type="button" class="kr-go" id="krGo">交作业</button>'
        + '<button type="button" class="kr-review" id="krReview">复习导出</button>'
        + '<p class="kr-saved" id="krSaved" role="status"></p>';
      document.getElementById('krGo').onclick = submitHomework;
      document.getElementById('krReview').onclick = openReview;
    }
  }

  function miss(qid, answer) {
    if (!current) return;
    var id = sid(qid);
    var data = load();
    data.misses[id] = (data.misses[id] || 0) + 1;
    if (!data.firstWrong[id]) {
      data.firstWrong[id] = trimAnswer(answer);
    }
    pushAttempt(data, id, false, answer);
    delete data.legacy[id];
    delete data.solved[id];
    save(data);
  }

  function pass(qid, answer) {
    if (!current) return;
    var id = sid(qid);
    var data = load();
    data.solved[id] = 1;
    pushAttempt(data, id, true, answer == null ? '' : answer);
    delete data.legacy[id];
    save(data);
  }

  function clear() {
    if (!current) return;
    try { localStorage.removeItem(storageKey()); } catch (e) {}
  }

  global.KejianReport = {
    mount: mount,
    open: openReview,
    submit: submitHomework,
    review: openReview,
    miss: miss,
    pass: pass,
    clear: clear,
    text: function () { return buildText(summarize()); }
  };
})(window);
