'use strict';
{
  const $ = (id) => document.getElementById(id);

  function setHl(on) {
    const g = $('strings42');
    const box = $('hl42');
    const note = $('note42');
    if (!g) return;
    if (on) {
      g.setAttribute('filter', 'url(#glowSoft)');
      if (box) box.setAttribute('opacity', '1');
      if (note) note.textContent = '这四十二颗，只数到了已经穿好的七串。小碟里的五颗还没有算进去。';
    } else {
      g.removeAttribute('filter');
      if (box) box.setAttribute('opacity', '0');
      if (note) note.textContent = '';
    }
    state.hl42 = on;
  }

  const state = { hl42: false, circle: 0, blue: 0, wood: 0 };

  function resetCircle() {
    state.circle = 0;
    const frame = $('allFrame'), lab = $('allLabel'), note = $('noteCircle');
    if (frame) { frame.setAttribute('opacity', '0'); frame.setAttribute('fill', 'none'); }
    if (lab) lab.setAttribute('opacity', '0');
    if (note) note.textContent = '先点七串，再点小碟，把它们合进同一个圈。';
    const s = $('partStrings'), d = $('partDish');
    if (s) s.style.outline = '';
    if (d) d.style.outline = '';
  }

  function circleStep(which) {
    const note = $('noteCircle');
    if (which === 'strings') {
      if (state.circle === 0) {
        state.circle = 1;
        const frame = $('allFrame');
        if (frame) { frame.setAttribute('opacity', '1'); frame.setAttribute('fill', 'none'); }
        if (note) note.textContent = '七串已经在圈里，共四十二颗。再把小碟也圈进来。';
      }
      return;
    }
    if (which === 'dish') {
      if (state.circle === 0) {
        if (note) note.textContent = '先把已经穿好的七串圈进来。';
        return;
      }
      if (state.circle >= 1) {
        state.circle = 2;
        const frame = $('allFrame'), lab = $('allLabel');
        if (frame) { frame.setAttribute('opacity', '1'); frame.setAttribute('fill', '#eef5f1'); }
        if (lab) lab.setAttribute('opacity', '1');
        if (note) note.textContent = '42＋5＝47。七串和五颗散珠都在这一圈里。';
      }
    }
  }

  function slotCenters(prefix, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const c = $(prefix + '-' + i);
      if (!c) continue;
      pts.push({ x: Number(c.getAttribute('cx')), y: Number(c.getAttribute('cy')), el: c });
    }
    return pts;
  }

  function sourceGroups(cls) {
    return Array.from(document.querySelectorAll('.' + cls));
  }

  function originalOf(g) {
    if (!g.dataset.home) g.dataset.home = g.getAttribute('transform') || '';
    return g.dataset.home;
  }

  function moveGroupTo(g, x, y) {
    originalOf(g);
    // inner bead is already translated in its child; group may have no transform
    g.setAttribute('transform', `translate(${x} ${y})`);
    // Wait - the bead itself has transform translate(x,y) on the inner g.
    // The outer .src-blue is `<g class="src-blue" data-i="i">{blue(x,y)}</g>`
    // so the visible position is the inner translate. Easier to wrap and set
    // a transform on the outer group that compensates.
  }

  function placeKind(kind) {
    const isBlue = kind === 'blue';
    const groups = sourceGroups(isBlue ? 'src-blue' : 'src-wood');
    const slots = slotCenters(isBlue ? 'bslot' : 'wslot', isBlue ? 6 : 6);
    const need = isBlue ? 5 : 6;
    groups.forEach((g, i) => {
      if (i >= need) return;
      originalOf(g);
      const inner = g.querySelector('g');
      // read inner translate
      const slot = slots[i];
      if (!slot || !inner) return;
      const t = inner.getAttribute('transform') || '';
      const m = t.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
      const ox = m ? Number(m[1]) : 0;
      const oy = m ? Number(m[2]) : 0;
      g.setAttribute('transform', `translate(${slot.x - ox} ${slot.y - oy})`);
    });
    if (isBlue) {
      state.blue = 5;
      if ($('blueMsg')) $('blueMsg').textContent = '还差一颗，才够同样长的一串。';
      if ($('noteSlots')) $('noteSlots').textContent = '五颗蓝珠放进六个空位，还空着一格。它们不是完整的一串。';
    } else {
      state.wood = 6;
      if ($('woodMsg')) $('woodMsg').textContent = '六颗恰好能穿满一串。';
      if ($('noteSlots')) $('noteSlots').textContent = '木珠是另外的试验，没有并入借来的四十七颗。';
    }
  }

  function resetSlots() {
    sourceGroups('src-blue').concat(sourceGroups('src-wood')).forEach((g) => {
      originalOf(g);
      if (g.dataset.home) g.setAttribute('transform', g.dataset.home);
      else g.removeAttribute('transform');
    });
    state.blue = 0;
    state.wood = 0;
    if ($('blueMsg')) $('blueMsg').textContent = '';
    if ($('woodMsg')) $('woodMsg').textContent = '';
    if ($('noteSlots')) $('noteSlots').textContent = '蓝珠和木珠要放进各自的空位，不要放进同一盘。';
  }

  function bind() {
    const b42 = $('btn42'), r42 = $('reset42');
    if (b42) b42.onclick = () => setHl(true);
    if (r42) r42.onclick = () => setHl(false);
    const strings = $('strings42');
    if (strings) strings.addEventListener('click', () => setHl(true));

    const ps = $('partStrings'), pd = $('partDish');
    if (ps) {
      ps.style.cursor = 'pointer';
      ps.addEventListener('click', () => circleStep('strings'));
    }
    if (pd) {
      pd.style.cursor = 'pointer';
      pd.addEventListener('click', () => circleStep('dish'));
    }
    const bc = $('btnCircle'), rc = $('resetCircle');
    if (bc) bc.onclick = () => {
      if (state.circle === 0) circleStep('strings');
      else if (state.circle === 1) circleStep('dish');
    };
    if (rc) rc.onclick = resetCircle;

    const pb = $('btnPlaceBlue'), pw = $('btnPlaceWood'), rs = $('resetSlots');
    if (pb) pb.onclick = () => placeKind('blue');
    if (pw) pw.onclick = () => placeKind('wood');
    if (rs) rs.onclick = resetSlots;

    // click individual beads too
    sourceGroups('src-blue').forEach((g) => {
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => placeKind('blue'));
    });
    sourceGroups('src-wood').forEach((g) => {
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => placeKind('wood'));
    });
  }

  bind();

  if (typeof SiteNav !== 'undefined') {
    SiteNav.mount({ title: '雨檐下的五颗蓝珠', pageId: 'blue-beads', reading: true, dir: '../index.html' });
  }

  window.BlueBeadsStory = {
    getState: () => ({ ...state }),
    setHl, reset42: () => setHl(false),
    circleStep, resetCircle, placeKind, resetSlots
  };
}
