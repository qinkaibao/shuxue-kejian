(function(root){'use strict';const questions=[
  {
    "id": "q1",
    "name": "认清三种数量",
    "a": 114,
    "b": 3,
    "kind": "choice",
    "brief": "算114×3的十位。个位已经换来1个十。分别点选乘积、进来的数、中间和。",
    "answers": {
      "product": "3",
      "incoming": "1",
      "sum": "4"
    },
    "choices": {
      "product": [
        "4",
        "3",
        "1"
      ],
      "incoming": [
        "3",
        "1",
        "4"
      ],
      "sum": [
        "3",
        "4",
        "1"
      ]
    },
    "labels": {
      "product": "乘积（几个十）",
      "incoming": "进来的数（几个十）",
      "sum": "中间和（几个十）"
    },
    "hint": "乘积只看十位数字乘3；席边送来的量要另加。",
    "trace": [
      {
        "digit": 4,
        "product": 12,
        "incoming": 0,
        "sum": 12,
        "write": 2,
        "carry": 1
      },
      {
        "digit": 1,
        "product": 3,
        "incoming": 1,
        "sum": 4,
        "write": 4,
        "carry": 0
      },
      {
        "digit": 1,
        "product": 3,
        "incoming": 0,
        "sum": 3,
        "write": 3,
        "carry": 0
      }
    ],
    "result": 342,
    "category": "笔算乘法：本位乘积加进来的数得到中间和",
    "tag": "choice",
    "explain": "个位：4×3＝12个一；进来0个一；中间和12＋0＝12，写2，进1个十。十位：1×3＝3个十；进来1个十；中间和3＋1＝4，写4，进0个百。百位：1×3＝3个百；进来0个百；中间和3＋0＝3，写3，进0个千。114×3＝342。"
  },
  {
    "id": "q2",
    "name": "把席边的小袋并进来",
    "a": 125,
    "b": 4,
    "kind": "merge",
    "brief": "算125×4的十位。上方是原有四份两袋，下方是个位换来的两袋。逐袋并入，再填写中间和。",
    "answers": {
      "merged": "2",
      "sum": "10"
    },
    "fields": {
      "sum": "合并后有几个十"
    },
    "hint": "一袋是一个十。两袋都移好后，从原来的袋数接着数。",
    "trace": [
      {
        "digit": 5,
        "product": 20,
        "incoming": 0,
        "sum": 20,
        "write": 0,
        "carry": 2
      },
      {
        "digit": 2,
        "product": 8,
        "incoming": 2,
        "sum": 10,
        "write": 0,
        "carry": 1
      },
      {
        "digit": 1,
        "product": 4,
        "incoming": 1,
        "sum": 5,
        "write": 5,
        "carry": 0
      }
    ],
    "result": 500,
    "category": "笔算乘法：本位乘积加进来的数得到中间和",
    "tag": "merge",
    "explain": "个位：5×4＝20个一；进来0个一；中间和20＋0＝20，写0，进2个十。十位：2×4＝8个十；进来2个十；中间和8＋2＝10，写0，进1个百。百位：1×4＝4个百；进来1个百；中间和4＋1＝5，写5，进0个千。125×4＝500。"
  },
  {
    "id": "q3",
    "name": "让动作排好队",
    "a": 134,
    "b": 4,
    "kind": "order",
    "brief": "算134×4的十位。依次点选三个动作，排出顺序；随后填写中间和。",
    "answers": {
      "order": "乘,加,写进",
      "sum": "13"
    },
    "cards": [
      [
        "写进",
        "从中间和决定写几、进几"
      ],
      [
        "加",
        "加上个位进来的数"
      ],
      [
        "乘",
        "本位数字乘4"
      ]
    ],
    "fields": {
      "sum": "十位中间和（几个十）"
    },
    "hint": "先得到本位乘积，再合并另一堆，最后决定留下和送出。",
    "trace": [
      {
        "digit": 4,
        "product": 16,
        "incoming": 0,
        "sum": 16,
        "write": 6,
        "carry": 1
      },
      {
        "digit": 3,
        "product": 12,
        "incoming": 1,
        "sum": 13,
        "write": 3,
        "carry": 1
      },
      {
        "digit": 1,
        "product": 4,
        "incoming": 1,
        "sum": 5,
        "write": 5,
        "carry": 0
      }
    ],
    "result": 536,
    "category": "笔算乘法：本位乘积加进来的数得到中间和",
    "tag": "order",
    "explain": "个位：4×4＝16个一；进来0个一；中间和16＋0＝16，写6，进1个十。十位：3×4＝12个十；进来1个十；中间和12＋1＝13，写3，进1个百。百位：1×4＝4个百；进来1个百；中间和4＋1＝5，写5，进0个千。134×4＝536。动作顺序：乘 → 加 → 写进。"
  },
  {
    "id": "q4",
    "name": "用哪个数决定留下多少",
    "a": 147,
    "b": 3,
    "kind": "choice",
    "brief": "算147×3的十位。个位送来2个十。先填中间和，再点选写几、进几。",
    "answers": {
      "sum": "14",
      "write": "4",
      "carry": "1个百"
    },
    "fields": {
      "sum": "十位中间和（几个十）"
    },
    "choices": {
      "write": [
        "2",
        "4",
        "6"
      ],
      "carry": [
        "1个十",
        "1个百",
        "0个百"
      ]
    },
    "labels": {
      "write": "十位写几",
      "carry": "向百位送什么"
    },
    "hint": "不要只用4乘3的乘积决定写数；先把2个十加进去。",
    "trace": [
      {
        "digit": 7,
        "product": 21,
        "incoming": 0,
        "sum": 21,
        "write": 1,
        "carry": 2
      },
      {
        "digit": 4,
        "product": 12,
        "incoming": 2,
        "sum": 14,
        "write": 4,
        "carry": 1
      },
      {
        "digit": 1,
        "product": 3,
        "incoming": 1,
        "sum": 4,
        "write": 4,
        "carry": 0
      }
    ],
    "result": 441,
    "category": "笔算乘法：本位乘积加进来的数得到中间和",
    "tag": "choice",
    "explain": "个位：7×3＝21个一；进来0个一；中间和21＋0＝21，写1，进2个十。十位：4×3＝12个十；进来2个十；中间和12＋2＝14，写4，进1个百。百位：1×3＝3个百；进来1个百；中间和3＋1＝4，写4，进0个千。147×3＝441。"
  },
  {
    "id": "q5",
    "name": "新篮加入的是百",
    "a": 153,
    "b": 4,
    "kind": "choice",
    "brief": "算153×4的百位。十位算完送来了2个百。分别选百位乘积、进来的数，再填中间和。",
    "answers": {
      "product": "4",
      "incoming": "2个百",
      "sum": "6"
    },
    "choices": {
      "product": [
        "6",
        "4",
        "2"
      ],
      "incoming": [
        "2个一",
        "2个十",
        "2个百"
      ]
    },
    "labels": {
      "product": "百位乘积（几个百）",
      "incoming": "百位进来的数"
    },
    "fields": {
      "sum": "百位中间和（几个百）"
    },
    "hint": "百位的1要取4份；新篮来自十位，单位跟着篮子读。",
    "trace": [
      {
        "digit": 3,
        "product": 12,
        "incoming": 0,
        "sum": 12,
        "write": 2,
        "carry": 1
      },
      {
        "digit": 5,
        "product": 20,
        "incoming": 1,
        "sum": 21,
        "write": 1,
        "carry": 2
      },
      {
        "digit": 1,
        "product": 4,
        "incoming": 2,
        "sum": 6,
        "write": 6,
        "carry": 0
      }
    ],
    "result": 612,
    "category": "笔算乘法：本位乘积加进来的数得到中间和",
    "tag": "choice",
    "explain": "个位：3×4＝12个一；进来0个一；中间和12＋0＝12，写2，进1个十。十位：5×4＝20个十；进来1个十；中间和20＋1＝21，写1，进2个百。百位：1×4＝4个百；进来2个百；中间和4＋2＝6，写6，进0个千。153×4＝612。"
  },
  {
    "id": "q6",
    "name": "找出真的漏步",
    "a": 164,
    "b": 3,
    "kind": "choice",
    "brief": "一份草稿先算个位4×3＝12，进1个十；十位却直接用6×3＝18，写8、进1个百。选漏掉的动作，再补十位中间和。",
    "answers": {
      "fix": "把1个十加进18个十",
      "sum": "19",
      "write": "9"
    },
    "choices": {
      "fix": [
        "把1个十加进18个十",
        "把164再乘3",
        "给个位多写1"
      ]
    },
    "labels": {
      "fix": "补上哪一步"
    },
    "fields": {
      "sum": "十位中间和（几个十）",
      "write": "十位应写几"
    },
    "hint": "草稿已经算出了本位乘积。找找个位换来的那1个十去了哪里。",
    "trace": [
      {
        "digit": 4,
        "product": 12,
        "incoming": 0,
        "sum": 12,
        "write": 2,
        "carry": 1
      },
      {
        "digit": 6,
        "product": 18,
        "incoming": 1,
        "sum": 19,
        "write": 9,
        "carry": 1
      },
      {
        "digit": 1,
        "product": 3,
        "incoming": 1,
        "sum": 4,
        "write": 4,
        "carry": 0
      }
    ],
    "result": 492,
    "category": "笔算乘法：本位乘积加进来的数得到中间和",
    "tag": "choice",
    "explain": "个位：4×3＝12个一；进来0个一；中间和12＋0＝12，写2，进1个十。十位：6×3＝18个十；进来1个十；中间和18＋1＝19，写9，进1个百。百位：1×3＝3个百；进来1个百；中间和3＋1＝4，写4，进0个千。164×3＝492。草稿明确漏了十位的加法，应把1个十加进18个十。"
  },
  {
    "id": "q7",
    "name": "合好以后才决定",
    "a": 215,
    "b": 4,
    "kind": "merge",
    "brief": "算215×4的十位。原有四份一袋，个位又换来两袋。逐袋并入，再填中间和并选是否进位。",
    "answers": {
      "merged": "2",
      "sum": "6",
      "carry": "不向百位进位"
    },
    "fields": {
      "sum": "十位中间和（几个十）"
    },
    "choices": {
      "carry": [
        "向百位进1",
        "不向百位进位"
      ]
    },
    "labels": {
      "carry": "从中间和判断"
    },
    "hint": "合并完成不一定要进位；看看中间和有没有满十个十。",
    "trace": [
      {
        "digit": 5,
        "product": 20,
        "incoming": 0,
        "sum": 20,
        "write": 0,
        "carry": 2
      },
      {
        "digit": 1,
        "product": 4,
        "incoming": 2,
        "sum": 6,
        "write": 6,
        "carry": 0
      },
      {
        "digit": 2,
        "product": 8,
        "incoming": 0,
        "sum": 8,
        "write": 8,
        "carry": 0
      }
    ],
    "result": 860,
    "category": "笔算乘法：本位乘积加进来的数得到中间和",
    "tag": "merge",
    "explain": "个位：5×4＝20个一；进来0个一；中间和20＋0＝20，写0，进2个十。十位：1×4＝4个十；进来2个十；中间和4＋2＝6，写6，进0个百。百位：2×4＝8个百；进来0个百；中间和8＋0＝8，写8，进0个千。215×4＝860。"
  },
  {
    "id": "q8",
    "name": "先乘的究竟是谁",
    "a": 226,
    "b": 3,
    "kind": "choice",
    "brief": "算226×3的十位。个位送来1个十。哪种说法对？再填本位中间和。",
    "answers": {
      "method": "先2乘3，再加1",
      "sum": "7"
    },
    "choices": {
      "method": [
        "先把2加1，再乘3",
        "先2乘3，再加1",
        "只算2乘3"
      ]
    },
    "labels": {
      "method": "十位的计算顺序"
    },
    "fields": {
      "sum": "十位中间和（几个十）"
    },
    "hint": "送来的1个十已经属于这三份栗子，不要把它再乘3。",
    "trace": [
      {
        "digit": 6,
        "product": 18,
        "incoming": 0,
        "sum": 18,
        "write": 8,
        "carry": 1
      },
      {
        "digit": 2,
        "product": 6,
        "incoming": 1,
        "sum": 7,
        "write": 7,
        "carry": 0
      },
      {
        "digit": 2,
        "product": 6,
        "incoming": 0,
        "sum": 6,
        "write": 6,
        "carry": 0
      }
    ],
    "result": 678,
    "category": "笔算乘法：本位乘积加进来的数得到中间和",
    "tag": "choice",
    "explain": "个位：6×3＝18个一；进来0个一；中间和18＋0＝18，写8，进1个十。十位：2×3＝6个十；进来1个十；中间和6＋1＝7，写7，进0个百。百位：2×3＝6个百；进来0个百；中间和6＋0＝6，写6，进0个千。226×3＝678。先2乘3，再加1；进来的1不能再乘3。"
  },
  {
    "id": "q9",
    "name": "独立收好最后一批",
    "a": 158,
    "b": 4,
    "kind": "steps",
    "brief": "四份栗子，每份158颗。独立笔算，每一位依次填写三个量，再写几、进几。点下一位继续，全部完成后一起检查。",
    "answers": {
      "p0": "32",
      "i0": "0",
      "s0": "32",
      "w0": "2",
      "c0": "3",
      "p1": "20",
      "i1": "3",
      "s1": "23",
      "w1": "3",
      "c1": "2",
      "p2": "4",
      "i2": "2",
      "s2": "6",
      "w2": "6",
      "c2": "0",
      "result": "632"
    },
    "hint": "找最早还没对齐的一位：本位数字先乘4，随后只加前一位送来的数。",
    "trace": [
      {
        "digit": 8,
        "product": 32,
        "incoming": 0,
        "sum": 32,
        "write": 2,
        "carry": 3
      },
      {
        "digit": 5,
        "product": 20,
        "incoming": 3,
        "sum": 23,
        "write": 3,
        "carry": 2
      },
      {
        "digit": 1,
        "product": 4,
        "incoming": 2,
        "sum": 6,
        "write": 6,
        "carry": 0
      }
    ],
    "result": 632,
    "category": "笔算乘法：本位乘积加进来的数得到中间和",
    "tag": "steps",
    "explain": "个位：8×4＝32个一；进来0个一；中间和32＋0＝32，写2，进3个十。十位：5×4＝20个十；进来3个十；中间和20＋3＝23，写3，进2个百。百位：1×4＝4个百；进来2个百；中间和4＋2＝6，写6，进0个千。158×4＝632。"
  }
];if(typeof module!=='undefined'&&module.exports)module.exports=questions;root.PineQuestions=questions;})(typeof window!=='undefined'?window:globalThis);
