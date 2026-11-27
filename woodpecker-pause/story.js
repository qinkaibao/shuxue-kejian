'use strict';
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    if (window.SiteNav && SiteNav.mount) {
      SiteNav.mount({ title: '把啄木鸟的停顿留下来', pageId: 'woodpecker-pause', reading: true, dir: '../index.html' });
    }
  });
})();
