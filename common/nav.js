/* 全站顶栏：目录、主页、关卡、进度。会交作业的页面再放「交作业」。 */
(function (global) {
  var styled = false;

  function ensureStyle() {
    if (styled) return;
    styled = true;
    var css = ''
      + 'body.has-site-nav{padding-top:72px}'
      + '.site-nav{position:fixed;top:0;left:0;right:0;z-index:60;background:#fff8e7;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 10px;box-shadow:0 2px 0 #f1c26b;'
      + 'font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC",sans-serif}'
      + '.sn-btn{border:none;background:#ffd166;border-radius:14px;font-size:18px;min-height:44px;padding:0 12px;font-weight:bold;color:#5a3d00;box-shadow:0 3px 0 #e0a800;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}'
      + '.sn-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #e0a800}'
      + '.sn-title{font-weight:bold;font-size:18px;color:#e8590c;white-space:nowrap}'
      + '.sn-prog{margin-left:auto;font-weight:bold;color:#8a6d3b;font-size:18px}'
      + '.sn-sheet{position:fixed;inset:72px 0 0 0;z-index:59;background:rgba(40,24,0,.35)}'
      + '.sn-panel{background:#fff;margin:10px;border-radius:18px;padding:12px;max-height:70vh;overflow:auto;box-shadow:0 8px 24px rgba(0,0,0,.15)}'
      + '.sn-panel b{display:block;color:#c2410c;font-size:22px;margin-bottom:8px}'
      + '.sn-panel button{display:block;width:100%;text-align:left;border:none;background:#fff8e7;border-radius:12px;min-height:48px;margin:6px 0;padding:8px 12px;font-size:20px;font-weight:bold;color:#333}'
      + '@media(max-width:700px){.sn-title{display:none}.sn-btn{font-size:17px;padding:0 8px}}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function headings() {
    var hs = Array.prototype.slice.call(document.querySelectorAll('h2.chap'));
    if (!hs.length) hs = Array.prototype.slice.call(document.querySelectorAll('h2'));
    return hs.filter(function (h) { return h.closest && !h.closest('#snSheet'); });
  }

  function chapterLabel() {
    var hs = headings();
    if (!hs.length) return '阅读中';
    var y = window.scrollY + 100;
    var idx = 0;
    hs.forEach(function (h, i) {
      var top = h.getBoundingClientRect().top + window.scrollY;
      if (top <= y) idx = i;
    });
    return '第 ' + (idx + 1) + ' / ' + hs.length + ' 章';
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
    ensureStyle();
    document.body.classList.add('has-site-nav');
    var bar = document.createElement('header');
    bar.id = 'siteNav';
    bar.className = 'site-nav';
    var work = opts.report ? '<button type="button" class="sn-btn" id="snWork">交作业</button>' : '';
    bar.innerHTML = '<a class="sn-btn" href="' + (opts.dir || '../index.html') + '">目录</a>' +
      '<button type="button" class="sn-btn" id="snHome">主页</button>' +
      '<button type="button" class="sn-btn" id="snMap">关卡</button>' +
      '<div class="sn-title">' + (opts.title || '') + '</div>' +
      '<div class="sn-prog" id="snProg"></div>' + work;
    var sheet = document.createElement('div');
    sheet.id = 'snSheet';
    sheet.hidden = true;
    document.body.insertBefore(sheet, document.body.firstChild);
    document.body.insertBefore(bar, document.body.firstChild);
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
    if (opts.report) {
      document.getElementById('snWork').onclick = function () {
        if (global.KejianReport && global.KejianReport.open) global.KejianReport.open();
      };
    }
    sheet.onclick = function (e) { if (e.target === sheet) closeSheet(); };
    function paint() {
      var el = document.getElementById('snProg');
      if (!el) return;
      el.textContent = opts.progress ? opts.progress() : chapterLabel();
    }
    window.addEventListener('scroll', paint, { passive: true });
    paint();
  }

  global.SiteNav = { mount: mount };
})(window);
