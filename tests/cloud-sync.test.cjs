// Local-only regression: no network requests, no browser profile, no cloud writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const reportSource = fs.readFileSync(path.join(root, 'common/report.js'), 'utf8');
const URL = 'https://jpcrm2528800-d2gn2y85j9a2d680b-1462769606.ap-shanghai.app.tcloudbase.com/kejian-submit-report';
const PREFIX = 'kejian-report-v1:';
const HOME = 'kejian-home-submits-v1';
const READ = 'kejian-story-read-v1:';
const iso = n => new Date(n).toISOString();
const baseline = Date.parse('2026-11-08T02:00:00.000Z');
const question = { id: 'q1', brief: '1+1', tag: '加法' };
const store = (solved = {}, when = baseline, extra = {}) => ({ misses: {}, solved, firstWrong: {}, legacy: {}, attempts: [], when: iso(when), ...extra });
const record = (solved = {}, when = baseline, extra = {}) => ({ pageId: 'test', pageName: '测试', kind: 'progress', when: iso(when), summary: { once: 1, later: 0, correct: 1, total: 1 }, store: store(solved, when), ...extra });
function element() {
  const classes = new Set();
  return { style: {}, dataset: {}, children: [], textContent: '', hidden: false, disabled: false,
    classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)), contains: n => classes.has(n), toggle(n,on) { if(on)classes.add(n);else classes.delete(n); } },
    appendChild(child) { this.children.push(child); }, insertBefore(child) { this.children.push(child); },
    addEventListener() {}, setAttribute() {}, querySelector() { return null; }, querySelectorAll() { return []; }, matches() { return false; }, remove() {} };
}
function environment(initial = {}) {
  let now = baseline, timerId = 0;
  const storage = new Map(Object.entries(initial).map(([k,v]) => [k, JSON.stringify(v)]));
  const timers = new Map(), listeners = {}, docListeners = {}, elements = new Map();
  const requests = [], uploads = [], events = [];
  const env = { records: {}, response: null, requests, uploads, events, timers, storage, elements,
    read: key => JSON.parse(storage.get(key) || 'null'), write: (key,value) => storage.set(key,JSON.stringify(value)),
    now: value => { now = value; }, emit(name, event = {}) { (listeners[name] || []).forEach(fn => fn(event)); },
    documentEmit(name) { (docListeners[name] || []).forEach(fn => fn()); },
    async tick(ms) { now += ms; for(const [id,t] of [...timers]) if(t.at <= now) {timers.delete(id);t.fn();} await drain(); } };
  class TestDate extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const document = { visibilityState: 'visible', head: element(), body: element(),
    createElement: element, getElementById: id => elements.get(id) || null,
    addEventListener(name, fn) { (docListeners[name] ||= []).push(fn); } };
  const context = { document, Date: TestDate, Promise, JSON, Object, Array, String, Number, Math, console,
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key,value) => storage.set(key,value), removeItem: key => storage.delete(key) },
    navigator: { sendBeacon(url,blob) { assert.equal(url,URL); uploads.push(JSON.parse(blob.parts.join(''))); return true; } },
    Blob: class { constructor(parts) { this.parts=parts; } }, CustomEvent: class { constructor(type, options) { this.type=type; this.detail=options.detail; } },
    setTimeout(fn,delay) { const id=++timerId;timers.set(id,{fn,at:now+delay,delay});return id; }, clearTimeout(id) { timers.delete(id); },
    addEventListener(name,fn) { (listeners[name] ||= []).push(fn); },
    dispatchEvent(event) { events.push(event); env.emit(event.type,event); },
    fetch(url,options) { requests.push({url,...options}); return env.response ? env.response(url,options) : Promise.resolve({ok:true,json:()=>Promise.resolve({ok:true,records:env.records,pulledAt:iso(now)})}); }
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(reportSource,context,{filename:'common/report.js'});
  env.api=context.KejianReport;env.context=context;env.document=document;
  env.mount = async (id='test', extra={}) => { await env.api.mount({id,name:'测试',questions:[question],noButton:true,...extra}); };
  return env;
}
async function drain() { for(let i=0;i<12;i++)await Promise.resolve(); }
async function pull(env, records) { env.records=records; return env.api.syncFromCloud(); }
function browserDOM(e) {
  function makeElement() {
    const el=element();let html='';
    Object.defineProperty(el,'innerHTML',{get:()=>html,set(value){html=value;for(const m of value.matchAll(/\bid="([^"]+)"/g))e.elements.set(m[1],makeElement());}});
    return el;
  }
  e.document.createElement=makeElement;
  e.document.querySelector=()=>null;e.document.querySelectorAll=()=>[];
  e.document.currentScript={src:'https://example.test/common/nav.js'};
  e.document.documentElement={style:{setProperty(){}},scrollHeight:2000,clientHeight:1000,scrollTop:0};
  e.document.body.scrollHeight=2000;e.document.body.scrollTop=0;
  e.context.URL=global.URL;e.context.location={pathname:'/story/',href:'https://example.test/story/'};e.context.scrollTo=()=>{};
  return makeElement;
}
const tests=[];
function test(name,fn) { tests.push({name,fn}); }

test('progress is debounced 8 seconds; miss/pass snapshots and lifecycle flush are version-deduplicated', async () => {
  const e=environment();await e.mount();e.api.miss('q1','3');await e.tick(4000);e.api.pass('q1','2');
  await e.tick(7999);assert.equal(e.uploads.length,0);await e.tick(1);assert.equal(e.uploads.length,1);
  const p=e.uploads[0];assert.equal(p.kind,'progress');assert.equal(p.store.misses.q1,1);assert.equal(p.store.solved.q1,1);
  assert.equal(p.store.firstWrong.q1,'3');assert.equal(p.attempts.length,2);assert.equal(p.summary.later,1);
  assert.equal(p.when,p.store.when);assert.equal(e.read(PREFIX+'test').pending,true);
  e.document.visibilityState='hidden';e.documentEmit('visibilitychange');e.emit('pagehide');assert.equal(e.uploads.length,1);
  e.api.pass('q2','4');e.emit('pagehide');assert.equal(e.uploads.length,2);
});
test('new pending local state survives older cloud when receivedAt is later', async () => {
  const e=environment();await e.mount();e.api.miss('q1','3');const local=e.read(PREFIX+'test');
  await pull(e,{test:record({q1:1},baseline-1000,{receivedAt:iso(baseline+10000)})});
  assert.equal(e.read(PREFIX+'test').when,local.when);assert.equal(e.read(PREFIX+'test').misses.q1,1);
  assert.equal(e.read(HOME),null);
});
test('newer unuploaded home submission protects an older report cache too', async () => {
  const e=environment({[PREFIX+'test']:store({q1:1},baseline-5000),[HOME]:{test:{when:iso(baseline+1000),uploaded:false,summary:{later:1}}}});
  await pull(e,{test:record({},baseline)});
  assert.equal(e.read(PREFIX+'test').solved.q1,1);assert.equal(e.read(HOME).test.uploaded,false);
});
test('pending home timestamp is respected even when no report cache exists', async () => {
  const e=environment({[HOME]:{test:{when:iso(baseline+1000),uploaded:false,summary:{later:1}}}});
  await pull(e,{test:record({},baseline)});assert.equal(e.read(PREFIX+'test'),null);assert.equal(e.read(HOME).test.uploaded,false);
});
test('new cloud state restores report/home and dispatches page event with CORS pull contract', async () => {
  const e=environment();const result=await pull(e,{test:record({q1:1},baseline+1000)});
  assert.equal(result.ok,true);assert.equal(e.read(PREFIX+'test').solved.q1,1);assert.equal(e.read(HOME).test.summary.once,1);
  assert.equal(e.events[0].detail.pageId,'test');assert.equal(e.requests[0].mode,'cors');assert.equal(e.requests[0].url,URL);
  assert.equal(e.requests[0].headers['Content-Type'],'text/plain;charset=UTF-8');assert.equal(JSON.parse(e.requests[0].body).action,'pull');
});
test('same acknowledged cloud snapshot clears pending; failed/no acknowledgement never does', async () => {
  const e=environment();await e.mount();e.api.pass('q1');e.api.uploadProgressNow();const p=e.uploads[0];
  await pull(e,{test:p});assert.equal(e.read(PREFIX+'test').pending,undefined);
});
test('legacy question labels migrate once/later/old/unfinished and firstWrong', async () => {
  const e=environment();await pull(e,{test:{when:iso(baseline),questions:[
    {id:'a',status:'一次对'},{id:'b',status:'各步一次对'},{id:'c',status:'第4次对',firstWrong:'12'},
    {id:'d',status:'曾错后做对（分步作答）'},{id:'e',status:'已对（接入前完成）'},{id:'f',status:'未对',firstWrong:'错答'}],attempts:[{id:'f',ok:false}]}});
  const s=e.read(PREFIX+'test');assert.equal(s.solved.a,1);assert.equal(s.misses.a,0);assert.equal(s.solved.b,1);
  assert.equal(s.misses.c,3);assert.equal(s.firstWrong.c,'12');assert.equal(s.misses.d,1);assert.equal(s.legacy.e,1);
  assert.equal(s.solved.e,undefined);assert.equal(s.solved.f,undefined);assert.equal(s.firstWrong.f,'错答');assert.equal(s.attempts.length,1);
});
test('reading-only upload includes target store and empty receipt cannot erase exercises', async () => {
  const e=environment({[PREFIX+'mixed']:store({q1:1},baseline-1000)});await e.mount('other');
  e.api.submitStoryRead({kind:'story-read',pageId:'mixed',when:iso(baseline),summary:{read:true}});
  assert.equal(e.uploads[0].store.solved.q1,1);assert.equal(e.uploads[0].kind,'story-read');
  await pull(e,{mixed:{kind:'story-read',when:iso(baseline+1000),summary:{read:true},store:store({},baseline+1000)}});
  assert.equal(e.read(PREFIX+'mixed').solved.q1,1);assert.equal(e.read(READ+'mixed').summary.read,true);
  assert.equal(e.read(HOME).mixed.kind,'story-read');
});
test('summary.read also restores reading; older receipt cannot overwrite local pending read', async () => {
  const e=environment({[READ+'story']:{when:iso(baseline+2000),uploaded:false,summary:{read:true,chaptersReached:9}}});
  await pull(e,{story:{when:iso(baseline),summary:{read:true,chaptersReached:1}}});assert.equal(e.read(READ+'story').summary.chaptersReached,9);
  await pull(e,{other:{receivedAt:iso(baseline+1000),summary:{read:true}}});assert.equal(e.read(READ+'other').kind,'story-read');
});
test('stale store inside a newer reading receipt does not roll back practice', async () => {
  const e=environment({[PREFIX+'mixed']:store({q1:1,q2:1},baseline+1000)});
  await pull(e,{mixed:{kind:'story-read',when:iso(baseline+2000),summary:{read:true},store:store({q1:1},baseline)}});
  assert.equal(e.read(PREFIX+'mixed').solved.q2,1);assert.equal(e.read(READ+'mixed').summary.read,true);
});
test('pull is shared per page and a hung/offline pull settles mount after 4.5 seconds', async () => {
  const e=environment();e.response=()=>new Promise(()=>{});
  const mounting=e.mount('test',{legacySolved:['q1']});const again=e.api.syncFromCloud({pageId:'test'});
  assert.equal(e.requests.length,1);assert.equal(JSON.parse(e.requests[0].body).pageId,'test');
  await e.tick(4500);await mounting;assert.equal((await again).error,'timeout');assert.equal(e.read(PREFIX+'test').legacy.q1,1);
});
test('late pull after clear cannot resurrect answers; clear records/upload reset before reload', async () => {
  const e=environment();await e.mount();e.api.pass('q1');let resolve;
  e.response=()=>new Promise(r=>{resolve=r});const pending=e.api.syncFromCloud({pageId:'test'});const old=e.read(PREFIX+'test');
  e.api.clear();resolve({ok:true,json:()=>Promise.resolve({ok:true,records:{test:record({q1:1},Date.parse(old.when))}})});await pending;
  const cleared=e.read(PREFIX+'test');assert.equal(cleared.solved.q1,undefined);assert.equal(cleared.cleared,true);assert.equal(e.uploads.at(-1).store.cleared,true);
});
test('page-filtered pull ignores another page and handles malformed/unavailable responses', async () => {
  const e=environment();e.records={test:record({q1:1}),other:record({q2:1})};await e.api.syncFromCloud({pageId:'test'});
  assert.equal(e.read(PREFIX+'other'),null);e.response=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({ok:false})});
  assert.equal((await e.api.syncFromCloud()).ok,false);e.response=()=>Promise.reject(new Error('offline'));
  assert.equal((await e.api.syncFromCloud()).ok,false);
});
test('home pull restores all river-lantern gates and accepts extras only when newer', async () => {
  const e=environment({'changdu-hedeng-v1':{done:{ruler:1},strips:9,when:iso(baseline)}});
  await pull(e,{changdu:record({units:1,lens:1,rope:1,trackQ:1,lamps:1,momUnit:1,momCm:1,sortFill:1,sortOrder:1},baseline+1000,
    {store:store({units:1,lens:1,rope:1,trackQ:1,lamps:1,momUnit:1,momCm:1,sortFill:1,sortOrder:1},baseline+1000,{pageExtras:{hedeng:{strips:2,when:iso(baseline-1000)}}})})});
  let h=e.read('changdu-hedeng-v1');assert.equal(h.strips,9);assert.equal(h.done.track,1);assert.equal(h.done.finale,1);assert.equal(h.done.ruler,1);
  await pull(e,{changdu:record({trackQ:1},baseline+2000,{store:store({trackQ:1},baseline+2000,{pageExtras:{hedeng:{strips:10,when:iso(baseline+2000)}}})})});
  assert.equal(e.read('changdu-hedeng-v1').strips,10);
});
test('pageExtras are included in progress snapshots', async () => {
  const e=environment();await e.mount('changdu');e.api.updatePageExtras({hedeng:{done:{trackQ:1},when:iso(baseline)}});e.api.uploadProgressNow();
  assert.equal(e.uploads[0].store.pageExtras.hedeng.done.trackQ,1);
});
test('extras without nested timestamp inherit the record/store version', async () => {
  const e=environment({'changdu-hedeng-v1':{done:{ruler:1},strips:2,when:iso(baseline)}});
  await pull(e,{changdu:record({rope:1},baseline+1000,{store:store({rope:1},baseline+1000,{pageExtras:{hedeng:{strips:10}}})})});
  assert.equal(e.read('changdu-hedeng-v1').strips,10);
});
test('reading nav restores its button and progress, while pure practice has no read button', async () => {
  const nav=fs.readFileSync(path.join(root,'common/nav.js'),'utf8');
  const e=environment();browserDOM(e);e.records={story:{kind:'story-read',when:iso(baseline),summary:{read:true}}};
  vm.runInContext(nav,e.context);e.context.SiteNav.mount({title:'故事',reading:true,pageId:'story'});
  assert.equal(e.elements.get('snRead').disabled,true);await drain();
  assert.equal(e.elements.get('snRead').textContent,'已读完');assert.equal(e.elements.get('snRead').disabled,true);
  assert.equal(e.elements.get('snFill').style.width,'100%');assert.match(e.elements.get('snReadHint').textContent,/已经读完/);
  const p=environment();browserDOM(p);vm.runInContext(nav,p.context);p.context.SiteNav.mount({title:'练习',report:true});await drain();
  assert.equal(p.elements.has('snRead'),false);assert.ok(p.elements.has('snWork'));
});
test('reading nav click still saves and uploads a story-read receipt with store', async () => {
  const e=environment();browserDOM(e);vm.runInContext(fs.readFileSync(path.join(root,'common/nav.js'),'utf8'),e.context);
  e.context.SiteNav.mount({title:'故事',reading:true,pageId:'story'});await drain();
  e.document.documentElement.scrollTop=950;e.emit('scroll');assert.equal(e.elements.get('snRead').disabled,false);
  e.elements.get('snRead').onclick();await drain();assert.equal(e.uploads[0].kind,'story-read');assert.equal(e.uploads[0].summary.read,true);
  assert.ok(e.uploads[0].store);assert.equal(e.read(READ+'story').summary.read,true);
});
test('home renders only after pull and re-syncs on load/pageshow while preserving submission cards', async () => {
  const e=environment();browserDOM(e);const app=element();app.innerHTML='';e.elements.set('practiceDeck',app);let resolve;
  for(const id of ['storyDeck','storyCount','practiceCount'])e.elements.set(id,element());
  e.response=()=>new Promise(r=>{resolve=r});
  const source=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
  vm.runInContext(source,e.context);assert.equal(app.innerHTML,'');
  resolve({ok:true,json:()=>Promise.resolve({ok:true,records:{'yupeng-lianxi':record({q1:1},baseline)}})});await drain();
  assert.match(app.innerHTML,/一次对 1/);assert.match(app.innerHTML,/已提交/);
  e.response=null;e.emit('load');await drain();e.emit('pageshow');await drain();assert.equal(e.requests.length,3);
});
test('river-lantern page reloads independent state, normalizes activities and opens gates on sync event', async () => {
  const e=environment();const source=fs.readFileSync(path.join(root,'changdu/index.html'),'utf8');
  const setup=source.slice(source.indexOf("  var KEY = 'changdu-hedeng-v1';"),source.indexOf('  function clamp('));
  const gates=source.slice(source.indexOf('  var GATES = ['),source.indexOf('  function buildRuler('));
  const listener=source.match(/    window\.addEventListener\('kejian-progress-synced',[\s\S]*?\n    \}\);/)[0];
  for(const id of ['ch2','ch3','ch4','ch5','ch6','ending','progText','progFill','progBar'])e.elements.set(id,element());
  let paints=0;for(const name of ['renderRuler','renderUnits','renderLens','renderStrips','renderTrack','renderOrder'])e.context[name]=()=>paints++;
  vm.runInContext(setup+gates+listener,e.context);
  await pull(e,{changdu:record({ruler:1,units:1,lens:1,rope:1,trackQ:1,sortOrder:1},baseline)});
  assert.equal(e.context.state.done.track,1);assert.equal(e.context.state.done.finale,1);
  assert.equal(e.context.state.origin,0);assert.equal(e.context.state.strips,10);assert.equal(e.context.state.lensSeen,1);
  assert.equal(e.context.state.reached,1);assert.equal(e.context.state.order.length,4);
  for(const id of ['ch2','ch3','ch4','ch5','ch6','ending'])assert.equal(e.elements.get(id).classList.contains('on'),true,id);
  assert.equal(e.elements.get('progFill').style.width,'100%');assert.equal(paints,6);
});
test('failed progress upload can retry; a reopened page retries a queued unconfirmed version', async () => {
  const e=environment();await e.mount();e.context.navigator.sendBeacon=()=>false;e.response=()=>Promise.reject(new Error('offline'));
  e.api.pass('q1');e.api.uploadProgressNow();await drain();assert.equal(e.read(PREFIX+'test').pending,true);
  const failedCount=e.requests.length;e.api.uploadProgressNow();await drain();assert.equal(e.requests.length,failedCount+1);
  const reopened=environment({[PREFIX+'test']:e.read(PREFIX+'test')});await reopened.mount();await reopened.tick(8000);assert.equal(reopened.uploads.length,1);
});
test('practice restore updates live maps, marks recovered questions and unlocks cleared ones', async () => {
  const e=environment({[PREFIX+'test']:store({q2:1},baseline,{misses:{q1:2,q2:1},legacy:{q3:1}})});
  const solved={q1:1},misses={q1:0},marked=[];let paints=0;
  const box=element(),input=element(),submit=element(),feedback=element(),explain=element();
  input.disabled=true;input.value='answer';input.matches=()=>true;box.classList.add('done');box.querySelectorAll=()=>[input];box.querySelector=()=>submit;
  e.elements.set('box-q1',box);e.elements.set('fb-q1',feedback);e.elements.set('ans-q1',explain);e.elements.set('fb-q3',element());
  e.api.restorePractice({pageId:'test',questions:[{id:'q1'},{id:'q2'},{id:'q3'}],solved,misses,mark:q=>marked.push(q.id),paint:()=>paints++});
  assert.equal(solved.q1,undefined);assert.equal(misses.q1,2);assert.equal(input.disabled,false);assert.equal(input.value,'');assert.equal(explain.open,true);
  assert.deepEqual(marked,['q2','q3']);assert.equal(paints,1);assert.match(e.elements.get('fb-q3').textContent,/接入前完成/);
});

