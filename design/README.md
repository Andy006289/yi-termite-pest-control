# YI Termite & Pest Control — ICT6400 Assessment 1 design files

一套用 HTML/CSS/JS 做的响应式设计稿：7 个页面 × 线框图/高保真两种皮肤 × 手机/平板/桌面三个断点，外加风格指南。
所有页面都是真正的响应式原型，可以直接在浏览器里缩放测试，也可以导入 Figma 编辑。

## 目录

| 路径 | 内容 |
|---|---|
| `index.html` | 入口页，链接到所有页面和变体 |
| `style-guide.html` | 风格指南：色板、字体、间距、断点、组件、图标、无障碍 |
| `mockups/*.html` | 高保真 mockup（7 页） |
| `wireframes/*.html` | 低保真线框图（同 7 页，灰阶 + 占位图） |
| `assets/base.css` | 设计系统 + 响应式规则（768px / 1024px 两个断点，mobile-first） |
| `assets/app.js` | 交互：手机菜单、向导步骤、选项选择、表单校验、标注、工具条 |
| `screenshots/` | `python3 shoot.py --annotate` 生成的全页截图（2× 分辨率） |
| `build.py` | 从模板重新生成 mockups/ 和 wireframes/（改页面内容时改这个文件再跑一次） |
| `shoot.py` | 用无头 Chrome 批量导出全页截图 |

页面：`home` · `identify` · `estimate`（5 步向导）· `estimate-result` · `booking` · `booking-confirmed` · `my-services`

## 在浏览器里看

在本目录启动一个静态服务器（用 file:// 直接打开也可以）：

```bash
python3 -m http.server 8766
```

然后打开 http://localhost:8766/ 。右下角悬浮工具条可以：切换线框/高保真、打开标注、隐藏工具条（按 H 键也行）。

URL 参数：`?mode=wire` / `?mode=hifi` 强制皮肤 · `?annotate=1` 显示编号标注 · `?clean=1` 隐藏工具条 · `?legend=top` 标注图例固定在顶部（截长图用）· `?step=N` 打开向导第 N 步 · `?menu=open` 展开手机菜单 · `?errors=1` 显示表单校验错误态

## 导入 Figma（html.to.design 插件）

1. Figma 里新建文件 → Resources（Shift+I）→ Plugins → 搜索 **html.to.design** → Run。
2. 用 Chrome 打开某个页面，比如 `http://localhost:8766/mockups/home.html?clean=1`。
3. 在 html.to.design 里选 **URL** 标签页粘贴地址；宽度依次选 390、768、1440 各导入一次（插件里有 viewport 宽度设置）。
   - 本地地址插件访问不到的话，改用它的 **Chrome 扩展**（html.to.design Chrome Extension）：打开页面 → DevTools 切到对应尺寸 → 点扩展的 Capture，会直接送进 Figma。
4. 每个页面导入后是完整可编辑的 Figma 图层（frame、文字、矢量），把三个尺寸并排放在一个 Page 上，命名如 `Home / Desktop 1440`。
5. 线框图同样操作，换成 `wireframes/` 下的地址。
6. 标注：把 `screenshots/mockups_annotated/` 里的图拖进 Figma 做参考，或者直接用 Figma 的 Annotation / 便签把 `?annotate=1` 页面上的编号文字抄上去。

## 截图（测试证据 / 报告插图）

```bash
python3 shoot.py --annotate
```

生成 `screenshots/mockups/`、`screenshots/wireframes/`、`screenshots/*_annotated/` 和 `screenshots/style-guide__*.png`。
每个文件名是 `页面__断点.png`。报告第 6 节直接用这些图；第 8 节测试可以用 Chrome/Safari DevTools 手动截图补上真实设备证据。

## 断点

| 断点 | 宽度 | 测试尺寸 | 主要变化 |
|---|---|---|---|
| Mobile | < 768px | 390 × 844 | 汉堡菜单、单列、全宽按钮和表单、分段进度条、横向滚动的日期条 |
| Tablet | ≥ 768px | 768 × 1024 | 横向导航 + 头部 CTA、2 列卡片、2 列表单、3 列选项瓦片 |
| Desktop | ≥ 1024px | 1440 × 900 | 2 列 hero、4 列卡片、3 列向导布局（步骤 / 问题 / 摘要）、粘性侧栏 |
