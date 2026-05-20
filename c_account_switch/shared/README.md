# Shared Prototype Requirement Board

统一需求卡片能力，用于 HTML 原型入口页。

## 接入方式

在原型入口 `index.html` 的 `<head>` 中引入：

```html
<link rel="stylesheet" href="../shared/requirement-board.css">
<script>
  window.PROTOTYPE_REQUIREMENTS_CONFIG = {
    storageKey: 'your-prototype-requirements',
    dataUrl: 'requirements.json',
    dataFileName: 'requirements.json',
    dataSavePath: '03_prototype/mockups/your-prototype/requirements.json',
    codePrefix: 'REQ-PBC',
    boardTitle: 'PBC 原型需求卡片',
    boardDescription: '统一记录页面与模块需求，并支持点击定位高亮。'
  };
</script>
<script defer src="../shared/requirement-board.js"></script>
```

## 自动能力

- 自动把入口页内容整理为左侧原型、右侧需求卡片区域。
- 在需求面板头部展示当前已有需求卡片总数量。
- 自动扫描 `.proto-card iframe`、`.screen-card iframe` 作为可绑定页面。
- 支持需求卡片新增、编辑、删除、查询和 `localStorage` 持久化。
- 支持点击需求卡片定位并高亮对应 iframe 内模块或具体元素。
- 支持“点选元素”：在左侧原型内点击任意位置，自动创建需求卡片草稿。
- 需求卡片绑定页面必选，绑定模块和绑定元素均可选；因此可绑定整页、某个模块，或页面上的某个元素。
- 新增或编辑需求卡片时，可在页面之外选择“绑定模块（可选）”和“绑定元素（可选）”。
- 新增、编辑、删除和点选创建仅允许在本地预览页面操作；公开访问页面自动进入只读模式，仅支持查看和定位。
- 可通过 `dataUrl` 配置 JSON 数据文件。发布后的静态网页会从该文件读取需求卡片；本地预览服务会在新增、编辑、删除后自动写入 `dataSavePath`。
- 若入口页存在旧版 `.req-note-board`，会作为初始需求卡片迁移到统一面板。

## 需求数据文件

建议每个原型目录维护一个 `requirements.json`：

```json
{
  "updatedAt": "2026-05-20T00:00:00.000Z",
  "requirements": [
    {
      "id": "req-demo-01",
      "code": "REQ-DEMO-01",
      "title": "示例需求",
      "description": "需求描述内容",
      "pageId": "p01",
      "moduleId": "product-table",
      "moduleTitle": "商品列表",
      "moduleSelector": "#p01-product-table",
      "elementTitle": "新增按钮",
      "elementSelector": "#p01-product-table .add-button"
    }
  ]
}
```

浏览器不能单独静默写入本地代码文件，所以本地编辑需使用共享的预览服务启动页面：

```bash
node 03_prototype/mockups/shared/requirement-dev-server.mjs 8790
```

然后打开服务输出的本地地址。本地新增、编辑、删除需求卡片后，页面会自动调用 `/__requirements/save`，由预览服务写回 `dataSavePath` 指定的 JSON 文件；之后再发布静态页面，研发即可通过公开地址看到这些需求卡片。

## 外部浏览器点选

如果原型入口页通过 iframe 展示子页面，并且希望在外部浏览器打开时也能点选子页面元素，需要在每个 iframe 子页面的 `</body>` 前引入：

```html
<script src="../shared/requirement-frame-picker.js"></script>
```

该脚本会在子页面内捕获 hover 和 click，并通过 `postMessage` 把具体元素 selector 回传给入口页。

## 可选页面配置

如需预置页面模块，可在配置中增加 `pages`：

```js
pages: [
  {
    id: 'p01',
    title: 'P01 体验商品管理',
    modules: [
      {
        id: 'product-table',
        title: '商品列表',
        selector: '#p01-product-table',
        elements: [
          { title: '新增按钮', selector: '#p01-product-table .add-button' }
        ]
      }
    ]
  }
]
```

iframe 可使用 `data-page-id` 与配置中的 `id` 对齐。若不配置 `elements`，组件会尝试从同源 iframe 中按模块 selector 自动扫描常用按钮、文本、图片等元素生成下拉选项。
