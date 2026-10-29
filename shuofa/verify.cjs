/* Run: node shuofa/verify.cjs. Checks math and real page handlers in a small DOM.
 * This does not replace browser layout / screenshot checks. No dependencies. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const site = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.forEach(s => new vm.Script(s));
const levels = JSON.parse(html.match(/var LEVELS=([\s\S]*?);\n\n\/\* ===== 引擎/)[1]);
const questions = levels.flatMap(l => l.qs);
const expected = {
  '1-1': [6], '1-2': [36, 6], '1-3': [35, 5],
  '2-1': [12], '2-2': [23], '2-3': [5],
  '3-1': [9, 20], '3-2': [6], '3-3': [7, 2],
  '4-1': [46, 27, 27], '4-2': [28, 34], '4-3': [24, 17, 31],
  '5-1': [7, 6], '5-2': [6, 9, 3], '5-3': [6, 24]
};
const normalize = s => s.replace(/[＋]/g, '+').replace(/[−－]/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/＝/g, '=');
// Parse only numeric arithmetic; inspect each multiplication/division after brackets resolve.
function calc(raw, checkTables = false) {
  const s = normalize(raw).replace(/\s+/g, '');
  assert(/^[\d.+*/()\-]+$/.test(s), 'Unsafe expression: ' + raw);
  let i = 0;
  function atom() {
    if (s[i] === '(') { i++; const n = add(); assert.equal(s[i++], ')'); return n; }
    const m = s.slice(i).match(/^\d+(?:\.\d+)?/); assert(m, raw); i += m[0].length; return +m[0];
  }
  function mul() {
    let a = atom();
    while (s[i] === '*' || s[i] === '/') {
      const op = s[i++], b = atom();
      if (checkTables) {
        const other = op === '*' ? a : a / b;
        assert(b >= 1 && b <= 9 && other >= 1 && other <= 9 && Number.isInteger(other), 'Outside tables: ' + raw);
      }
      a = op === '*' ? a * b : a / b;
    }
    return a;
  }
  function add() { let a = mul(); while (s[i] === '+' || s[i] === '-') { const op = s[i++], b = mul(); a = op === '+' ? a + b : a - b; } return a; }
  const result = add(); assert.equal(i, s.length, raw); return result;
}
assert.equal(levels.length, 5);
assert(levels.every(l => l.qs.length === 3));
assert.equal(new Set(questions.map(q => q.id)).size, 15);
let equationCount = 0, tableCount = 0;
function scan(value) {
  if (typeof value === 'string') {
    const text = value.replace(/<[^>]*>/g, '');
    for (const m of text.matchAll(/[（(\d][\d\s＋+−－\-×÷()（）]*[×÷][\d\s＋+−－\-×÷()（）]*/g)) {
      const expr = m[0].replace(/（/g, '(').replace(/）/g, ')').trim();
      if (/[×÷＋−－+\-]\s*$/.test(expr)) continue; // Unfilled numeric blank; filled version is checked below.
      if ((expr.match(/\(/g) || []).length !== (expr.match(/\)/g) || []).length) continue;
      calc(expr, true); tableCount++;
    }
  } else if (Array.isArray(value)) value.forEach(scan);
  else if (value && typeof value === 'object') Object.values(value).forEach(scan);
}
for (const q of questions) {
  assert.deepEqual(q.checks.map(([expr, answer]) => { const n = calc(expr, true); assert.equal(n, answer, q.id); return n; }), expected[q.id], q.id);
  assert(q.text.includes('[['), q.id + ' missing circled question');
  assert(q.steps[0].circle, q.id + ' must start with asking what is sought');
  q.steps.forEach(st => {
    if (st.type === 'blanks') {
      let n = 0;
      for (const line of st.lines) {
        const filled = line.replace(/\{\}/g, () => String(st.a[n++]));
        for (const m of normalize(filled).matchAll(/([\d\s.+*/()\-]+)=\s*(\d+)/g)) {
          const expr = m[1].trim();
          if (!expr || (expr.match(/\(/g) || []).length !== (expr.match(/\)/g) || []).length) continue;
          assert.equal(calc(expr, true), +m[2], q.id + ': ' + filled); equationCount++;
        }
      }
      assert.equal(n, st.a.length);
    }
    if (st.type === 'choice') assert(st.a >= 0 && st.a < st.opts.length);
    if (st.type !== 'diagram') assert(st.hint && st.exp, q.id + ' needs both feedback levels');
  });
  scan(q);
  if (q.diagram) {
    const d = q.diagram;
    d.rows.forEach(r => assert(r.segs.reduce((a, s) => a + s.v, 0) <= d.max));
    d.braces.forEach(b => assert(b.f < b.t && b.t <= d.max));
    assert(d.caps.length >= 3);
  }
}
for (const file of ['shuofa/index.html', 'shuofa/题目.md', 'index.html', 'cuoti/fenlei.json']) {
  assert(!/糖果|秦翊琳/.test(fs.readFileSync(path.join(site, file), 'utf8')), file + ' privacy');
}
const index = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
const items = vm.runInNewContext(index.match(/const ITEMS = ([\s\S]*?\n\]);/)[1]);
assert.equal(items[0].id, 'shuofa');
assert.equal(items[0].reportId, 'shuofa');
assert.equal(items[0].total, 15);
assert.equal(items[0].date, '2026-10-29');
assert.equal(items[0].path, 'shuofa/');
assert.equal(items[0].type, 'practice');
const practiceTotal = items.filter(i => i.type === 'practice' && !i.omitSummary).reduce((n, i) => n + (Number(i.total) || 0), 0);
const category = JSON.parse(fs.readFileSync(path.join(site, 'cuoti/fenlei.json'), 'utf8')).find(c => c['分类'] === '看图列式与数量关系');
assert.equal(category.pages[0].reportId, 'shuofa');
assert.equal(category['相关练习题数合计'], 49);
console.log(`Math OK: 15 questions, ${equationCount} fill equations, ${tableCount} displayed table expressions; practice total ${practiceTotal - 15} → ${practiceTotal}.`);

