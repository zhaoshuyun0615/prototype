# B端在线反馈高保真原型

本目录是 GitHub Pages 发布目录下的在线反馈独立需求原型。本需求采用特殊三端分离入口方案，仅此需求使用：`index.html` 只作为 B 端原型页面总入口，C 端使用 `c-end.html`，P/PC 端使用 `p-end.html`。

本目录使用 HTML + Tailwind CSS + FontAwesome 实现高保真原型。B 端视觉规范参考最新生产代码 `wyhy-b-miniapp-prod-20260514/src/m/train/home` 小火车首页，C 端模拟用户小程序，P/PC 端模拟管理后台布局。

## 文件说明

| 文件 | 页面 |
| --- | --- |
| `index.html` | B 端需求主入口，使用 iframe 平铺展示 B 端独立页面 |
| `requirements.json` | B 端需求卡片数据 |
| `c-end.html` | C 端在线反馈旧版聚合原型，还原启动入口、未登录、提交、成功、列表、空态和结果详情等状态 |
| `c-requirements.json` | C 端需求卡片数据 |
| `home.html` | 小火车首页，包含新版商户信息、权限功能网格、在线反馈入口、会员审核待办、待处理反馈提示 |
| `feedback-list.html` | 在线反馈列表 |
| `feedback-detail.html` | 反馈详情 |
| `feedback-process.html` | 处理反馈 |
| `feedback-submitted.html` | 处理成功 |
| `feedback-empty.html` | 空状态 |
| `feedback-loading.html` | 加载中 |
| `feedback-forbidden.html` | 无权限 |
| `p-end.html` | P/PC 端在线反馈旧版聚合原型，还原反馈管理、筛选检索、详情处理、管理关闭、空态、加载和无权限等状态 |
| `p-requirements.json` | P/PC 端需求卡片数据 |
| `assets/styles.css` | 公共样式与手机原型边框样式 |
| `assets/online_feedback_prototype.css` | C 端与 P/PC 端聚合页样式 |
| `assets/online_feedback_interactions.js` | C 端与 P/PC 端聚合页状态切换、弹窗、Toast、模拟加载交互 |

## 设计约束

- 页面外框沿用上一版原型的轻量手机边框样式：`375px` 宽、圆角、浅边框与阴影。
- `index.html` 不直接写入所有页面 HTML，仅通过 iframe 嵌入 B 端独立页面。
- C 端不嵌入 `index.html`，按照旧版聚合页保留在 `c-end.html`。
- 三端需求卡片数据分离存储：B 端使用 `requirements.json`，C 端使用 `c-requirements.json`，P/PC 端使用 `p-requirements.json`。
- 保留小火车首页当前权限逻辑下的功能入口：设备注册、设备管理、售币、扫码核销、会员管理、礼品管理、我的业绩、小火车售票、币经营数据、门票经营数据、商管派币。
- 首页记录 Tab 使用最新四栏结构：今日售币记录、今日扣币记录、今日售票记录、今日核销记录。
- 新增在线反馈功能入口与待处理反馈提示。
- B端提交处理结果后，工单直接关闭，无用户确认流程。
- P/PC 端不嵌入 `index.html`，按照旧版聚合页保留在 `p-end.html`。
- 在线反馈原型相关页面、需求数据和公共资源统一收敛到 `train_feedback/` 内，目录外不再保留旧原型入口或旧资源文件。
- GitHub 发布版本的在线反馈原型相关页面、需求数据和公共资源统一收敛到 `03_prototype_github/online_feedback/` 内。
