/* 第三单元合集。每节 2～3 题。展示只用加减和表内乘除；连加最多 5 项。 */
(function (global) {
  function segAfter(folds) {
    var n = 1;
    var i;
    for (i = 0; i < folds; i++) n = n + n;
    return n;
  }

  function repeatAdd(n, count) {
    var parts = [];
    var i;
    if (count > 5) throw new Error('连加超过 5 项：' + count);
    for (i = 0; i < count; i++) parts.push(String(n));
    return parts.join(' + ');
  }

  function isTableMul(a, b) {
    return a >= 1 && a <= 9 && b >= 1 && b <= 9;
  }

  function isTableDiv(dividend, divisor) {
    if (divisor < 1 || divisor > 9) return false;
    if (dividend % divisor !== 0) return false;
    var q = dividend / divisor;
    return q >= 1 && q <= 9;
  }

  function assert(cond, msg) {
    if (!cond) throw new Error('合集验算失败：' + msg);
  }

  function checkMulDivInString(s, ctx) {
    if (!s || typeof s !== 'string') return;
    var mulRe = /(\d+)\s*[×x＊*]\s*(\d+)/g;
    var divRe = /(\d+)\s*÷\s*(\d+)/g;
    var addRe = /(?:\d+\s*\+\s*){5,}\d+/g;
    var m;
    while ((m = mulRe.exec(s)) !== null) {
      assert(isTableMul(parseInt(m[1], 10), parseInt(m[2], 10)), '表外乘法 ' + ctx + '：' + m[0]);
    }
    while ((m = divRe.exec(s)) !== null) {
      assert(isTableDiv(parseInt(m[1], 10), parseInt(m[2], 10)), '表外除法 ' + ctx + '：' + m[0]);
    }
    while ((m = addRe.exec(s)) !== null) {
      assert(false, '连加超过 5 项 ' + ctx + '：' + m[0]);
    }
    assert(s.indexOf(String.fromCharCode(31958, 26524)) < 0, '出现不该出现的称呼 ' + ctx);
  }

  function walkStrings(obj, ctx, seen) {
    if (!obj || typeof obj !== 'object') return;
    if (seen.has(obj)) return;
    seen.add(obj);
    if (Array.isArray(obj)) {
      obj.forEach(function (item, idx) {
        walkStrings(item, ctx + '[' + idx + ']', seen);
      });
      return;
    }
    Object.keys(obj).forEach(function (key) {
      var val = obj[key];
      if (typeof val === 'string') checkMulDivInString(val, ctx + '.' + key);
      else if (typeof val === 'object') walkStrings(val, ctx + '.' + key, seen);
    });
  }

  function foldFormula(total, segs, each) {
    if (!Number.isInteger(each) || each <= 0 || !Number.isInteger(segs) || segs < 1) return '';
    if (segs === 1) return '还没对折，总长就是 ' + total + ' 厘米';
    if (segs <= 9 && each >= 1 && each <= 9 && isTableDiv(total, segs) && each * segs === total) {
      return total + ' ÷ ' + segs + ' = ' + each + ' 厘米';
    }
    if (segs <= 5) return repeatAdd(each, segs) + ' = ' + total + ' 厘米';
    return '每段 ' + each + ' 厘米（段数是一段一段数出来的）';
  }

  function sumFormula(unit, count) {
    var total = 0;
    var i;
    assert(count >= 1 && count <= 5, '连加项数不对');
    for (i = 0; i < count; i++) total = total + unit;
    if (count === 1) return unit + '';
    return repeatAdd(unit, count) + ' = ' + total;
  }

  function C(stage, p, opts, a, hint, exp, line) {
    return { stage: stage, type: 'choice', p: p, opts: opts, a: a, hint: hint, exp: exp, line: line };
  }

  function N(stage, p, expr, a, hint, exp, line) {
    return { stage: stage, type: 'num', p: p, expr: expr, a: a, hint: hint, exp: exp, line: line };
  }

  function Q(id, title, text, steps, proof) {
    return { id: String(id), title: title, text: text, steps: steps, proof: proof };
  }

  function place(correct, wrongs, slot) {
    var pool = [];
    wrongs.forEach(function (w) {
      assert(w !== correct, '干扰项和答案相同：' + correct);
      if (pool.indexOf(w) < 0) pool.push(w);
    });
    assert(pool.length >= 2, '干扰项不够：' + correct);
    var opts = [pool[0], pool[1]];
    var at = slot % 3;
    opts.splice(at, 0, correct);
    assert(opts.length === 3 && opts[at] === correct, '选项没有放对：' + correct);
    return { opts: opts, a: at };
  }

  function segExplain(folds) {
    if (folds === 1) return '对折 1 次：1 段变成 2 段。';
    if (folds === 2) return '对折 1 次得 2 段；再对折 1 次，每一段又变成 2 段，2 + 2 = 4 段。';
    return '对折 1 次得 2 段；再对折得 4 段；再对折 1 次，4 段每段又变 2 段，一共 8 段。';
  }

  var made = [];

  (function foldForward() {
    var total = 24;
    var folds = 3;
    var segs = segAfter(folds);
    var each = total / segs;
    assert(segs === 8 && each === 3 && isTableDiv(total, segs), '对折原题');
    var segPlaced = place(segs + ' 段', ['4 段', '6 段'], 0);
    var eachPlaced = place(each + ' 厘米', ['6 厘米', '4 厘米'], 1);
    var wayPlaced = place('先数段数，再用总长 ÷ 段数', ['对折几次就 ÷ 几', '直接当成 4 段'], 2);
    made.push(Q(1, '第 1 题 · 24 厘米对折 3 次',
      '一根长 24 厘米的铁丝，对折 3 次。每段长多少厘米？',
      [
        C(0, '对折 3 次以后，一共几段？', segPlaced.opts, segPlaced.a,
          '一段一段数：1 变成 2，2 变成 4，4 变成 8。',
          segExplain(3),
          '8 段'),
        N(1, '每段长多少厘米？', '24 ÷ 8 =', each,
          '总长 24 厘米平均分成 8 段。',
          '24 ÷ 8 = 3 厘米。8 段每段都是 3 厘米，可以在图上一段一段点出来。',
          '每段 3 厘米'),
        C(2, '哪一句是正确做法？', wayPlaced.opts, wayPlaced.a,
          '对折 3 次不是 4 段，也不是「对折几次就除以几」。',
          '答：每段 3 厘米。' + segExplain(3),
          '先数段数再除')
      ],
      { id: '1', kind: 'fold', section: '对折', answer: 3, segs: 8 }));
  })();

  (function foldJudge() {
    var segs = 8;
    var each = 3;
    var okPlaced = place('不对', ['对', '差不多'], 1);
    var segPlaced = place('8 段', ['4 段', '6 段'], 2);
    var eachPlaced = place('3 厘米', ['6 厘米', '12 厘米'], 0);
    assert(isTableDiv(24, 4) && isTableDiv(24, 8), '错法算式也必须在表内');
    made.push(Q(2, '第 2 题 · 小美把 3 次当成 4 段',
      '一根长 24 厘米的铁丝，对折 3 次。小美说：「对折 3 次就是 4 段，24 ÷ 4 = 6，每段 6 厘米。」',
      [
        C(0, '小美这样做，对吗？', okPlaced.opts, okPlaced.a,
          '对折 3 次要数成 8 段，不是 4 段。',
          '对折 1 次 2 段，再对折 4 段，再对折 8 段。24 ÷ 4 = 6 用错了段数。',
          '不对'),
        C(1, '对折 3 次以后，一共几段？', segPlaced.opts, segPlaced.a,
          segExplain(3),
          segExplain(3),
          '8 段'),
        C(2, '每段长多少厘米？', eachPlaced.opts, eachPlaced.a,
          '24 ÷ 8 = 3。',
          '答：每段 3 厘米。24 ÷ 8 = 3。',
          '3 厘米')
      ],
      { id: '2', kind: 'judge', section: '对折', answer: each, segs: segs }));
  })();

  (function foldInverse() {
    var each = 4;
    var folds = 2;
    var segs = segAfter(folds);
    var total = 0;
    var i;
    for (i = 0; i < segs; i++) total = total + each;
    assert(segs === 4 && total === 16, '反求原长');
    var segPlaced = place('4 段', ['2 段', '8 段'], 2);
    var lenPlaced = place('16 厘米', ['8 厘米', '12 厘米'], 0);
    made.push(Q(3, '第 3 题 · 知道每段求原长',
      '一根铁丝对折 2 次，每段长 4 厘米。这根铁丝原来长多少厘米？',
      [
        C(0, '对折 2 次以后，一共几段？', segPlaced.opts, segPlaced.a,
          segExplain(2),
          segExplain(2),
          '4 段'),
        N(1, '原来长多少厘米？', '4 + 4 + 4 + 4 =', total,
          '4 段一样长，把 4 连加 4 次。',
          '4 + 4 + 4 + 4 = 16 厘米。',
          '原来 16 厘米'),
        C(2, '哪一句对？', lenPlaced.opts, lenPlaced.a,
          '原长是每段连加段数次，不是只加两次。',
          '答：原来长 16 厘米。',
          '16 厘米')
      ],
      { id: '3', kind: 'num', section: '对折', answer: total, segs: segs }));
  })();

  (function estDoor() {
    var okPlaced = place('不对', ['对', '差不多'], 0);
    var cmPlaced = place('20 厘米', ['2 厘米', '200 厘米'], 1);
    var unitPlaced = place('米', ['分米', '厘米'], 2);
    made.push(Q(4, '第 4 题 · 门大约多高',
      '门高约 2（ ）。小美填了「分米」。',
      [
        C(0, '小美这样做，对吗？', okPlaced.opts, okPlaced.a,
          '2 分米只有两拃那么高，门要比人还高一点。',
          '2 分米 = 10 + 10 = 20 厘米，比一本故事书高不了多少。门大约高 2 米。',
          '不对'),
        N(1, '2 分米等于多少厘米？', '10 + 10 =', 20,
          '1 分米 = 10 厘米，2 分米就是两个 10 厘米。',
          '10 + 10 = 20 厘米。这么矮不是门。',
          '20 厘米'),
        C(2, '门高约 2（ ）应该填什么？', unitPlaced.opts, unitPlaced.a,
          '想想教室的门，大概到爸爸头顶上面，用米。',
          '答：填米。门高约 2 米。',
          '2 米')
      ],
      { id: '4', kind: 'judge', section: '估测', answer: 20 }));
  })();

  (function estButterfly() {
    var likePlaced = place('大约 3 厘米多一点点', ['大约一把直尺那么长', '大约一扇门那么高'], 1);
    var unitPlaced = place('毫米', ['厘米', '分米'], 2);
    var judgePlaced = place('不像，太大了', ['像', '差不多'], 0);
    made.push(Q(5, '第 5 题 · 蝴蝶身长',
      '蝴蝶身长约 35（ ）。小美填了「厘米」。',
      [
        C(0, '35 毫米大约和下面哪一句一样？', likePlaced.opts, likePlaced.a,
          '蝴蝶身子比一节手指还短。',
          '10 毫米 = 1 厘米。35 毫米比 3 厘米再多一点点，不是 35 厘米。',
          '大约 3 厘米多一点'),
        C(1, '括号里应填什么单位？', unitPlaced.opts, unitPlaced.a,
          '要写成 35，单位就用毫米。',
          '答：填毫米。蝴蝶身长约 35 毫米。',
          '35 毫米'),
        C(2, '小美填成 35 厘米，像蝴蝶吗？', judgePlaced.opts, judgePlaced.a,
          '35 厘米比一把短尺还长，蝴蝶没有那么大。',
          '答：不像。35 厘米太大了，应该是 35 毫米。',
          '不像')
      ],
      { id: '5', kind: 'choice', section: '估测', answer: '毫米' }));
  })();

  (function estMom() {
    var unitPlaced = place('分米', ['厘米', '毫米'], 2);
    var sixPlaced = place('60 厘米', ['6 厘米', '16 厘米'], 0);
    made.push(Q(6, '第 6 题 · 妈妈的身高',
      '妈妈高约 1 米 6（ ）。小美填了「厘米」。',
      [
        C(0, '括号里填什么单位？', unitPlaced.opts, unitPlaced.a,
          '1 米 6 厘米只比 1 米多一点点，妈妈没有那么矮。',
          '1 米后面常接分米。6 分米是 6 个十厘米，也就是 60 厘米。',
          '分米'),
        C(1, '6 分米是多少厘米？', sixPlaced.opts, sixPlaced.a,
          '1 分米 = 10 厘米。6 个十厘米是 60 厘米。',
          '6 个十厘米 = 60 厘米。不要写成 6 厘米。',
          '60 厘米'),
        N(2, '1 米 6 分米一共多少厘米？', '100 + 60 =', 160,
          '1 米 = 100 厘米，再加 60 厘米。',
          '100 + 60 = 160 厘米。1 米 6 厘米只有 106 厘米，太矮了。',
          '160 厘米')
      ],
      { id: '6', kind: 'num', section: '估测', answer: 160 }));
  })();

  (function gapBus() {
    var segs = 3;
    var meters = 600 + 600 + 600;
    assert(meters === 1800 && segs <= 5, '车站路程');
    var segPlaced = place('3 段', ['4 段', '5 段'], 1);
    var wayPlaced = place('第 1 站到第 4 站是 3 段', ['有 4 个站就是 4 段', '4 + 1 = 5，所以是 5 段'], 2);
    made.push(Q(7, '第 7 题 · 从第 1 站到第 4 站',
      '公交车每相邻两站之间大约相距 600 米。小美从第 1 站上车，坐到第 4 站下车。大约走了多少米？',
      [
        C(0, '第 1 站到第 4 站有几段路？', segPlaced.opts, segPlaced.a,
          '站和站之间才是一段。从 1 到 2、2 到 3、3 到 4，数一数。',
          '4 个站中间有 3 段。段数 = 站数 − 1。',
          '3 段'),
        N(1, '3 段一共多少米？', '600 + 600 + 600 =', meters,
          '有 3 段，就把 600 米连加 3 次。',
          '600 + 600 + 600 = 1800 米。',
          '1800 米'),
        C(2, '哪一句对？', wayPlaced.opts, wayPlaced.a,
          '要数段数，不要把站数当成段数，也不要再加 1。',
          '答：大约走了 1800 米。',
          '3 段，1800 米')
      ],
      { id: '7', kind: 'num', section: '间隔', answer: meters, segs: segs }));
  })();

  (function gapTree() {
    var trees = 5;
    var segs = trees - 1;
    var len = 8 + 8 + 8 + 8;
    assert(segs === 4 && len === 32, '植树');
    var segPlaced = place('4 段', ['5 段', '6 段'], 0);
    var wayPlaced = place('两端都种时，段数比棵数少 1', ['段数和棵数一样多', '段数比棵数多 1'], 1);
    made.push(Q(8, '第 8 题 · 两端都种树',
      '小路的一边种树，两端都种。一共种了 5 棵。两棵树中间是一段。每段长 8 米。这排树之间一共有几段？有多长？',
      [
        C(0, '5 棵树之间有几段？', segPlaced.opts, segPlaced.a,
          '在线段图上点一点：棵和棵之间才是一段，5 棵中间有 4 段。',
          '两端都种：段数 = 棵数 − 1 = 4 段。',
          '4 段'),
        N(1, '4 段一共多少米？', '8 + 8 + 8 + 8 =', len,
          '每段 8 米，连加 4 次。',
          '8 + 8 + 8 + 8 = 32 米。',
          '32 米'),
        C(2, '哪一句对？', wayPlaced.opts, wayPlaced.a,
          '两端都有树时，段数比棵数少 1。',
          '答：有 4 段，长 32 米。',
          '4 段，32 米')
      ],
      { id: '8', kind: 'num', section: '间隔', answer: len, segs: segs }));
  })();

  (function gapJudge() {
    var segs = 5;
    var len = 4 + 4 + 4 + 4 + 4;
    assert(segs === 6 - 1 && len === 20, '辨错段数');
    var okPlaced = place('不对', ['对', '差不多'], 2);
    var segPlaced = place('5 段', ['6 段', '7 段'], 0);
    made.push(Q(9, '第 9 题 · 小美把站数当成段数',
      '从第 1 站走到第 6 站，每段 4 米。小美说：「有 6 个站，所以走了 6 段。」',
      [
        C(0, '小美这样做，对吗？', okPlaced.opts, okPlaced.a,
          '段数比站数少 1。6 个站中间只有 5 段。',
          '第 1 站到第 6 站：中间 5 段，不是 6 段。',
          '不对'),
        C(1, '一共有几段？', segPlaced.opts, segPlaced.a,
          '在图上从第 1 站数到第 6 站，空档有 5 个。',
          '6 − 1 = 5 段。',
          '5 段'),
        N(2, '每段 4 米，一共多少米？', '4 + 4 + 4 + 4 + 4 =', len,
          '5 段，把 4 米连加 5 次。',
          '4 + 4 + 4 + 4 + 4 = 20 米。',
          '20 米')
      ],
      { id: '9', kind: 'judge', section: '间隔', answer: len, segs: segs }));
  })();

  (function sawCuts() {
    var pieces = 4;
    var cuts = pieces - 1;
    assert(cuts === 3, '锯木头次数');
    var cutPlaced = place('3 处', ['4 处', '2 处'], 1);
    var wayPlaced = place('锯的次数比段数少 1', ['锯成几段就锯几次', '锯的次数比段数多 1'], 2);
    made.push(Q(10, '第 10 题 · 锯成 4 段',
      '一根木头要锯成 4 段。要锯几次？',
      [
        C(0, '锯成 4 段，中间有几道锯口？', cutPlaced.opts, cutPlaced.a,
          '段和段之间才有一道锯口。4 段中间有 3 道。',
          '锯成 4 段，要锯 3 次。',
          '3 处'),
        N(1, '锯几次？', '4 − 1 =', cuts,
          '次数 = 段数 − 1。',
          '4 − 1 = 3 次。',
          '3 次'),
        C(2, '哪一句对？', wayPlaced.opts, wayPlaced.a,
          '和数段数一样：几段就比几少 1 刀。',
          '答：要锯 3 次。',
          '3 次')
      ],
      { id: '10', kind: 'num', section: '锯木头', answer: cuts }));
  })();

  (function sawTime() {
    var cuts = 3;
    var minutes = 3 + 3 + 3;
    assert(minutes === 9, '锯木头用时');
    var okPlaced = place('不对', ['对', '差不多'], 0);
    var cutPlaced = place('3 次', ['4 次', '5 次'], 1);
    made.push(Q(11, '第 11 题 · 锯一次 3 分钟',
      '锯一次要用 3 分钟。把一根木头锯成 4 段。小美说要锯 4 次，3 + 3 + 3 + 3 = 12 分钟。',
      [
        C(0, '小美这样做，对吗？', okPlaced.opts, okPlaced.a,
          '锯成 4 段只要 3 刀，不是 4 刀。',
          '4 段中间只有 3 道锯口。多加了一次 3 分钟。',
          '不对'),
        C(1, '实际上要锯几次？', cutPlaced.opts, cutPlaced.a,
          '段数 − 1 = 3。',
          '锯成 4 段，锯 3 次。',
          '3 次'),
        N(2, '一共要几分钟？', '3 + 3 + 3 =', minutes,
          '3 分钟连加 3 次。',
          '3 + 3 + 3 = 9 分钟。不是 12 分钟。',
          '9 分钟')
      ],
      { id: '11', kind: 'judge', section: '锯木头', answer: minutes, segs: cuts }));
  })();

  (function unitDm() {
    var cm = 10 + 10 + 10;
    assert(cm === 30, '3 分米');
    var onePlaced = place('10 厘米', ['100 厘米', '1 厘米'], 0);
    var allPlaced = place('30 厘米', ['3 厘米', '300 厘米'], 1);
    made.push(Q(12, '第 12 题 · 3 分米换成厘米',
      '一根木条长 3 分米。换成厘米是多少？',
      [
        C(0, '1 分米等于多少厘米？', onePlaced.opts, onePlaced.a,
          '直尺上 1 分米里有 10 个 1 厘米。',
          '1 分米 = 10 厘米。',
          '10 厘米'),
        N(1, '3 分米一共多少厘米？', '10 + 10 + 10 =', cm,
          '3 个 10 厘米连加。',
          '10 + 10 + 10 = 30 厘米。',
          '30 厘米'),
        C(2, '3 分米等于多少厘米？', allPlaced.opts, allPlaced.a,
          '不要只写下 3，也不要把分米当成米。',
          '答：3 分米 = 30 厘米。',
          '30 厘米')
      ],
      { id: '12', kind: 'num', section: '单位换算', answer: cm }));
  })();

  (function unitMm() {
    var tenPlaced = place('1 厘米', ['10 厘米', '80 厘米'], 2);
    var howPlaced = place('8 个', ['10 个', '80 个'], 0);
    var ansPlaced = place('8 厘米', ['80 厘米', '18 厘米'], 1);
    made.push(Q(13, '第 13 题 · 80 毫米换成厘米',
      '降水量是 80 毫米。合多少厘米？',
      [
        C(0, '10 毫米是多少厘米？', tenPlaced.opts, tenPlaced.a,
          '1 厘米里正好有 10 个 1 毫米。',
          '10 毫米 = 1 厘米。',
          '1 厘米'),
        C(1, '80 毫米里有几个「10 毫米」？', howPlaced.opts, howPlaced.a,
          '十个十个地数：10、20、30、40、50、60、70、80，数到第 8 个十。',
          '8 个十毫米是 80 毫米，也就是 8 厘米。',
          '8 个'),
        C(2, '80 毫米等于多少厘米？', ansPlaced.opts, ansPlaced.a,
          '问的是厘米，不要把 80 毫米直接写成 80 厘米。',
          '答：80 毫米 = 8 厘米。',
          '8 厘米')
      ],
      { id: '13', kind: 'choice', section: '单位换算', answer: 8 }));
  })();

  (function unitKm() {
    var meters = 1000 + 1000;
    assert(meters === 2000, '2 千米');
    var onePlaced = place('1000 米', ['100 米', '2000 米'], 1);
    var twoPlaced = place('2000 米', ['2 米', '200 米'], 2);
    made.push(Q(14, '第 14 题 · 2 千米换成米',
      '学校到公园有 2 千米。合多少米？',
      [
        C(0, '1 千米等于多少米？', onePlaced.opts, onePlaced.a,
          '10 个一百米拼成 1000 米，就是 1 千米。',
          '10 个一百米 = 1000 米 = 1 千米。',
          '1000 米'),
        N(1, '2 个一千米是多少米？', '1000 + 1000 =', meters,
          '2 千米就是两个 1000 米，连加一次。',
          '1000 + 1000 = 2000 米。',
          '2000 米'),
        C(2, '2 千米是多少米？', twoPlaced.opts, twoPlaced.a,
          '千米换成米，不是只把 2 抄下来。',
          '答：2 千米 = 2000 米。',
          '2000 米')
      ],
      { id: '14', kind: 'num', section: '单位换算', answer: meters }));
  })();

  (function leftSimple() {
    var left = 18 - 5;
    assert(left === 13, '剩余');
    var askPlaced = place('还剩多少厘米', ['一共多少厘米', '用去多少厘米'], 0);
    var ansPlaced = place('13 厘米', ['23 厘米', '5 厘米'], 2);
    made.push(Q(15, '第 15 题 · 用去以后还剩',
      '一根彩绳长 18 厘米，做小圈用去 5 厘米。还剩多少厘米？',
      [
        C(0, '这道题求什么？', askPlaced.opts, askPlaced.a,
          '用去了，问的是剩下的那一截。',
          '求剩余：从总长里去掉用去的。',
          '求剩余'),
        N(1, '还剩多少厘米？', '18 − 5 =', left,
          '18 厘米去掉 5 厘米。',
          '18 − 5 = 13 厘米。',
          '13 厘米'),
        C(2, '哪一句对？', ansPlaced.opts, ansPlaced.a,
          '不要把用去的和剩下的加在一起。',
          '答：还剩 13 厘米。',
          '13 厘米')
      ],
      { id: '15', kind: 'num', section: '剩余', answer: left }));
  })();

  (function leftRemain() {
    var used = 5 + 5 + 5 + 5;
    var left = 23 - used;
    var pieces = 4;
    assert(used === 20 && left === 3 && pieces === 4, '有剩余');
    var piecePlaced = place('4 段', ['5 段', '3 段'], 1);
    var wayPlaced = place('剪了 4 段，剩下 3 厘米', ['23 厘米都能剪完', '剩下的 3 厘米也算一整段'], 2);
    made.push(Q(16, '第 16 题 · 每 5 厘米剪一段',
      '一根 23 厘米的绳子，每 5 厘米剪成一段。最多能剪几段？还剩多少厘米？',
      [
        C(0, '连加 5，不超过 23，能剪几段？', piecePlaced.opts, piecePlaced.a,
          '5 + 5 + 5 + 5 = 20，再加一个 5 是 25，超过 23 了。',
          '可以剪 4 段，用去 20 厘米。',
          '4 段'),
        N(1, '还剩多少厘米？', '23 − 20 =', left,
          '剪掉 20 厘米以后，用总长去减。',
          '23 − 20 = 3 厘米。',
          '剩 3 厘米'),
        C(2, '哪一句对？', wayPlaced.opts, wayPlaced.a,
          '剩下的不够再剪一段，不能算成一整段，也没有剪完。',
          '答：剪了 4 段，还剩 3 厘米。',
          '4 段，剩 3 厘米')
      ],
      { id: '16', kind: 'num', section: '剩余', answer: left, segs: pieces }));
  })();

  (function tripTwo() {
    var one = 50 + 50;
    var two = 100 + 100;
    assert(one === 100 && two === 200, '两个来回');
    var okPlaced = place('不对', ['对', '差不多'], 0);
    var onePlaced = place('100 米', ['1000 米', '50 米'], 1);
    made.push(Q(17, '第 17 题 · 游了 2 个来回',
      '游泳池的泳道长 50 米。小美游了 2 个来回。她写道：50 + 50 = 1000（米），答一共游了 1000 米。',
      [
        C(0, '小美这样做，对吗？', okPlaced.opts, okPlaced.a,
          '50 + 50 是 100，不是 1000。而且这只算了 1 个来回。',
          '去 50 米、回 50 米，连加是 100 米。2 个来回要再加一个 100 米。',
          '不对'),
        C(1, '1 个来回是多少米？', onePlaced.opts, onePlaced.a,
          '1 个来回 = 去 + 回，两个 50 米。',
          '50 + 50 = 100 米。别多写一个 0。',
          '100 米'),
        N(2, '2 个来回一共多少米？', '100 + 100 =', two,
          '两个来回，就是两个 100 米。',
          '100 + 100 = 200 米。',
          '200 米')
      ],
      { id: '17', kind: 'judge', section: '路程', answer: two }));
  })();

  (function tripDay() {
    var legs = 4;
    var meters = 500 + 500 + 500 + 500;
    assert(legs === 4 && meters === 2000, '往返两次');
    var legPlaced = place('4 个', ['2 个', '1 个'], 2);
    var kmPlaced = place('2 千米', ['1 千米', '4 千米'], 0);
    made.push(Q(18, '第 18 题 · 每天往返两次',
      '小美家到学校 500 米。每天从家到学校往返两次。她每天行多少千米？',
      [
        C(0, '往返两次是几个单程？', legPlaced.opts, legPlaced.a,
          '往返一次是去和回。两次就是去、回、去、回。',
          '往返两次 = 4 个单程。只算去和回一次，会少一半。',
          '4 个单程'),
        N(1, '4 个 500 米一共多少米？', '500 + 500 + 500 + 500 =', meters,
          '4 个单程，把 500 米连加 4 次。',
          '500 + 500 + 500 + 500 = 2000 米。',
          '2000 米'),
        C(2, '2000 米是几千米？', kmPlaced.opts, kmPlaced.a,
          '1000 米 = 1 千米。2000 米 = 1000 + 1000，是 2 个一千米。',
          '答：每天行 2 千米。只算一个来回会错成 1 千米。',
          '2 千米')
      ],
      { id: '18', kind: 'num', section: '路程', answer: meters }));
  })();

  (function tripKm() {
    var one = 50 + 50;
    assert(one === 100, '一个来回 100 米');
    var okPlaced = place('不对', ['对', '差不多'], 1);
    var onePlaced = place('100 米', ['1000 米', '50 米'], 2);
    var nPlaced = place('10 个', ['1 个', '2 个'], 0);
    made.push(Q(19, '第 19 题 · 游 1 千米要几个来回',
      '泳道长 50 米。小美想游 1 千米。她说：50 + 50 = 1000 米，所以游 1 个来回就够了。',
      [
        C(0, '小美这样做，对吗？', okPlaced.opts, okPlaced.a,
          '50 + 50 = 100 米，不是 1000 米。1 个来回只有 100 米。',
          '多写了一个 0，就把 1 个来回当成了 1 千米。',
          '不对'),
        C(1, '1 个来回实际是多少米？', onePlaced.opts, onePlaced.a,
          '去 50 米，回 50 米。',
          '50 + 50 = 100 米。',
          '100 米'),
        C(2, '1 千米要几个来回？', nPlaced.opts, nPlaced.a,
          '1 个来回是 100 米。跑道上 10 个一百米才是 1000 米。一个来回占一小格，数满 10 格。',
          '10 个一百米 = 1000 米 = 1 千米，所以要 10 个来回。在图上数，不用除法。',
          '10 个来回')
      ],
      { id: '19', kind: 'choice', section: '路程', answer: 10 }));
  })();

  function verifyQuestion(q) {
    var p = q.proof;
    assert(q.steps.length === 3, p.id + ' 应有 3 步');
    assert(q.steps[0].stage === 0 && q.steps[1].stage === 1 && q.steps[2].stage === 2, p.id + ' 三步顺序');
    walkStrings(q, '题' + q.id, new Set());
    q.steps.forEach(function (st, i) {
      if (st.type === 'choice') {
        assert(st.opts.length === 3, p.id + ' 不是三选一');
        assert(st.a >= 0 && st.a < 3 && st.opts[st.a], p.id + ' 选项下标');
        var seen = {};
        st.opts.forEach(function (op) {
          assert(!seen[op], p.id + ' 选项重复 ' + op);
          seen[op] = 1;
        });
      } else if (st.type === 'num') {
        assert(typeof st.a === 'number' && Number.isInteger(st.a) && st.a >= 0, p.id + ' 填空不是非负整数');
      } else {
        assert(false, p.id + ' 未知题型');
      }
      assert(st.hint && st.exp && st.line, p.id + ' 第 ' + (i + 1) + ' 步讲解不齐');
    });
    if (p.kind === 'num' || p.kind === 'judge') {
      var nums = q.steps.filter(function (st) { return st.type === 'num'; });
      if (typeof p.answer === 'number' && nums.length) {
        assert(nums[nums.length - 1].a === p.answer, p.id + ' 填空答案不对');
      }
    }
    if (p.id === '1') assert(q.steps[1].a === 3 && q.steps[0].opts[q.steps[0].a] === '8 段', '第1题');
    if (p.id === '2') assert(q.steps[0].opts[q.steps[0].a] === '不对' && q.steps[2].opts[q.steps[2].a] === '3 厘米', '第2题');
    if (p.id === '3') assert(q.steps[1].a === 16, '第3题');
    if (p.id === '4') assert(q.steps[0].opts[q.steps[0].a] === '不对' && q.steps[1].a === 20 && q.steps[2].opts[q.steps[2].a] === '米', '第4题');
    if (p.id === '5') assert(q.steps[1].opts[q.steps[1].a] === '毫米', '第5题');
    if (p.id === '6') assert(q.steps[0].opts[q.steps[0].a] === '分米' && q.steps[2].a === 160, '第6题');
    if (p.id === '7') assert(q.steps[0].opts[q.steps[0].a] === '3 段' && q.steps[1].a === 1800, '第7题');
    if (p.id === '8') assert(q.steps[0].opts[q.steps[0].a] === '4 段' && q.steps[1].a === 32, '第8题');
    if (p.id === '9') assert(q.steps[0].opts[q.steps[0].a] === '不对' && q.steps[2].a === 20, '第9题');
    if (p.id === '10') assert(q.steps[1].a === 3, '第10题');
    if (p.id === '11') assert(q.steps[0].opts[q.steps[0].a] === '不对' && q.steps[2].a === 9, '第11题');
    if (p.id === '12') assert(q.steps[1].a === 30, '第12题');
    if (p.id === '13') assert(q.steps[2].opts[q.steps[2].a] === '8 厘米', '第13题');
    if (p.id === '14') assert(q.steps[1].a === 2000 && q.steps[2].opts[q.steps[2].a] === '2000 米', '第14题');
    if (p.id === '15') assert(q.steps[1].a === 13, '第15题');
    if (p.id === '16') assert(q.steps[0].opts[q.steps[0].a] === '4 段' && q.steps[1].a === 3, '第16题');
    if (p.id === '17') assert(q.steps[0].opts[q.steps[0].a] === '不对' && q.steps[2].a === 200, '第17题');
    if (p.id === '18') assert(q.steps[0].opts[q.steps[0].a] === '4 个' && q.steps[1].a === 2000 && q.steps[2].opts[q.steps[2].a] === '2 千米', '第18题');
    if (p.id === '19') assert(q.steps[0].opts[q.steps[0].a] === '不对' && q.steps[2].opts[q.steps[2].a] === '10 个', '第19题');
  }

  var expectCount = { '对折': 3, '估测': 3, '间隔': 3, '锯木头': 2, '单位换算': 3, '剩余': 2, '路程': 3 };
  assert(made.length === 19, '题量应是 19');
  made.forEach(verifyQuestion);

  [8, 12, 16, 20, 24, 28, 32, 36, 40].forEach(function (len) {
    [0, 1, 2, 3].forEach(function (folds) {
      var segs = segAfter(folds);
      if (len % segs !== 0) return;
      var each = len / segs;
      var text = foldFormula(len, segs, each);
      checkMulDivInString(text, 'foldFormula ' + len + '/' + folds);
    });
  });
  [1, 2, 3, 4, 5].forEach(function (n) {
    checkMulDivInString(sumFormula(600, n), 'sum600');
    checkMulDivInString(sumFormula(100, n), 'sum100');
    checkMulDivInString(sumFormula(50, n), 'sum50');
    checkMulDivInString(sumFormula(5, n), 'sum5');
  });
  assert(foldFormula(24, 8, 3) === '24 ÷ 8 = 3 厘米', '原题算式');
  assert(sumFormula(600, 3) === '600 + 600 + 600 = 1800', '车站连加');
  assert(sumFormula(100, 2) === '100 + 100 = 200', '两个来回');

  var levels = [
    {
      icon: '📎',
      name: '第1关 · 对折',
      desc: '点一下折一次，段数 1→2→4→8，再算每段多长',
      sum: '每对折一次，段数加一倍。对折 3 次是 8 段，不是 4 段。',
      section: '对折',
      category: '长度单位与换算',
      qs: made.slice(0, 3)
    },
    {
      icon: '📏',
      name: '第2关 · 估测',
      desc: '门、蝴蝶、妈妈的身高，先想一想有多长再填单位',
      sum: '门大约 2 米，蝴蝶大约 35 毫米，妈妈大约 1 米 6 分米。',
      section: '估测',
      category: '长度单位与换算',
      qs: made.slice(3, 6)
    },
    {
      icon: '🚏',
      name: '第3关 · 间隔',
      desc: '车站和植树都先数段数：段数比站数、棵数少 1',
      sum: '第 1 站到第 4 站是 3 段。两端都种树，段数 = 棵数 − 1。',
      section: '间隔',
      category: '间隔与往返',
      qs: made.slice(6, 9)
    },
    {
      icon: '🪵',
      name: '第4关 · 锯木头',
      desc: '锯成几段，刀数比段数少 1',
      sum: '锯成 4 段要锯 3 次。用时把每刀的分钟连加，不要多加一刀。',
      section: '锯木头',
      category: '间隔与往返',
      qs: made.slice(9, 11)
    },
    {
      icon: '🔟',
      name: '第5关 · 单位换算',
      desc: '10 厘米是 1 分米，10 个一百米是 1 千米',
      sum: '3 分米 = 30 厘米。80 毫米 = 8 厘米。2 千米 = 2000 米。',
      section: '单位换算',
      category: '长度单位与换算',
      qs: made.slice(11, 14)
    },
    {
      icon: '✂️',
      name: '第6关 · 剩余',
      desc: '先去掉用掉的，剩下的不够一段就单独写出来',
      sum: '用去多少就减多少。每 5 厘米剪一段，连加到不超过总长，再算剩余。',
      section: '剩余',
      category: '有余数除法',
      qs: made.slice(14, 16)
    },
    {
      icon: '🏊',
      name: '第7关 · 路程',
      desc: '一个来回两个箭头。1 千米看跑道上有几个一百米',
      sum: '50 + 50 = 100 米，是 1 个来回。10 个一百米 = 1 千米，要 10 个来回。',
      section: '路程',
      category: '间隔与往返',
      qs: made.slice(16, 19)
    }
  ];

  var counted = {};
  levels.forEach(function (lv) {
    walkStrings({ name: lv.name, desc: lv.desc, sum: lv.sum }, '关卡' + lv.section, new Set());
    assert(lv.qs.length === expectCount[lv.section], lv.section + ' 题量');
    assert(lv.qs.length >= 2 && lv.qs.length <= 3, lv.section + ' 应是 2～3 题');
    counted[lv.section] = lv.qs.length;
    lv.qs.forEach(function (q) {
      assert(q.proof.section === lv.section, q.id + ' 节名不一致');
    });
  });

  var report = [];
  levels.forEach(function (lv) {
    lv.qs.forEach(function (q) {
      report.push({
        id: q.id,
        brief: q.text.replace(/\s+/g, ' ').slice(0, 42),
        tag: lv.section + ' · ' + q.title.replace(/^第\s*\d+\s*题\s*·\s*/, ''),
        category: lv.category
      });
    });
  });
  assert(report.length === 19, '成绩单题量');
  report.forEach(function (row) {
    assert(row.tag.indexOf(row.tag.split(' · ')[0]) === 0, '节名');
    checkMulDivInString(row.tag + row.brief, 'report');
  });

  global.HEJI_LEVELS = levels;
  global.HEJI_REPORT = report;
  global.HEJI_SAFE = {
    segAfter: segAfter,
    repeatAdd: repeatAdd,
    foldFormula: foldFormula,
    sumFormula: sumFormula,
    isTableDiv: isTableDiv
  };

  if (typeof window === 'undefined') {
    var fs = require('fs');
    var path = require('path');
    var htmlPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(htmlPath)) {
      var html = fs.readFileSync(htmlPath, 'utf8');
      checkMulDivInString(html, 'index.html');
      assert(html.indexOf(String.fromCharCode(31958, 26524)) < 0, 'index.html 出现不该出现的称呼');
      assert(html.indexOf('heji') >= 0, '页面未挂上合集');
    }
    console.log('heji ok ' + made.length);
    made.forEach(function (q) {
      console.log(q.id + ' ' + q.proof.section + ' ' + q.proof.answer);
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
