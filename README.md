# shuxue-kejian

三年级数学课件。在线打开：https://qinkaibao.github.io/shuxue-kejian/

首页是总目录。读题闯关（审题与数量关系）在 [/chuangguan/](https://qinkaibao.github.io/shuxue-kejian/chuangguan/)。

新故事/练习必须接入成绩单并加入首页目录。

会判对错的页面这样做：

1. 在页面脚本前引入 `../common/report.js`（根目录页面用 `common/report.js`）。
2. 调用 `KejianReport.mount({ id, name, questions:[{id, brief, tag}], legacySolved })`。`questions` 按题号排列，`tag` 写知识点，例如「长度换算/分米↔厘米」。
3. 判错时调用 `KejianReport.miss(题号, '孩子实际写下的错答')`，整题做对时调用 `KejianReport.pass(题号)`。空着没填、还没提交，不要记入。
4. 清空进度时调用 `KejianReport.clear()`。成绩单存在单独的键 `kejian-report-v1:<页面id>`，不要改各页原来的进度键。
5. 在 `index.html` 对应一栏加上入口。日期用该目录第一次 `git log` 提交日期，新的排在前面，并写一句简介。

读题闯关的进度键是 `math_shenti_v1`。同域名下路径变了，这个字符串也不能改。
