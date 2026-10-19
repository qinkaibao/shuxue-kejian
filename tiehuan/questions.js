/* 铁环变式题。答案一律由链长公式现算，加载时再逐题验算。 */
(function (global) {
  function chainTotal(len, count, thick) {
    return len * count - 2 * thick * (count - 1);
  }

  /* 第二套写法，用来核对第一套没有写错。 */
  function chainTotalCheck(len, count, thick) {
    var joints = count - 1;
    var overlap = (thick + thick) * joints;
    return len * count - overlap;
  }

  function eachLen(total, count, thick) {
    return (total + 2 * thick * (count - 1)) / count;
  }

  function assert(cond, msg) {
    if (!cond) throw new Error('铁环题目验算失败：' + msg);
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

  function uniqNums(list, ban) {
    var out = [];
    list.forEach(function (n) {
      if (n === ban || !(n > 0) || !Number.isInteger(n)) return;
      if (out.indexOf(n) < 0) out.push(n);
    });
    return out;
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
    var seen = {};
    opts.forEach(function (o) {
      assert(!seen[o], '选项重复：' + o);
      seen[o] = 1;
    });
    return { opts: opts, a: at };
  }

  function forward(id, spec, slot) {
    var count = spec.count;
    var len = spec.len;
    var thick = spec.thick;
    var joints = count - 1;
    var eachOverlap = thick + thick;
    var overlap = eachOverlap * joints;
    var open = len * count;
    var total = chainTotal(len, count, thick);
    assert(total === chainTotalCheck(len, count, thick), id + ' 两套总长公式不一致');
    assert(total === open - overlap, id + ' 总长不等于排开减去重叠');
    assert(Number.isInteger(total) && total > 0, id + ' 总长不是正整数');
    assert(count >= 2 && count <= 5, id + ' 个数超出 2～5');
    assert(thick >= 1 && thick <= 3 && Number.isInteger(thick), id + ' 厚度不合理');
    assert(len >= 2 * thick + 2 && len <= 20 && Number.isInteger(len), id + ' 环长不合理');

    var jointsPlaced = place(joints + ' 处', [count + ' 处', Math.max(0, joints - 1) + ' 处'], slot);
    var totalWrong = uniqNums([open, open - eachOverlap, total + eachOverlap, total - eachOverlap, open - overlap - len], total);
    assert(totalWrong.length >= 2, id + ' 总长干扰项不够');
    var totalPlaced = place(total + ' 厘米', [totalWrong[0] + ' 厘米', totalWrong[1] + ' 厘米'], slot + 1);
    var text = '小美把 ' + count + ' 个一样的铁环扣成一串。每个长 ' + len + ' 厘米，铁环厚 ' + thick + ' 厘米。扣好以后，总长多少厘米？';
    var steps = [
      C(0, count + ' 个环扣成一串，有几处扣口？', jointsPlaced.opts, jointsPlaced.a,
        '扣口比环的个数少 1。',
        count + ' 个环有 ' + joints + ' 处扣口。',
        '扣口 ' + joints + ' 处'),
      N(1, '总长是多少厘米？', len + ' × ' + count + ' − ' + overlap + ' =', total,
        '先算 ' + len + '×' + count + ' = ' + open + '，再减去重叠的 ' + overlap + ' 厘米。',
        open + ' − ' + overlap + ' = ' + total + '。总长 = ' + len + '×' + count + ' − 2×' + thick + '×' + joints + ' = ' + total + ' 厘米。',
        '总长 ' + total + ' 厘米'),
      C(2, '哪一句对？', totalPlaced.opts, totalPlaced.a,
        '排开是 ' + open + ' 厘米，扣上以后更短。',
        '答：总长 ' + total + ' 厘米。验算：' + len + '×' + count + ' − ' + overlap + ' = ' + total + '。',
        '答：' + total + ' 厘米')
    ];
    return Q(id, '第 ' + id + ' 题 · ' + spec.title, text, steps, {
      id: String(id),
      kind: 'total',
      title: spec.title,
      text: text,
      count: count,
      len: len,
      thick: thick,
      joints: joints,
      overlap: overlap,
      total: total,
      answer: total,
      unit: '厘米',
      check: len + '×' + count + ' − 2×' + thick + '×' + joints + ' = ' + total
    });
  }

  function inverse(id, spec, slot) {
    var count = spec.count;
    var given = spec.total;
    var thick = spec.thick;
    var joints = count - 1;
    var eachOverlap = thick + thick;
    var overlap = eachOverlap * joints;
    var len = eachLen(given, count, thick);
    assert(len === (given + overlap) / count, id + ' 环长算式不一致');
    assert(Number.isInteger(len), id + ' 环长不是整数');
    assert(chainTotal(len, count, thick) === given, id + ' 代回总长不对');
    assert(chainTotalCheck(len, count, thick) === given, id + ' 验算总长不对');
    assert(count >= 2 && count <= 5, id + ' 个数超出 2～5');
    assert(thick >= 1 && thick <= 3, id + ' 厚度不合理');
    assert(len >= 2 * thick + 2 && len <= 20, id + ' 环长不合理');
    assert(given > 0 && given < 80, id + ' 总长不合理');

    var overlapPlaced = place(
      overlap + ' 厘米',
      [(thick * joints) + ' 厘米', (eachOverlap * count) + ' 厘米'],
      slot
    );
    var shortGuess = Math.floor(given / count);
    assert(shortGuess !== len && given !== len, id + ' 干扰项撞上答案');
    var lenPlaced = place(len + ' 厘米', [shortGuess + ' 厘米', given + ' 厘米'], slot + 1);
    var text = '小美量到 ' + count + ' 个一样的铁环扣在一起，总长 ' + given + ' 厘米。铁环厚 ' + thick + ' 厘米。每个铁环长多少厘米？';
    var steps = [
      C(0, '这 ' + count + ' 个环，重叠一共多少厘米？', overlapPlaced.opts, overlapPlaced.a,
        '每处叠两个厚度。扣口数是个数减 1。',
        '扣口 ' + joints + ' 处，每处 ' + thick + '+' + thick + '=' + eachOverlap + ' 厘米，一共 ' + overlap + ' 厘米。',
        '重叠 ' + overlap + ' 厘米'),
      N(1, '每个环长多少厘米？', '(' + given + ' + ' + overlap + ') ÷ ' + count + ' =', len,
        '先把叠住的 ' + overlap + ' 厘米加回来，得到 ' + (given + overlap) + '，再除以 ' + count + '。',
        given + ' + ' + overlap + ' = ' + (given + overlap) + '，' + (given + overlap) + '÷' + count + ' = ' + len + '。每个环长 ' + len + ' 厘米。',
        '每个 ' + len + ' 厘米'),
      C(2, '哪一句对？', lenPlaced.opts, lenPlaced.a,
        '总长比排开时短，不能直接用总长当每个环的长度。',
        '答：每个 ' + len + ' 厘米。验算：' + len + '×' + count + ' − ' + overlap + ' = ' + given + '。',
        '答：' + len + ' 厘米')
    ];
    return Q(id, '第 ' + id + ' 题 · ' + spec.title, text, steps, {
      id: String(id),
      kind: 'each',
      title: spec.title,
      text: text,
      count: count,
      len: len,
      thick: thick,
      given: given,
      joints: joints,
      overlap: overlap,
      total: given,
      answer: len,
      unit: '厘米',
      check: '(' + given + ' + 2×' + thick + '×' + joints + ') ÷ ' + count + ' = ' + len + '；验算 ' + len + '×' + count + ' − ' + overlap + ' = ' + given
    });
  }

  var made = [
    forward(1, { count: 2, len: 8, thick: 1, title: '两个环' }, 1),
    forward(2, { count: 4, len: 10, thick: 1, title: '四个环' }, 2),
    forward(3, { count: 5, len: 12, thick: 1, title: '五个环' }, 0),
    forward(4, { count: 3, len: 15, thick: 2, title: '厚 2 厘米' }, 1),
    inverse(5, { count: 3, total: 20, thick: 1, title: '已知总长' }, 2),
    inverse(6, { count: 4, total: 26, thick: 1, title: '四个环的总长' }, 0)
  ];

  function verifyQuestion(q) {
    var p = q.proof;
    assert(q.steps.length === 3, p.id + ' 应有 3 步');
    if (p.kind === 'total') {
      assert(q.steps[1].a === chainTotal(p.len, p.count, p.thick), p.id + ' 填空答案不是总长');
      assert(q.steps[1].a === chainTotalCheck(p.len, p.count, p.thick), p.id + ' 填空答案没有通过第二套公式');
    } else {
      assert(q.steps[1].a === eachLen(p.given, p.count, p.thick), p.id + ' 填空答案不是每个环长');
      assert(chainTotal(q.steps[1].a, p.count, p.thick) === p.given, p.id + ' 环长代回总长失败');
    }
    q.steps.forEach(function (st, i) {
      if (st.type === 'choice') {
        assert(st.opts[st.a] && st.opts.indexOf(st.opts[st.a]) === st.a, p.id + ' 第 ' + (i + 1) + ' 步选项下标不对');
        assert(st.opts.length === 3, p.id + ' 第 ' + (i + 1) + ' 步不是三选一');
      } else if (st.type === 'num') {
        assert(typeof st.a === 'number' && Number.isInteger(st.a), p.id + ' 填空不是整数');
        assert(st.expr.indexOf(String(p.kind === 'total' ? p.overlap : p.overlap)) >= 0, p.id + ' 算式里没有重叠');
      } else {
        assert(false, p.id + ' 有未验算的题型');
      }
    });
    assert(q.steps[2].opts[q.steps[2].a] === p.answer + ' 厘米', p.id + ' 最后一步不是这题答案');
    assert(q.steps[2].opts[q.steps[2].a].indexOf(String(p.answer)) === 0, p.id + ' 答案文字对不上');
  }

  assert(made.length >= 5 && made.length <= 6, '题量要在 5～6 道');
  made.forEach(verifyQuestion);

  var levels = [
    {
      icon: '🔗',
      name: '第1关 · 已知环长',
      desc: '扣上以后，总长少掉重叠的部分',
      sum: '总长 = 环长 × 个数 − 2 × 厚度 ×（个数 − 1）。',
      qs: made.slice(0, 4)
    },
    {
      icon: '📏',
      name: '第2关 · 已知总长',
      desc: '把叠住的厘米加回来，再平均分',
      sum: '每个环长 =（总长 + 重叠总长）÷ 个数。',
      qs: made.slice(4)
    }
  ];

  var report = made.map(function (q) {
    var p = q.proof;
    var brief = p.kind === 'total'
      ? (p.count + ' 个环每个 ' + p.len + ' 厘米，总长多少')
      : (p.count + ' 个环总长 ' + p.given + ' 厘米，每个多长');
    return { id: q.id, brief: brief, tag: '长度/铁环重叠', category: '长度单位与换算' };
  });

  global.TIEHUAN_LEVELS = levels;
  global.TIEHUAN_REPORT = report;
  global.TIEHUAN_PROOFS = made.map(function (q) { return q.proof; });
})(typeof window !== 'undefined' ? window : globalThis);
