'use strict';
const BlueBeadsQuestions = [
  {
    id: 'q1',
    answer: 'A',
    hint: '把每次算进去的五枚指给自己看，袋外两枚被哪次算进去了？',
    explain: '5×6＝30枚，只数满袋部分，全部还要加外面2枚。'
  },
  {
    id: 'q2',
    expr: '4×8',
    cakes: 3,
    total: '35',
    hintExpr: '满盘有几个四？',
    hintCake: '旁边三块仍属于原来这些饼吗？',
    hintTotal: '先算满盘再加旁边。',
    explain: '4×8＝32，32＋3＝35。'
  },
  {
    id: 'q3',
    answer: 'A',
    hint: '七数的是盒，四数的是什么？四支已经在七盒里了吗？',
    explain: '42＋4＝46，不能把4支当4盒。'
  },
  {
    id: 'q4',
    full: '48',
    all: '53',
    hintFull: '先算六个八。',
    hintAll: '总数包括散着五枚吗？',
    explain: '8×6＝48，48＋5＝53；53÷8＝6余5。'
  },
  {
    id: 'q5',
    answer: 'B',
    hint: '剩下的够不够再装一盒七颗？',
    explain: '7或9都够再装一盒，3不够。0也可能，但本题未列。'
  },
  {
    id: 'q6',
    order: ['c1', 'c2', 'c3'],
    value: '47',
    hintOrder: '商五说有五份，每份九个，先找这五份多少。',
    hintValue: '五个九是四十五，再合上剩下的二。',
    explain: '①9×5＝45，先找五个完整的九；②45＋2＝47，再合上剩下的二；③47÷9＝5……2，放回去核对。□＝47。'
  },
  {
    id: 'q7',
    answer: 'B',
    hint: '每袋3张与每袋4张，总数相同吗？',
    explain: '3×5＋2＝17，4×5＋2＝22，两种都符合题面，总数不同，所以条件不足。袋和张不能直接相加。'
  },
  {
    id: 'q8',
    length: '43',
    why: 'A',
    hint: '画长线，标五段八厘米，把最后三厘米画在同一条线上。',
    explain: '8×5＋3＝43厘米。五段长度加剩下长度。按小学理想剪绳模型忽略剪口损耗。'
  }
];

const BlueBeadsSortCards = [
  { id: 'c1', text: '①9×5＝45，先找五个完整的九' },
  { id: 'c2', text: '②45＋2＝47，再合上剩下的二' },
  { id: 'c3', text: '③47÷9＝5……2，放回去核对' }
];

if (typeof window !== 'undefined') {
  window.BlueBeadsQuestions = BlueBeadsQuestions;
  window.BlueBeadsSortCards = BlueBeadsSortCards;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BlueBeadsQuestions, BlueBeadsSortCards };
}
