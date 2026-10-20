/* 重叠问题（钉木条、粘纸条）。内部公式验算；展示只用加减与表内乘除。 */
(function (global) {
  function twoTotal(len, overlap) {
    return len + len - overlap;
  }

  function threeTotal(len, overlap) {
    return len + len + len - overlap - overlap;
  }

  function overlapFromTwo(len, total) {
    return len + len - total;
  }

  function assert(cond, msg) {
    if (!cond) throw new Error('重叠题目验算失败：' + msg);
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

  function add2(a, b, sub) {
    return a + ' + ' + b + (sub ? ' − ' + sub : '') + ' =';
  }

  function explain2(len, overlap, total) {
    return len + ' + ' + len + ' − ' + overlap + ' = ' + total + ' 厘米';
  }

  function explain3(len, overlap, total) {
    return len + ' + ' + len + ' + ' + len + ' − ' + overlap + ' − ' + overlap + ' = ' + total + ' 厘米';
  }

  function forwardTwo(id, spec, slot) {
    var len = spec.lenCm;
    var ov = spec.overlap;
    var total = twoTotal(len, ov);
    assert(Number.isInteger(total) && total > 0, id + ' 总长不是正整数');
    assert(len >= 8 && len <= 40, id + ' 木条长度不合理');
    assert(ov >= 1 && ov < len, id + ' 重叠不合理');

    var unitPlaced = spec.dm
      ? place(len + ' 厘米', ['3 厘米', (len * 10) + ' 厘米'], slot)
      : null;
    var ovPlaced = place(ov + ' 厘米', [(ov + 3) + ' 厘米', Math.max(1, ov - 2) + ' 厘米'], slot + 1);
    var totalWrong = [];
    [len + len, total + ov, total - ov, len + ov, total + 10, len - ov].forEach(function (w) {
      if (w !== total && w > 0 && totalWrong.indexOf(w) < 0) totalWrong.push(w);
    });
    assert(totalWrong.length >= 2, id + ' 总长干扰项不够');
    var totalPlaced = place(total + ' 厘米', [totalWrong[0] + ' 厘米', totalWrong[1] + ' 厘米'], slot + 2);

    var text = spec.text;
    var steps = [];
    if (spec.dm) {
      var dmCm = len;
      steps.push(C(0, '每根木条先换成厘米是多少？（重叠 ' + ov + ' 厘米）', unitPlaced.opts, unitPlaced.a,
        '1 分米 = 10 厘米。' + (dmCm === 30 ? '3 分米 = 10 + 10 + 10 = 30 厘米。' : '2 分米 = 10 + 10 = 20 厘米。'),
        (dmCm === 30 ? '3 分米 = 30 厘米' : '2 分米 = 20 厘米') + '，每根一样长。重叠 ' + ov + ' 厘米。',
        '每根 ' + dmCm + ' 厘米'));
    } else {
      steps.push(C(0, '重叠部分长多少厘米？', ovPlaced.opts, ovPlaced.a,
        '钉在一起或粘在一起，中间叠住的那一段就是重叠。',
        '重叠 ' + ov + ' 厘米，图上用黄色标出。',
        '重叠 ' + ov + ' 厘米'));
    }
    steps.push(N(1, '钉好以后，总长多少厘米？', add2(len, len, ov), total,
      '两根加起来，重叠只减一次：' + len + '+' + len + '，再减重叠 ' + ov + '。',
      explain2(len, ov, total) + '。',
      '总长 ' + total + ' 厘米'));
    steps.push(C(2, '哪一句对？', totalPlaced.opts, totalPlaced.a,
      '不能从一根上减掉重叠就当答案；要把两根排开的长度相加，再减重叠。',
      '答：总长 ' + total + ' 厘米。验算：' + explain2(len, ov, total) + '。',
      '答：' + total + ' 厘米'));

    return Q(id, '第 ' + id + ' 题 · ' + spec.title, text, steps, {
      id: String(id),
      kind: 'two',
      len: len,
      overlap: ov,
      total: total,
      answer: total
    });
  }

  function forwardThree(id, spec, slot) {
    var len = spec.lenCm;
    var ov = spec.overlap;
    var total = threeTotal(len, ov);
    assert(Number.isInteger(total) && total > 0, id + ' 总长不是正整数');
    var joints = 2;
    var jointsPlaced = place(joints + ' 处', ['3 处', '1 处'], slot);
    var totalPlaced = place(total + ' 厘米', [
      (len + len + len) + ' 厘米',
      (total + ov) + ' 厘米'
    ], slot + 1);
    var text = spec.text;
    var steps = [
      C(0, '3 根接成一长条，有几处重叠？', jointsPlaced.opts, jointsPlaced.a,
        '每两根之间一处，3 根有 2 处重叠。',
        '3 根木条有 2 处重叠，每处 ' + ov + ' 厘米。',
        '重叠 2 处'),
      N(1, '总长多少厘米？', len + ' + ' + len + ' + ' + len + ' − ' + ov + ' − ' + ov + ' =', total,
        '三根排开的长度相加，两处重叠各减一次。',
        explain3(len, ov, total) + '。',
        '总长 ' + total + ' 厘米'),
      C(2, '哪一句对？', totalPlaced.opts, totalPlaced.a,
        '若只减一处重叠，就会算长。',
        '答：' + total + ' 厘米。验算：' + explain3(len, ov, total) + '。',
        '答：' + total + ' 厘米')
    ];
    return Q(id, '第 ' + id + ' 题 · ' + spec.title, text, steps, {
      id: String(id),
      kind: 'three',
      len: len,
      overlap: ov,
      total: total,
      answer: total
    });
  }

  function inverseOverlap(id, spec, slot) {
    var len = spec.lenCm;
    var total = spec.total;
    var ov = overlapFromTwo(len, total);
    assert(Number.isInteger(ov) && ov > 0, id + ' 重叠不是正整数');
    assert(twoTotal(len, ov) === total, id + ' 代回总长不对');

    var ovPlaced = place(ov + ' 厘米', [(ov + 4) + ' 厘米', (ov - 3) + ' 厘米'], slot);
    var open = len + len;
    var openPlaced = place(open + ' 厘米', [(len + 10) + ' 厘米', total + ' 厘米'], slot);
    var text = spec.text;
    var steps = [
      C(0, '两根排开（不重叠）一共多长？', openPlaced.opts, openPlaced.a,
        '两根一样长，连加即可。',
        len + ' + ' + len + ' = ' + open + ' 厘米。',
        '排开 ' + open + ' 厘米'),
      N(1, '重叠部分长多少厘米？', open + ' − ' + total + ' =', ov,
        '排开的长度减钉好后的总长，就是重叠。',
        open + ' − ' + total + ' = ' + ov + ' 厘米。',
        '重叠 ' + ov + ' 厘米'),
      C(2, '哪一句对？', ovPlaced.opts, ovPlaced.a,
        '重叠 = 两根排开 − 钉好后的总长。',
        '答：重叠 ' + ov + ' 厘米。验算：' + explain2(len, ov, total) + '。',
        '答：' + ov + ' 厘米')
    ];
    return Q(id, '第 ' + id + ' 题 · ' + spec.title, text, steps, {
      id: String(id),
      kind: 'inverse',
      len: len,
      overlap: ov,
      total: total,
      answer: ov
    });
  }

  function judgeWrong(id, spec, slot) {
    var okPlaced = place('不对', ['对', '差不多'], slot);
    var totalPlaced = place(spec.right + ' 厘米', [spec.wrong + ' 厘米', (spec.right + 10) + ' 厘米'], slot + 1);
    var algPlaced = place('两根相加，再减重叠一次', ['只从一根上减重叠', '把重叠加在两根上'], slot);
    var text = spec.text;
    var steps = [
      C(0, '小美这样做，对吗？', okPlaced.opts, okPlaced.a,
        spec.hint0,
        spec.exp0,
        '不对'),
      C(1, spec.askMid, totalPlaced.opts, totalPlaced.a,
        spec.hint1,
        spec.exp1,
        spec.right + ' 厘米'),
      C(2, '哪一句是正确算法？', algPlaced.opts, algPlaced.a,
        '重叠只量一次，减一次就够。',
        '答：总长 ' + spec.right + ' 厘米。' + spec.exp1,
        '两根相加，再减重叠一次')
    ];
    return Q(id, '第 ' + id + ' 题 · ' + spec.title, text, steps, {
      id: String(id),
      kind: 'judge',
      answer: spec.right
    });
  }

  var made = [
    forwardTwo(1, {
      title: '钉两根木条',
      text: '把两根长都是 3 分米的木条钉在一起，重叠部分长 5 厘米。钉好后的木条总长多少厘米？',
      lenCm: 30,
      overlap: 5,
      dm: true
    }, 0),
    forwardTwo(2, {
      title: '粘纸条',
      text: '小美把两根同样长的纸条粘在一起，每根长 18 厘米，重叠 6 厘米。粘好以后总长多少厘米？',
      lenCm: 18,
      overlap: 6
    }, 1),
    forwardTwo(3, {
      title: '两根木条',
      text: '两根长 25 厘米的木条钉在一起，重叠 8 厘米。钉好后总长多少厘米？',
      lenCm: 25,
      overlap: 8
    }, 2),
    forwardThree(4, {
      title: '三根接一长条',
      text: '把 3 根同样长的木条接成一长条，每根 10 厘米，每两处之间重叠 2 厘米。总长多少厘米？',
      lenCm: 10,
      overlap: 2
    }, 0),
    forwardThree(5, {
      title: '三根纸条',
      text: '3 根长 8 厘米的纸条粘成一串，每处重叠 1 厘米。总长多少厘米？',
      lenCm: 8,
      overlap: 1
    }, 1),
    inverseOverlap(6, {
      title: '已知总长',
      text: '两根同样长的木条钉在一起，每根 30 厘米，钉好后总长 45 厘米。重叠部分长多少厘米？',
      lenCm: 30,
      total: 45
    }, 2),
    forwardTwo(7, {
      title: '分米换厘米',
      text: '两根长都是 2 分米的木条钉在一起，重叠 4 厘米。钉好后总长多少厘米？',
      lenCm: 20,
      overlap: 4,
      dm: true
    }, 0),
    judgeWrong(8, {
      title: '小美的错算',
      text: '两根长都是 3 分米的木条钉在一起，重叠 5 厘米。小美算：3 分米=30 厘米，30−5=25，答总长 25 厘米。',
      wrong: 25,
      right: 55,
      hint0: '她只从一根木条上减了重叠，没有先把两根长度加起来。',
      exp0: '重叠不是「从一根上挖掉」；要把两根排开的长度相加，再减重叠一次。',
      askMid: '正确总长是多少厘米？',
      hint1: '每根 30 厘米，两根相加再减重叠 5 厘米。',
      exp1: '30 + 30 − 5 = 55 厘米。'
    }, 1),
    judgeWrong(9, {
      title: '只减一次重叠',
      text: '两根长 20 厘米的纸条粘在一起，重叠 4 厘米。小美说：「20+20=40，重叠要减两次，40−4−4=32 厘米。」',
      wrong: 32,
      right: 36,
      hint0: '两处重叠是同一段，只减一次 4 厘米。',
      exp0: '粘在一处时，中间叠住的那 4 厘米在总长里只少算一次。',
      askMid: '粘好以后总长多少厘米？',
      hint1: '40 − 4 = 36 厘米。',
      exp1: '20 + 20 − 4 = 36 厘米。'
    }, 2)
  ];

  function isTableMul(a, b) {
    return a >= 1 && a <= 9 && b >= 1 && b <= 9;
  }

  function isTableDiv(dividend, divisor) {
    if (divisor < 1 || divisor > 9) return false;
    if (dividend % divisor !== 0) return false;
    var q = dividend / divisor;
    return q >= 1 && q <= 9;
  }

  function checkMulDivInString(s, ctx) {
    if (!s || typeof s !== 'string') return;
    var mulRe = /(\d+)\s*[×x＊*]\s*(\d+)/g;
    var divRe = /(\d+)\s*÷\s*(\d+)/g;
    var m;
    while ((m = mulRe.exec(s)) !== null) {
      assert(isTableMul(parseInt(m[1], 10), parseInt(m[2], 10)), '展示算式违规（表外乘法）' + ctx + '：' + m[0]);
    }
    while ((m = divRe.exec(s)) !== null) {
      var d = parseInt(m[1], 10);
      var v = parseInt(m[2], 10);
      assert(isTableDiv(d, v), '展示算式违规（表外除法）' + ctx + '：' + m[0]);
    }
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

  function verifyQuestion(q) {
    var p = q.proof;
    assert(q.steps.length === 3, p.id + ' 应有 3 步');
    walkStrings(q, '题' + q.id, new Set());
    q.steps.forEach(function (st, i) {
      if (st.type === 'choice') {
        assert(st.opts[st.a], p.id + ' 第 ' + (i + 1) + ' 步选项不对');
        assert(st.opts.length === 3, p.id + ' 第 ' + (i + 1) + ' 步不是三选一');
      } else if (st.type === 'num') {
        assert(typeof st.a === 'number' && Number.isInteger(st.a), p.id + ' 填空不是整数');
      }
    });
    if (p.kind === 'two') {
      var numStep = q.steps.find(function (s) { return s.type === 'num'; });
      assert(numStep && numStep.a === p.total, p.id + ' 填空答案不对');
    } else if (p.kind === 'three') {
      assert(q.steps[1].a === p.total, p.id + ' 填空答案不对');
    } else if (p.kind === 'inverse') {
      assert(q.steps[1].a === p.overlap, p.id + ' 重叠答案不对');
    } else if (p.kind === 'judge') {
      assert(q.steps[1].opts[q.steps[1].a] === p.answer + ' 厘米', p.id + ' 判断题答案不对');
    }
  }

  assert(made.length >= 8 && made.length <= 10, '题量要在 8～10 道');
  made.forEach(verifyQuestion);

  var levels = [
    {
      icon: '📏',
      name: '第1关 · 两根叠在一起',
      desc: '先统一单位，再把两根长度相加，重叠只减一次',
      sum: '总长 = 第一根 + 第二根 − 重叠（重叠只减一次）。',
      qs: made.slice(0, 4)
    },
    {
      icon: '🔗',
      name: '第2关 · 三根与辨错',
      desc: '数清几处重叠，或从排开长度里找重叠',
      sum: '三根：三根连加，再减去每一处重叠；辨错时想清重叠有没有多减。',
      qs: made.slice(4)
    }
  ];

  levels.forEach(function (lv) {
    walkStrings({ name: lv.name, desc: lv.desc, sum: lv.sum }, '关卡', new Set());
  });

  var report = made.map(function (q) {
    var brief = q.text.replace(/\s+/g, ' ').slice(0, 40);
    return { id: q.id, brief: brief, tag: '长度/重叠', category: '长度单位与换算' };
  });

  global.CHONGDIE_LEVELS = levels;
  global.CHONGDIE_REPORT = report;
  global.CHONGDIE_PROOFS = made.map(function (q) { return q.proof; });
})(typeof window !== 'undefined' ? window : globalThis);
