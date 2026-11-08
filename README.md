# HIST2012 · Continuous Entrance Wall

HIST2012 展览入口墙的 Three.js 交互预览：18 m 连续墙（B0 + B1–B6 + B7 共 8 湾）、12 m 连续玻璃展柜、程序化石灰泥/石材材质、90 秒自动巡游、自由漫游、策展文字实时编辑与布局校验、GLB 模型本地导入。

## 本地运行

```bash
npm install
npm run dev      # 开发预览，默认 http://localhost:3000
npm run build    # 生产构建，产物在 dist/index.html（单文件，资源全部内联）
npm run lint     # 代码检查
```

## 如何与同学一起编辑（不用安装任何工具）

### 方式一：StackBlitz（最简单，推荐）

1. 把 GitHub 仓库地址发给大家。
2. 同学在浏览器打开 `https://stackblitz.com/github/<你的用户名>/<仓库名>`。
3. 页面加载后自动安装依赖并启动预览，改代码即时生效。
4. 改完后可以直接在 StackBlitz 里提交（Commit to repository），需要登录 GitHub 账号。

### 方式二：GitHub Codespaces

1. 在 GitHub 仓库页面点 `Code → Codespaces → Create codespace on main`。
2. 浏览器里打开一个完整的 VS Code，等右下角提示依赖装好后运行 `npm run dev`。
3. 改完直接在终端 `git add -A && git commit -m "说明" && git push`。
4. 公共仓库每月有免费额度，够小组作业使用。

### 策展文字在哪里改

- 全部策展文字在 `public/wall.json`，每个区域有 `text.en` / `text.zh` 两个字段，改完 push 即可。
- 字数、行数、边界和重叠限制已在 app 内做了实时校验，改超了界面会提示。
- 布局参数（位置 `x`/`y`、尺寸 `w`/`h`、字数上限 `words`、行数 `lines`）也在同一个 JSON 里，遵循 `public/wall.schema.json`。
- 不要改 8 个湾（B0–B7）、6 个展品的数量和 `wall.length = 18`，这是课程方案的结构约束。

## 网站如何更新（部署）

- 任何 push 到 `main` 分支都会通过 `.github/workflows/deploy.yml` 自动重新构建并发布到 GitHub Pages。
- 网站地址：`https://<你的用户名>.github.io/<仓库名>/`
- 发布状态可以在仓库的 `Actions` 标签页查看，绿色勾表示已上线。

## 项目结构

```
public/wall.json        # 全部策展文字与布局配置（同学主要改这里）
public/wall.schema.json # 配置的校验规则
src/                    # React + Three.js 源码
docs/spatial-specification.md  # 空间尺寸与 90 秒分镜说明
```

## 重要约定

- 所有策展文字默认留空，不编造标题、文物、年代或说明。
- GLB 模型导入只保存在当前浏览器会话，不上传、不写入仓库。