// Minimal DOM for executing the page's own event handlers (not a layout engine).
const decode = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function descendants(el) { return el.children.flatMap(c => [c, ...descendants(c)]); }
function matches(el, selector) {
  if (el.tag === '#text') return false;
  const attr = selector.match(/\[([^=\]]+)(?:="?([^"\]]+)"?)?\]/);
  if (attr && (!(attr[1] in el.attrs) || (attr[2] && el.attrs[attr[1]] !== attr[2]))) return false;
  const basic = selector.replace(/\[[^\]]+\]/g, '');
  const tag = basic.match(/^[a-z][\w-]*/i);
  if (tag && el.tag !== tag[0]) return false;
  const id = basic.match(/#([\w-]+)/); if (id && el.id !== id[1]) return false;
  return [...basic.matchAll(/\.([\w-]+)/g)].every(m => el.className.split(/\s+/).includes(m[1]));
}
function select(el, selector) {
  const parts = selector.trim().split(/\s+/);
  return descendants(el).filter(child => {
    if (!matches(child, parts.at(-1))) return false;
    let p = child.parent;
    for (let i = parts.length - 2; i >= 0; i--) { while (p && !matches(p, parts[i])) p = p.parent; if (!p) return false; p = p.parent; }
    return true;
  });
}
class El {
  constructor(tag, attrs = {}) {
    this.tag = tag; this.attrs = attrs; this.children = []; this.style = {}; this.disabled = false; this.parent = null;
    this.classList = {
      contains: c => this.className.split(/\s+/).includes(c),
      add: (...cs) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...cs])].join(' '); },
      remove: (...cs) => { this.className = this.className.split(/\s+/).filter(c => !cs.includes(c)).join(' '); },
      toggle: (c, force) => { const on = force === undefined ? !this.classList.contains(c) : force; this.classList[on ? 'add' : 'remove'](c); return on; }
    };
  }
  get className() { return this.attrs.class || ''; } set className(s) { this.attrs.class = String(s); }
  get id() { return this.attrs.id || ''; } set id(s) { this.attrs.id = s; }
  get innerHTML() { return this._html || this.textContent; }
  set innerHTML(s) { this._html = s; this.children = []; parse(String(s), this); }
  get textContent() { return this.tag === '#text' ? this.value : this.children.map(c => c.textContent).join(''); }
  set textContent(s) { this._html = null; this.children = []; const t = new El('#text'); t.value = String(s); this.appendChild(t); }
  get lastChild() { return this.children.at(-1); }
  get offsetWidth() { return 390; } get offsetHeight() { return 48; }
  getAttribute(a) { return this.attrs[a] ?? null; } setAttribute(a, v) { this.attrs[a] = v; }
  querySelectorAll(s) { return select(this, s); } querySelector(s) { return this.querySelectorAll(s)[0] || null; }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  insertBefore(c, before) { c.parent = this; const i = this.children.indexOf(before); this.children.splice(i < 0 ? this.children.length : i, 0, c); return c; }
  contains(c) { return descendants(this).includes(c); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this); }
  scrollIntoView() {} getBoundingClientRect() { return { top: 100 }; } focus() {} select() {}
  addEventListener(name, fn) { this['on' + name] = fn; }
}
function parse(s, root) {
  const stack = [root], voids = new Set(['br', 'meta', 'input', 'link', 'hr', 'img']);
  for (const m of s.matchAll(/<\/?[a-z][^>]*>|[^<]+/gi)) {
    const t = m[0];
    if (t.startsWith('</')) { const tag = t.match(/^<\/([^\s>]+)/)[1]; while (stack.length > 1) { if (stack.pop().tag === tag) break; } }
    else if (t.startsWith('<')) {
      const tag = t.match(/^<([^\s/>]+)/)[1], attrs = {};
      for (const a of t.slice(tag.length + 1, -1).matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[a[1]] = decode(a[2] ?? a[3] ?? a[4] ?? '');
      const child = new El(tag, attrs); stack.at(-1).appendChild(child); if (!t.endsWith('/>') && !voids.has(tag)) stack.push(child);
    } else { const child = new El('#text'); child.value = decode(t); stack.at(-1).appendChild(child); }
  }
}
const storage = new Map([['math_shenti_v1', '{"1-1":3}'], ['kejian-report-v1:chuangguan', '{"solved":{"1-1":1}}']]);
const originalStorage = [...storage];
function boot() {
  const document = new El('document'); document.head = new El('head'); document.body = new El('body'); document.appendChild(document.head); document.appendChild(document.body);
  document.documentElement = { style: { setProperty() {} } };
  document.getElementById = id => descendants(document).find(el => el.id === id) || null;
  document.createElement = tag => new El(tag); document.execCommand = () => false;
  const app = new El('div', { id: 'app' }); document.body.appendChild(app);
  const timers = [];
  const ctx = { document, navigator: {}, console, confirm: () => true,
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k) },
    setTimeout: fn => timers.push(fn), clearTimeout() {}, addEventListener() {}, scrollTo() {} };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(site, 'common/report.js'), 'utf8'), ctx);
  scripts.forEach(s => vm.runInContext(s, ctx));
  return { ctx, document, run: s => vm.runInContext(s, ctx), timers };
}
let b = boot();
function el(s) { const result = b.document.querySelector(s); assert(result, 'Missing ' + s); return result; }
function click(target) {
  const t = typeof target === 'string' ? el(target) : target; assert(!t.disabled, 'Disabled click');
  if (t.onclick) t.onclick({ target: t, stopPropagation() {} });
  else { assert(t.attrs.onclick, 'No click handler'); vm.runInContext(t.attrs.onclick, b.ctx); }
}
function choose(index) { click(b.document.querySelectorAll('#body .opt')[index]); }
function fill(values) {
  const blanks = b.document.querySelectorAll('#body .blank'); assert.equal(blanks.length, values.length);
  blanks.forEach((bl, i) => { click(bl); click('#body [data-k="clr"]'); for (const digit of String(values[i])) click('#body [data-k="' + digit + '"]'); });
  click('#chk');
}
function step() { return b.run('curQ().steps[S.si]'); }
function solveStep() {
  const st = step();
  if (st.type === 'choice') { choose(st.a); click('#nextB'); }
  else if (st.type === 'multi') { st.a.forEach(choose); click('#chk'); click('#nextB'); }
  else if (st.type === 'blanks') { fill(st.a); click('#nextB'); }
  else if (st.type === 'diagram') { for (let i = 0; i < 12 && step() === st; i++) click('#dn'); assert.notEqual(step(), st); }
  else assert.fail('Untested step type: ' + st.type);
}
assert.match(el('h1').textContent, /说法找算法/);
assert.match(b.ctx.KejianReport.text(), /未对 15 题/);
click('#krGo');
assert.match(el('#krTa').textContent, /说法找算法/);
assert.match(el('#krMsg').textContent, /长按/);
click('#krClose');
// Exercise actual home → map → question controls.
click('.bigbtn'); assert.equal(b.document.querySelectorAll('.lv').length, 5); click('.lv');
for (let li = 0; li < 5; li++) {
  for (let qi = 0; qi < 3; qi++) {
    assert.equal(b.run('S.L'), li); assert.equal(b.run('S.Q'), qi);
    const q = b.run('curQ()');
    for (let i = 0; i < q.steps.length; i++) solveStep();
    assert.match(el('#step').textContent, /题完成/);
    assert.equal(b.run('S.prog[curQ().id]'), 3);
    const next = b.document.querySelectorAll('#step button').find(t => /下一题|下一关|完成全部/.test(t.textContent)); click(next);
  }
}
assert.equal(b.run('doneCount()'), 15); assert.equal(b.run('totalStars()'), 45);
assert.match(b.ctx.KejianReport.text(), /正确率：15\/15（100%）/);
click('#krGo'); assert.match(el('#krTa').textContent, /一次对 15 题/); click('#krClose');
b = boot(); assert.equal(b.run('totalStars()'), 45); assert.equal(b.run('doneCount()'), 15);
// Reset only new-page keys; old-page progress and report must survive.
b.run('resetAll()'); assert.equal(b.run('doneCount()'), 0);
for (const [key, value] of originalStorage) assert.equal(storage.get(key), value);
assert(!storage.has('kejian-report-v1:shuofa'));
b.run('startLevel(0)');
choose(1); assert.match(el('#fb').textContent, /提示/); assert(!b.run('S.busy'));
choose(1); assert.match(el('#fb').textContent, /讲解/); assert(b.run('S.busy'));
click('#nextB');
while (b.run('S.si < curQ().steps.length')) solveStep();
assert.equal(b.run('S.prog["1-1"]'), 2);
assert.match(b.ctx.KejianReport.text(), /第3次对/);
assert.match(b.ctx.KejianReport.text(), /首次错答：选了「一共有几个小朋友」/);
// Two expanded steps → one star. Unanswered forms are not mistakes.
b.run('S.Q=1;startQ()');
for (let n = 0; n < 2; n++) { const st = step(), wrong = (st.a + 1) % st.opts.length; choose(wrong); choose(wrong); click('#nextB'); }
while (step().type === 'diagram') solveStep();
solveStep();
assert.equal(step().type, 'blanks');
const missesBefore = JSON.parse(storage.get('kejian-report-v1:shuofa')).misses['1-2'];
click('#chk'); assert.match(el('#fb').textContent, /还有空没填/);
assert.equal(JSON.parse(storage.get('kejian-report-v1:shuofa')).misses['1-2'], missesBefore);
fill(step().a.map(() => 0)); assert.match(el('#fb').textContent, /提示/);
fill(step().a.map(() => 0)); assert.match(el('#fb').textContent, /讲解/); click('#nextB');
while (b.run('S.si < curQ().steps.length')) solveStep();
assert.equal(b.run('S.prog["1-2"]'), 1);
// Multi-select retry feedback, condition card removal, report persistence.
b.run('startLevel(4)'); solveStep(); choose(3); click('#chk'); assert.match(el('#fb').textContent, /提示/);
click('#chk'); assert.match(el('#fb').textContent, /讲解/); assert(el('#icards').children[3].classList.contains('off')); click('#nextB');
while (b.run('S.si < curQ().steps.length')) solveStep();
assert.equal(b.run('S.prog["5-1"]'), 2);
const textBefore = b.ctx.KejianReport.text(); b = boot(); assert.equal(b.ctx.KejianReport.text(), textBefore);
// Replay is cancelled on navigation. Flush stale callbacks and check next page stays intact.
b.run('startLevel(0);S.Q=0;startQ()'); solveStep(); solveStep(); solveStep();
click('.replay'); b.run('startLevel(2)'); const nextText = el('#qtext').textContent;
for (let n = 0; n < 20 && b.timers.length; n++) b.timers.shift()();
assert.equal(el('#qtext').textContent, nextText); assert.equal(el('#diag').textContent, '');
// A clean retry upgrades best stars, without erasing first wrong answers.
b.run('startLevel(0);S.Q=0;startQ()');
while (b.run('S.si < curQ().steps.length')) solveStep();
assert.equal(b.run('S.prog["1-1"]'), 3); assert.match(b.ctx.KejianReport.text(), /首次错答：选了「一共有几个小朋友」/);
for (const [key, value] of originalStorage) assert.equal(storage.get(key), value);
console.log('Interaction OK: all 15 questions, 45 stars, both feedback levels, choice / multi / blanks, best stars, persistence, isolated reset, replay cancellation, report submission and copy fallback.');
