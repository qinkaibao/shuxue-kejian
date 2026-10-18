# shuxue-kejian

三年级数学课件。在线打开：https://qinkaibao.github.io/shuxue-kejian/

首页是总目录。读题闯关（审题与数量关系）在 [/chuangguan/](https://qinkaibao.github.io/shuxue-kejian/chuangguan/)。

新故事/练习必须接入成绩单并加入首页目录。每个页面顶部要有固定栏：回目录、回主页、关卡、进度。会判对错的页面把「交作业」也放在顶栏，调用 `KejianReport.open()`。

错题练习册和长度单位换算用 `common/play.js`：主页、按知识点分的关卡地图、阅读理解→分析解答→回顾反思、右侧「我的解答」。星星和读题闯关一样：没看讲解 3 颗，看 1 次 2 颗，看更多 1 颗。进度仍写回原来的键 `lianxi_kejian_v1`、`danwei-lianxi-v1`（做完的题 `correct: true`，并多记 `stars`）。旧数据里已经做对的题会当成 3 颗星，不会清掉。

会判对错的页面这样做：

1. 在页面脚本前引入 `../common/report.js`（根目录页面用 `common/report.js`）。
2. 调用 `KejianReport.mount({ id, name, questions:[{id, brief, tag}], legacySolved })`。`questions` 按题号排列，`tag` 写知识点，例如「长度换算/分米↔厘米」。
3. 判错时调用 `KejianReport.miss(题号, '孩子实际写下的错答')`，整题做对时调用 `KejianReport.pass(题号)`。空着没填、还没提交，不要记入。
4. 清空进度时调用 `KejianReport.clear()`。成绩单存在单独的键 `kejian-report-v1:<页面id>`，不要改各页原来的进度键。
5. 在 `index.html` 对应一栏加上入口。日期用该目录第一次 `git log` 提交日期，新的排在前面，并写一句简介。

读题闯关的进度键是 `math_shenti_v1`。同域名下路径变了，这个字符串也不能改。
