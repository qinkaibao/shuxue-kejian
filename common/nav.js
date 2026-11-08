/* 全站顶栏：目录、主页、关卡、进度。会交作业的页面再放「交作业」。 */
(function (global) {
  var styled = false;
  var navScript = document.currentScript;
  if (!navScript) {
    var scripts = document.querySelectorAll('script[src]');
    for (var s = 0; s < scripts.length; s++) {
      if (/\/nav\.js(?:[?#]|$)/.test(scripts[s].src)) navScript = scripts[s];
    }
  }
  var reportURL = navScript && navScript.src ? new URL('report.js', navScript.src).href : '';
  var reportLoading = null;
  var READ_PREFIX = 'kejian-story-read-v1:';
  var HOME_KEY = 'kejian-home-submits-v1';

  function ensureReport() {
    if (global.KejianReport && global.KejianReport.submitStoryRead) return Promise.resolve(global.KejianReport);
    if (reportLoading) return reportLoading;
    reportLoading = new Promise(function (resolve, reject) {
      if (!reportURL) { reject(new Error('report.js path unavailable')); return; }
      var script = document.createElement('script');
      script.src = reportURL;
      script.onload = function () {
        if (global.KejianReport && global.KejianReport.submitStoryRead) resolve(global.KejianReport);
        else reject(new Error('Reading upload unavailable'));
      };
      script.onerror = function () { reject(new Error('report.js failed to load')); };
      document.head.appendChild(script);
    });
    return reportLoading;
  }

  function pageIdFromPath() {
    var parts = location.pathname.replace(/\/index\.html?$/i, '/').split('/').filter(Boolean);
    return parts.pop() || 'index';
  }

  function readRecord(pageId) {
    try { return JSON.parse(localStorage.getItem(READ_PREFIX + pageId) || 'null'); }
    catch (e) { return null; }
  }

  function saveReading(record, uploadUpdate) {
    var saved = false;
    try {
      localStorage.setItem(READ_PREFIX + record.pageId, JSON.stringify(record));
      saved = true;
    } catch (e) {}
    try {
      var records = JSON.parse(localStorage.getItem(HOME_KEY) || '{}');
      if (!records || typeof records !== 'object' || Array.isArray(records)) records = {};
      // 上传回调不能覆盖随后提交的练习成绩单。
      if (!uploadUpdate || (records[record.pageId] && records[record.pageId].submissionId === record.submissionId)) {
        records[record.pageId] = record;
        localStorage.setItem(HOME_KEY, JSON.stringify(records));
      }
    } catch (e) {}
    return saved;
  }

  function ensureStyle() {
    if (styled) return;
    styled = true;
    var css = ''
      + 'body.has-site-nav{padding-top:var(--sn-h,calc(46px + env(safe-area-inset-top,0px)))}'
      + 'body.has-site-nav :where(h1,h2,.chap,.gate){scroll-margin-top:calc(var(--sn-h,46px) + 12px)}'
      + '.site-nav{position:fixed;top:0;left:0;right:0;z-index:60;background:#fff8e7;'
      + 'font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC",sans-serif}'
      + '.sn-row{display:flex;gap:6px;align-items:center;flex-wrap:nowrap;overflow-x:auto;'
      + 'padding:calc(4px + env(safe-area-inset-top,0px)) max(8px,env(safe-area-inset-right,0px)) 6px max(8px,env(safe-area-inset-left,0px));box-shadow:0 2px 0 #f1c26b;'
      + 'font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC",sans-serif}'
      + '.sn-btn{border:none;background:#ffd166;border-radius:12px;font-size:16px;min-height:36px;padding:0 10px;font-weight:bold;color:#5a3d00;box-shadow:0 2px 0 #e0a800;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;white-space:nowrap}'
      + '.sn-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #e0a800}'
      + '.sn-title{font-weight:bold;font-size:16px;color:#e8590c;white-space:nowrap;flex:0 0 auto}'
      + '.sn-prog{margin-left:auto;font-weight:bold;color:#8a6d3b;font-size:15px;white-space:nowrap;flex:0 0 auto}'
      + '.sn-track{height:6px;width:100%;background:#ead8b2;overflow:hidden}'
      + '.sn-fill{height:100%;width:0;background:#16805d}'
      + '.sn-reading{display:block;text-align:center;margin:28px auto;padding:16px;max-width:560px}'
      + '.sn-read-btn{display:block;width:100%;min-height:64px;border:0;border-radius:18px;padding:14px 24px;background:#16805d;color:#fff;font: bold 26px/1.4 sans-serif;cursor:pointer;touch-action:manipulation}'
      + '.sn-read-btn:disabled{background:#d9e2dc;color:#46564c;cursor:default}'
      + '.sn-read-btn.sn-read-done{background:#d6f2e4;color:#146443}'
      + '.sn-read-hint{font-size:16px;line-height:1.6;color:#625742;margin:12px 0 0}'
      + '.sn-sheet{position:fixed;left:0;right:0;bottom:0;top:var(--sn-h,46px);z-index:59;background:rgba(40,24,0,.35)}'
      + '.sn-panel{background:#fff;margin:10px;border-radius:18px;padding:12px;max-height:70vh;overflow:auto;box-shadow:0 8px 24px rgba(0,0,0,.15)}'
      + '.sn-panel b{display:block;color:#c2410c;font-size:22px;margin-bottom:8px}'
      + '.sn-panel button{display:block;width:100%;text-align:left;border:none;background:#fff8e7;border-radius:12px;min-height:48px;margin:6px 0;padding:8px 12px;font-size:20px;font-weight:bold;color:#333}'
      + '@media(max-width:700px){.sn-title{display:none}.sn-btn{font-size:14px;min-height:32px;padding:0 8px;border-radius:10px}.sn-prog{font-size:13px}}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function headings() {
    var hs = Array.prototype.slice.call(document.querySelectorAll('h2.chap'));
    if (!hs.length) hs = Array.prototype.slice.call(document.querySelectorAll('h2'));
    if (!hs.length) hs = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
    return hs.filter(function (h) { return h.closest && !h.closest('#snSheet, #siteNav, #krOverlay, #kejian-report'); });
  }

  function scrollTop() {
    return document.documentElement.scrollTop || document.body.scrollTop || window.scrollY || 0;
  }

  function chapterIndex(hs) {
    var idx = -1;
    hs.forEach(function (h, i) {
      if (h.getBoundingClientRect().top <= 100) idx = i;
    });
    return idx;
  }

  function chapterLabel(hs, idx) {
    if (!hs.length) return '阅读中';
    return '第 ' + Math.max(1, idx + 1) + ' / ' + hs.length + ' 章';
  }

  function closeSheet() {
    var sheet = document.getElementById('snSheet');
    if (sheet) sheet.hidden = true;
  }

  function openChapters() {
    var sheet = document.getElementById('snSheet');
    var hs = headings();
    if (!hs.length) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    var html = '<div class="sn-panel"><b>选一章</b>';
    hs.forEach(function (h, i) {
      if (!h.id) h.id = 'sn-c-' + i;
      var name = (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28);
      html += '<button type="button" data-go="' + h.id + '">' + (i + 1) + ' ' + name + '</button>';
    });
    sheet.innerHTML = html + '</div>';
    sheet.hidden = false;
    Array.prototype.forEach.call(sheet.querySelectorAll('button'), function (btn) {
      btn.onclick = function () {
        var el = document.getElementById(btn.getAttribute('data-go'));
        closeSheet();
        if (el) { try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { el.scrollIntoView(); } }
      };
    });
  }

  function mount(opts) {
    opts = opts || {};
    if (document.getElementById('siteNav')) return;
    var openedAt = new Date();
    var hs = headings();
    var reading = opts.reading === true || (!opts.report && hs.length > 0);
    var pageId = opts.pageId || pageIdFromPath();
    var completed = reading && readRecord(pageId);
    completed = completed && completed.kind === 'story-read' && completed.summary && completed.summary.read === true;
    var maxScrollPct = 0;
    var chaptersReached = 0;
    var readButton, readHint;
    ensureStyle();
    document.body.classList.add('has-site-nav');
    var bar = document.createElement('header');
    bar.id = 'siteNav';
    bar.className = 'site-nav';
    var work = opts.report ? '<button type="button" class="sn-btn" id="snWork">交作业</button>' : '';
    bar.innerHTML = '<div class="sn-row"><a class="sn-btn" href="' + (opts.dir || '../index.html') + '">🏠 回总目录</a>' +
      '<button type="button" class="sn-btn" id="snHome">本页开头</button>' +
      '<button type="button" class="sn-btn" id="snMap">关卡</button>' +
      '<button type="button" class="sn-btn" id="snReload">🔄 刷新</button>' +
      '<div class="sn-title">' + (opts.title || '') + '</div>' +
      '<div class="sn-prog" id="snProg"></div>' + work + '</div>' +
      '<div class="sn-track" id="snTrack" role="progressbar" aria-label="本页已到达的阅读进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="sn-fill" id="snFill"></div></div>';
    var sheet = document.createElement('div');
    sheet.id = 'snSheet';
    sheet.hidden = true;
    document.body.insertBefore(sheet, document.body.firstChild);
    document.body.insertBefore(bar, document.body.firstChild);
    function syncBar() {
      document.documentElement.style.setProperty('--sn-h', bar.offsetHeight + 'px');
    }
    syncBar();
    window.addEventListener('resize', syncBar, { passive: true });
    document.getElementById('snHome').onclick = function () {
      closeSheet();
      if (opts.home) opts.home();
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    document.getElementById('snMap').onclick = function () {
      if (opts.map) { closeSheet(); opts.map(); return; }
      var opened = document.getElementById('snSheet');
      if (opened && !opened.hidden) closeSheet();
      else openChapters();
    };
    document.getElementById('snReload').onclick = function () {
      var u = new URL(location.href);
      u.searchParams.set('r', String(Date.now()));
      location.replace(u.toString());
    };
    if (opts.report) {
      document.getElementById('snWork').onclick = function () {
        if (global.KejianReport && global.KejianReport.submit) global.KejianReport.submit();
      };
    }
    sheet.onclick = function (e) { if (e.target === sheet) closeSheet(); };
    if (reading) {
      var footer = document.createElement('div');
      footer.className = 'sn-reading';
      footer.innerHTML = '<button type="button" class="sn-read-btn" id="snRead" disabled aria-describedby="snReadHint">读完了</button>' +
        '<p class="sn-read-hint" id="snReadHint" role="status">先翻到故事结尾，再点读完了</p>';
      var main = document.querySelector('main');
      var lastChapter = hs.length && hs[hs.length - 1];
      var article = lastChapter && lastChapter.closest('article, section, .chapter');
      if (main) main.appendChild(footer);
      else if (article) article.parentNode.insertBefore(footer, article.nextSibling);
      else document.body.appendChild(footer);
      readButton = document.getElementById('snRead');
      readHint = document.getElementById('snReadHint');
      if (completed) readHint.textContent = '这篇故事已经读完了';
      readButton.onclick = function () {
        paint();
        if (readButton.disabled || completed) return;
        var now = new Date();
        var payload = {
          kind: 'story-read', pageId: pageId, pageName: opts.title || pageId, when: now.toISOString(),
          summary: { read: true, chaptersReached: chaptersReached, chaptersTotal: hs.length, maxScrollPct: maxScrollPct },
          openedAt: openedAt.toISOString(), durationSec: Math.floor((now - openedAt) / 1000)
        };
        var record = Object.assign({}, payload, {
          uploaded: false, submissionId: Date.now().toString(36) + Math.random().toString(36).slice(2)
        });
        var saved = saveReading(record, false);
        completed = true;
        paint();
        readHint.textContent = (saved ? '本机已记住。' : '本机未能保存。') + '正在发送阅读反馈…';
        function onUploaded(ok) {
          record.uploaded = !!ok;
          saveReading(record, true);
          readHint.textContent = (saved ? '本机已记住。' : '本机未能保存。') +
            (ok ? '阅读反馈请求已发出。' : '阅读反馈暂未发出。');
        }
        ensureReport().then(function (report) { report.submitStoryRead(payload, onUploaded); }).catch(function () { onUploaded(false); });
      };
    }
    function paint() {
      var el = document.getElementById('snProg');
      if (!el) return;
      var root = document.documentElement;
      var scrollHeight = Math.max(root.scrollHeight, document.body.scrollHeight);
      var clientHeight = root.clientHeight || window.innerHeight || document.body.clientHeight;
      var maxScroll = scrollHeight - clientHeight;
      var pct = maxScroll > 0 ? scrollTop() / maxScroll : 0;
      maxScrollPct = Math.max(maxScrollPct, Math.min(1, Math.max(0, pct)));
      var idx = chapterIndex(hs);
      chaptersReached = Math.max(chaptersReached, idx + 1);
      el.textContent = opts.progress ? opts.progress() : chapterLabel(hs, idx);
      document.getElementById('snFill').style.width = (maxScrollPct * 100) + '%';
      document.getElementById('snTrack').setAttribute('aria-valuenow', Math.round(maxScrollPct * 100));
      if (readButton) {
        var canRead = (hs.length > 0 && chaptersReached === hs.length) || maxScrollPct >= 0.9;
        readButton.disabled = !!completed || !canRead;
        readButton.textContent = completed ? '已读完' : '读完了';
        readButton.classList.toggle('sn-read-done', !!completed);
        readButton.title = completed ? '这篇故事已经读完了' : canRead ? '点一下，记下已读完' : '先翻到故事结尾，再点读完了';
        if (!completed) readHint.textContent = canRead ? '读完故事后，点一下记下来' : '先翻到故事结尾，再点读完了';
      }
    }
    window.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('touchmove', paint, { passive: true });
    window.addEventListener('resize', paint, { passive: true });
    window.addEventListener('load', function () { syncBar(); paint(); }, { passive: true });
    paint();
  }

  global.SiteNav = { mount: mount };
})(window);