test('all public JS/inline scripts parse; reader pages subscribe; private names absent; URL unchanged', () => {
  const files=[];function walk(dir) {for(const item of fs.readdirSync(dir,{withFileTypes:true})) {const file=path.join(dir,item.name);if(item.isDirectory()&&!item.name.startsWith('.')&&item.name!=='tests')walk(file);else if(item.isFile()&&/\.(html|js|css)$/.test(file))files.push(file);}}walk(root);
  let scripts=0,readers=0;const forbidden=['\u7cd6\u679c','\u79e6\u7ffc\u7433','\u79e6\u7fd4\u7433'];
  for(const file of files) {const source=fs.readFileSync(file,'utf8');for(const name of forbidden)assert.ok(!source.includes(name),`${file}: private name`);
    if(file.endsWith('.js')) {new vm.Script(source,{filename:file});scripts++;}
    if(file.endsWith('.html')) for(const m of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if(/\bsrc\s*=/.test(m[1])||/\btype\s*=\s*["'](?:application\/json|application\/ld\+json)/.test(m[1])||!m[2].trim())continue;
      new vm.Script(m[2],{filename:file});scripts++;
    }
    if(/localStorage\.getItem\('kejian-report-v1:[^']+'/.test(source)) {assert.ok(source.includes("'kejian-progress-synced'"),file);readers++;}
  }
  assert.equal(readers,17);assert.ok(reportSource.includes("var REPORT_UPLOAD_URL = '"+URL+"'"));
  assert.match(fs.readFileSync(path.join(root,'index.html'),'utf8'),/<script src="common\/report\.js"><\/script>/);
  assert.match(fs.readFileSync(path.join(root,'changdu/index.html'),'utf8'),/reading: true/);
  console.log(`  Static coverage: ${files.length} public files, ${scripts} scripts, ${readers} direct practice readers, 0 private-name hits`);
});

(async()=>{let passed=0;for(const {name,fn} of tests) {try{await fn();console.log('PASS '+name);passed++;}catch(error){console.error('FAIL '+name);console.error(error);process.exitCode=1;}}
console.log(`${passed}/${tests.length} tests passed`);})();
