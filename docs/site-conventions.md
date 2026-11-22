# 网站与验收约定

正式站点：https://qinkaibao.github.io/shuxue-kejian/  
仓库：https://github.com/qinkaibao/shuxue-kejian

## 页面结构

故事页建议目录：`<slug>/index.html`、`style.css`、`story.js`。

- 脚本顺序：`../common/nav.js`，然后 `story.js`。
- 调用 `SiteNav.mount({ title, pageId: '<slug>', reading: true, dir: '../index.html' })`。

练习页建议目录：`<slug>-lianxi/index.html`、`questions.js`、`practice.js`（样式可引用 `../<slug>/style.css`）。

- 脚本顺序：`../common/report.js`，`../common/nav.js`，`questions.js`，`practice.js`。不要改这个顺序。
- `KejianReport.mount` / `pass` / `miss` / `submit` / `restorePractice` / `updatePageExtras`。
- `SiteNav.mount` 带 `report: true`，`pageId` 与 `reportId` 都等于 `<slug>-lianxi`，`total` 等于实际题数。
- 空白不调用 `miss`。不要向报告服务写入测试成绩或假数据。

`common/nav.js`、`common/report.js`、`common/play.js` 是全站共用脚本。没有明确要求时不要改。

## 标识

- 新 `slug`、`pageId`、`reportId` 必须全站唯一。已占用名单见 [stories/reserved-slugs.json](stories/reserved-slugs.json)。
- 首页 `index.html` 的 `ITEMS` 数组增加入口，新的排在前面，并保留全部旧条目。
- 公开主角叫小美。页面、文稿、图注里不要出现真实姓名、照片、个人成绩和作为称呼的“糖果”。

## 预览和发布

- 离线预览可以做成单文件，禁用网络和报告服务，供本地打开。离线预览、测试脚本、私密依据、学生或家长打印稿，默认留在本地，不随故事自动上传。
- 正式源才进入本仓库对应目录。发布须有明确授权，使用当时最新的远端主干，不要用过时的本地脏副本覆盖。
- 不要强制推送，不要 `reset --hard` 到已发布的历史上，不要跳过钩子来提交，也不要为了一次提交改全局 git 配置。

## 验收（发布前至少做这些）

- 用脚本独立重算全部得数、图上可数对象与文字是否一致。
- 互动测试覆盖：空白不计错、首错只提示、两错展开、做对、重置、按 pageId 恢复、交作业钩子，以及你设计的操作图。
- 隐私扫描：姓名、电话、邮箱、本地路径、令牌、成绩。
- 插图若导出为静态栅格，要写明那不是真实手机或浏览器截图；未做真机验收就要照实说明。

更早的站点说明仍在仓库根目录 [README.md](https://github.com/qinkaibao/shuxue-kejian/blob/main/README.md) 里，其中关于 `KejianReport` 的接入步骤对新练习仍然有效。
