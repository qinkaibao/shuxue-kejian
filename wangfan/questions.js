/* 往返问题。内部用公式验算；展示给孩子的算式只用加减与表内乘除。 */
(function (global) {
  function legs(roundTrips) {
    return 2 * roundTrips;
  }

  function totalM(oneWay, roundTrips) {
    return oneWay * legs(roundTrips);
  }

  function oneWayFromTotal(totalMeters, roundTrips) {
    return totalMeters / legs(roundTrips);
  }

  function roundTripsFromTotal(totalMeters, oneWay) {
    return totalMeters / (2 * oneWay);
  }

  function assert(cond, msg) {
    if (!cond) throw new Error('往返题目验算失败：' + msg);
  }

  function addExpr(term, count) {
    assert(count >= 1 && count <= 5, '连加超过 5 项：' + term + '×' + count);
    var parts = [];
    for (var i = 0; i < count; i++) parts.push(String(term));
    return parts.join(' + ') + ' =';
  }

  function addExplain(term, count) {
    var sum = term * count;
    return addExpr(term, count).replace(' =', '') + ' = ' + sum + ' 米';
  }

  function kmFromM(m) {
    assert(m % 1000 === 0, '千米换算不是整千米：' + m);
    return m / 1000;
  }

  function kmNote(m) {
    var k = kmFromM(m);
    if (k === 1) return m + ' 米就是 1 千米（10 个 100 米拼成 1000 米）。';
    return m + ' 米 = ' + Array(k).fill('1000 米').join(' + ') + '，就是 ' + k + ' 千米。';
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

  function legHint(rt) {
    var lg = legs(rt);
    return '1 个来回画 2 个箭头；数一共 ' + lg + ' 个箭头就是 ' + lg + ' 个单程。';
  }

  function forward(id, spec, slot) {
    var one = spec.one;
    var rt = spec.roundTrips;
    var lg = legs(rt);
    var total = totalM(one, rt);
    assert(Number.isInteger(total) && total > 0, id + ' 总路程不是正整数');
    assert(one >= 20 && one <= 500, id + ' 单程不合理');
    assert(rt >= 1 && rt <= 5, id + ' 来回次数不合理');

    var w1 = Math.max(1, lg - 1);
    var w2 = lg + 1;
    if (w1 === lg) w1 = lg + 2;
    var legPlaced = place(lg + ' 个', [w1 + ' 个', w2 + ' 个'], slot);
    var wrongTotals = [one * rt, total + one, total - one, one + one].filter(function (w) {
      return w !== total && w > 0 && Number.isInteger(w);
    });
    assert(wrongTotals.length >= 2, id + ' 总路程干扰项不够');
    var ansText = spec.unit === '千米' ? kmFromM(total) + ' 千米' : total + ' 米';
    var wrongAns = spec.unit === '千米'
      ? [kmFromM(total - 1000) + ' 千米', kmFromM(total + 1000) + ' 千米'].filter(function (w) {
        return w !== ansText;
      })
      : [wrongTotals[0] + ' 米', wrongTotals[1] + ' 米'];
    assert(wrongAns.length >= 2, id + ' 千米干扰项不够');
    var totalPlaced = place(ansText, wrongAns.slice(0, 2), slot + 1);

    var text = spec.text;
    var numAns = spec.unit === '千米' ? kmFromM(total) : total;
    var steps = [
      C(0, '「' + rt + ' 个来回」在图上会有几个箭头（几个单程）？', legPlaced.opts, legPlaced.a,
        '1 个来回 = 去 + 回 = 2 个箭头。',
        rt + ' 个来回 → 一共 ' + lg + ' 个箭头，也就是 ' + lg + ' 个单程。',
        lg + ' 个单程'),
      N(1, spec.askTotal, addExpr(one, lg), numAns,
        '每个单程 ' + one + ' 米，把 ' + lg + ' 段连加起来。',
        addExplain(one, lg) + (spec.unit === '千米' ? ' ' + kmNote(total) : '') + '。',
        '一共 ' + ansText),
      C(2, '哪一句对？', totalPlaced.opts, totalPlaced.a,
        '先数箭头（单程），再连加每段长度。',
        '答：' + ansText + '。验算：' + addExplain(one, lg) + '。',
        '答：' + ansText)
    ];
    return Q(id, '第 ' + id + ' 题 · ' + spec.title, text, steps, {
      id: String(id),
      kind: 'forward',
      one: one,
      roundTrips: rt,
      total: total,
      unit: spec.unit || '米',
      answer: numAns
    });
  }

  function inverseOne(id, spec, slot) {
    var rt = spec.roundTrips;
    var total = spec.totalM;
    var lg = legs(rt);
    var one = oneWayFromTotal(total, rt);
    assert(Number.isInteger(one), id + ' 单程不是整数');
    assert(totalM(one, rt) === total, id + ' 代回总路程不对');

    var w1 = Math.max(1, lg - 1);
    var w2 = lg + 1;
    if (w1 === lg) w1 = lg + 2;
    var legPlaced = place(lg + ' 个', [w1 + ' 个', w2 + ' 个'], slot);
    var wA = Math.max(50, one - 100);
    var wB = one + 100;
    if (wA === one) wA = one + 200;
    if (wB === one) wB = one + 200;
    var onePlaced = place(one + ' 米', [wA + ' 米', wB + ' 米'], slot + 1);
    var text = spec.text;
    var askLegs = spec.askLegs || '一共走了几个单程（几个箭头）？';
    var hintLegs = spec.hintLegs || legHint(rt);
    var expLegs = spec.expLegs || ('往返 ' + rt + ' 次 → ' + lg + ' 个单程。');
    var askOne = spec.askOne || '每个单程一样长。单程多少米？';
    var hintOne = spec.hintOne || ('总路程 ' + total + ' 米，是 ' + lg + ' 个一样长的单程。想一想：' + lg + ' 个几连加是 ' + total + '？');
    var expOne = typeof spec.expOne === 'function'
      ? spec.expOne(one, lg, total)
      : (spec.expOne || ('试一试：' + addExplain(one, lg) + ' 合起来正好是 ' + total + ' 米，所以单程 ' + one + ' 米。'));
    var hint2 = spec.hint2 || '不能拿总路程直接当单程；先数清几个箭头，再想连加。';
    var steps = [
      C(0, askLegs, legPlaced.opts, legPlaced.a,
        hintLegs,
        expLegs,
        lg + ' 个单程'),
      C(1, askOne, onePlaced.opts, onePlaced.a,
        hintOne,
        expOne,
        '单程 ' + one + ' 米'),
      C(2, '哪一句对？', onePlaced.opts, onePlaced.a,
        hint2,
        '答：单程 ' + one + ' 米。验算：' + addExplain(one, lg) + '。',
        '答：' + one + ' 米')
    ];
    return Q(id, '第 ' + id + ' 题 · ' + spec.title, text, steps, {
      id: String(id),
      kind: 'inverseOne',
      one: one,
      roundTrips: rt,
      total: total,
      answer: one
    });
  }

  function inverseRt(id, spec, slot) {
    var one = spec.one;
    var total = spec.totalM;
    var rt = roundTripsFromTotal(total, one);
    assert(Number.isInteger(rt), id + ' 来回数不是整数');
    assert(totalM(one, rt) === total, id + ' 代回总路程不对');

    var perRt = one * 2;
    var rtPlaced = place(rt + ' 个来回', [(rt + 1) + ' 个来回', Math.max(1, rt - 1) + ' 个来回'], slot);
    var perPlaced = place(perRt + ' 米', [one + ' 米', (one + perRt) + ' 米'], slot + 1);
    var text = spec.text;
    var steps = [
      C(0, '游 1 个来回是多少米？', perPlaced.opts, perPlaced.a,
        '1 个来回 = 去 + 回，画 2 个箭头。',
        one + ' + ' + one + ' = ' + perRt + ' 米。',
        '1 个来回 ' + perRt + ' 米'),
      C(1, spec.askRt || '游满目标路程，一共要几个来回？', rtPlaced.opts, rtPlaced.a,
        spec.rtHint || ('在 1 千米跑道图上，一次点 1 个来回（+' + perRt + ' 米），点到 ' + total + ' 米时数一共几个来回。'),
        (rt <= 5
          ? ('每次加一个来回 ' + perRt + ' 米：' + Array(rt).fill(String(perRt)).join(' + ') + ' = ' + total + ' 米 → ' + rt + ' 个来回。')
          : ('每次加一个来回 ' + perRt + ' 米，在跑道图上点 ' + rt + ' 次，累计 ' + total + ' 米 → ' + rt + ' 个来回。')),
        rt + ' 个来回'),
      C(2, '哪一句对？', rtPlaced.opts, rtPlaced.a,
        '别写成 50+50=1000；100 米才是 1 个来回（50 米泳道）。',
        '答：要游 ' + rt + ' 个来回。验算：' + rt + ' 个来回，每个来回 ' + perRt + ' 米，一共 ' + total + ' 米。',
        '答：' + rt + ' 个来回')
    ];
    return Q(id, '第 ' + id + ' 题 · ' + spec.title, text, steps, {
      id: String(id),
      kind: 'inverseRt',
      one: one,
      roundTrips: rt,
      total: total,
      answer: rt
    });
  }

  function judgeWrong(id, spec, slot) {
    var okPlaced = place('不对', ['对', '差不多'], slot);
    var legPlaced = place(spec.legAns + ' 个', [spec.legWrong1 + ' 个', spec.legWrong2 + ' 个'], slot + 1);
    var text = spec.text;
    var steps = [
      C(0, '小美这样做，对吗？', okPlaced.opts, okPlaced.a,
        spec.hint0,
        spec.exp0,
        '不对'),
      C(1, spec.askLegs, legPlaced.opts, legPlaced.a,
        '1 个来回 = 去 + 回 = 2 个箭头。',
        spec.expLegs,
        spec.legAns + ' 个单程'),
      spec.finalType === 'choice'
        ? C(2, spec.askFinal, spec.finalPlaced.opts, spec.finalPlaced.a, spec.hint2, spec.exp2, spec.line2)
        : N(2, spec.askNum, spec.expr, spec.numAns, spec.hint2, spec.exp2, spec.line2)
    ];
    return Q(id, '第 ' + id + ' 题 · ' + spec.title, text, steps, {
      id: String(id),
      kind: 'judge',
      answer: spec.finalType === 'choice' ? spec.finalPlaced.opts[spec.finalPlaced.a] : spec.numAns
    });
  }

  var made = [
    forward(1, {
      title: '游 1 个来回',
      text: '游泳池泳道长 50 米。小明游了 1 个来回，一共游了多少米？',
      one: 50,
      roundTrips: 1,
      askTotal: '一共游了多少米？'
    }, 0),
    forward(2, {
      title: '游 2 个来回',
      text: '游泳池泳道长 50 米。小明游了 2 个来回，一共游了多少米？',
      one: 50,
      roundTrips: 2,
      askTotal: '一共游了多少米？'
    }, 1),
    forward(3, {
      title: '每天走多少米',
      text: '小美家到学校 200 米。她每天从家到学校往返 1 次，一天一共走多少米？',
      one: 200,
      roundTrips: 1,
      askTotal: '一天一共走多少米？'
    }, 2),
    forward(4, {
      title: '每天走多少千米',
      text: '小美家到学校 500 米。她每天从家到学校往返 2 次，一天一共行多少千米？',
      one: 500,
      roundTrips: 2,
      unit: '千米',
      askTotal: '一天一共行多少千米？（填千米数）'
    }, 0),
    inverseOne(5, {
      title: '求家到学校',
      text: '小美一天总共行了 4 千米，从家到学校往返 2 次。她家到学校有多远？',
      roundTrips: 2,
      totalM: 4000
    }, 2),
    inverseOne(6, {
      title: '已知总米数',
      text: '小美在泳道里游了 2 个来回，一共游了 200 米。泳道单程长多少米？',
      roundTrips: 2,
      totalM: 200,
      askLegs: '游了 2 个来回，图上会有几个箭头（几个单程）？',
      hintLegs: '1 个来回画 2 个箭头；2 个来回就数一数一共几个箭头。',
      expLegs: '2 个来回 → 一共 4 个箭头，也就是 4 个单程。',
      askOne: '4 个几米连加，正好是 200 米？',
      hintOne: '先数清图上有几个箭头（4 个单程）。每个单程一样长，想一想：4 个几相加是 200？可以试 50＋50＋50＋50。',
      expOne: function (one, lg, total) {
        return addExplain(one, lg) + ' 合起来正好是 ' + total + ' 米，所以泳道单程 ' + one + ' 米。';
      },
      hint2: '先数清 4 个箭头，再连加；不要把 200 米当成单程。'
    }, 0),
    inverseRt(7, {
      title: '游 1 千米',
      text: '游泳池泳道长 50 米。小明要游 1 千米，要游多少个来回？',
      one: 50,
      totalM: 1000,
      askRt: '游满 1 千米，要游几个来回？',
      rtHint: '跑道图一次点 1 个来回（+100 米），点到 1000 米时数一共几个来回。'
    }, 1),
    inverseRt(8, {
      title: '游满 1 千米',
      text: '小美在单程 100 米的泳道里，要游满 1 千米。她需要游几个来回？',
      one: 100,
      totalM: 1000,
      askRt: '游满 1 千米，要游几个来回？',
      rtHint: '1 个来回是 200 米。在图上每次 +1 个来回，加到 1000 米时数来回数。'
    }, 2),
    judgeWrong(9, {
      title: '小美的错算',
      text: '游泳池泳道长 50 米。小美说：「游 1 个来回要游 50+50=1000 米。」',
      hint0: '50+50 应该是 100，不是 1000；多写了一个 0。',
      exp0: '50+50=100 米才是 1 个来回，写成 1000 就错了。',
      askLegs: '1 个来回等于几个单程（几个箭头）？',
      legAns: 2,
      legWrong1: 1,
      legWrong2: 4,
      expLegs: '1 个来回是 2 个单程。',
      askNum: '正确的一个来回是多少米？',
      expr: '50 + 50 =',
      numAns: 100,
      hint2: '去 50 米，回 50 米，相加即可。',
      exp2: '50+50=100 米。',
      line2: '100 米',
      finalType: 'num'
    }, 0),
    judgeWrong(10, {
      title: '只算了一次往返',
      text: '小美家到学校 500 米。她说：「500+500=1000 米=1 千米，我每天往返 2 次，所以一天只走 1 千米。」',
      hint0: '她只算了往返 1 次；往返 2 次要去、回、去、回，共 4 个 500 米。',
      exp0: '往返 2 次 = 4 个单程，不是 2 个。',
      askLegs: '往返 2 次是几个单程？',
      legAns: 4,
      legWrong1: 2,
      legWrong2: 3,
      expLegs: '往返 2 次要去、回、再去、再回，一共 4 个单程。',
      finalType: 'choice',
      askFinal: '她每天实际行多少千米？',
      finalPlaced: place('2 千米', ['1 千米', '3 千米'], 1),
      hint2: '4 个 500 米连加，再想有几个 1000 米。',
      exp2: '500+500+500+500=2000 米，就是 2 个 1000 米，所以是 2 千米。',
      line2: '2 千米'
    }, 1)
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
    var i;
    var mulRe = /(\d+)\s*[×x＊*]\s*(\d+)/g;
    var divRe = /(\d+)\s*÷\s*(\d+)/g;
    var m;
    while ((m = mulRe.exec(s)) !== null) {
      var a = parseInt(m[1], 10);
      var b = parseInt(m[2], 10);
      assert(isTableMul(a, b), '展示算式违规（表外乘法）' + ctx + '：' + m[0]);
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

  function verifyDisplayMath(q) {
    walkStrings(q, '题' + q.id, new Set());
  }

  function verifyQuestion(q) {
    var p = q.proof;
    assert(q.steps.length === 3, p.id + ' 应有 3 步');
    verifyDisplayMath(q);
    q.steps.forEach(function (st, i) {
      if (st.type === 'choice') {
        assert(st.opts[st.a], p.id + ' 第 ' + (i + 1) + ' 步选项下标不对');
        assert(st.opts.length === 3, p.id + ' 第 ' + (i + 1) + ' 步不是三选一');
      } else if (st.type === 'num') {
        assert(typeof st.a === 'number' && Number.isInteger(st.a), p.id + ' 填空不是整数');
      }
    });
    if (p.kind === 'forward') {
      assert(q.steps[1].a === p.answer, p.id + ' 填空答案不对');
      assert(totalM(p.one, p.roundTrips) === p.total, p.id + ' 总路程公式不对');
    } else if (p.kind === 'inverseOne') {
      assert(q.steps[1].opts[q.steps[1].a] === p.answer + ' 米', p.id + ' 单程答案不对');
    } else if (p.kind === 'inverseRt') {
      assert(q.steps[1].opts[q.steps[1].a] === p.answer + ' 个来回', p.id + ' 来回数答案不对');
    } else if (p.kind === 'judge') {
      if (q.steps[2].type === 'num') {
        assert(q.steps[2].a === p.answer, p.id + ' 判断题最后填空不对');
      } else {
        assert(q.steps[2].opts[q.steps[2].a] === p.answer, p.id + ' 判断题最后选择不对');
      }
    }
  }

  assert(made.length >= 8 && made.length <= 12, '题量要在 8～12 道');
  made.forEach(verifyQuestion);

  var levels = [
    {
      icon: '🏊',
      name: '第1关 · 求总路程',
      desc: '先数箭头（几个单程），再把每段长度连加起来',
      sum: '总路程 = 把每个单程的长度连加（先数清有几个单程）。',
      qs: made.slice(0, 4)
    },
    {
      icon: '🔁',
      name: '第2关 · 反着求',
      desc: '先数单程或来回，再试一连加、或在跑道图上数出来',
      sum: '求单程：想一共几个一样长的单程；求来回数：在跑道图上每次加一个来回，数到目标路程。',
      qs: made.slice(4)
    }
  ];

  levels.forEach(function (lv) {
    walkStrings({ name: lv.name, desc: lv.desc, sum: lv.sum }, '关卡', new Set());
  });

  var report = made.map(function (q) {
    var brief = q.text.replace(/\s+/g, ' ').slice(0, 36);
    return { id: q.id, brief: brief, tag: '往返/单程来回', category: '间隔与往返' };
  });

  global.WANGFAN_LEVELS = levels;
  global.WANGFAN_REPORT = report;
  global.WANGFAN_PROOFS = made.map(function (q) { return q.proof; });
})(typeof window !== 'undefined' ? window : globalThis);
