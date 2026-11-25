'use strict';
(function () {
  function showVariant(hostId, name) {
    var host = document.getElementById(hostId);
    if (!host) return;
    var list = host.querySelectorAll('.fig-variant');
    for (var i = 0; i < list.length; i++) {
      list[i].hidden = list[i].getAttribute('data-name') !== name;
    }
  }
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-fig2]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showVariant('fig2-host', btn.getAttribute('data-fig2'));
      });
    });
    document.querySelectorAll('[data-fig3]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showVariant('fig3-host', btn.getAttribute('data-fig3'));
      });
    });
    if (window.SiteNav && SiteNav.mount) {
      SiteNav.mount({ title: '浅湾埠的对桩灯', pageId: 'qianwan', reading: true, dir: '../index.html' });
    }
  });
})();
