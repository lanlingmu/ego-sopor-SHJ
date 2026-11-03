# SHJ的妙妙屋

四个互动网站的静态合集，已准备 GitHub Pages 工作流，无需安装前端依赖。

## 目录

| 入口 | 标题 | 互动方式 |
| --- | --- | --- |
| `/` | SHJ的妙妙屋 | 作品导航、筛选、动态线条 |
| `3d_sanddraw/` | SHJ的妙妙屋-3D 沙纹 | 鼠标拖动、参数调整 |
| `Daily-Luck/` | SHJ的妙妙屋-每日塔罗 | 摄像头、手势 |
| `particle-pagoda/` | SHJ的妙妙屋-粒子古塔 | 摄像头、手势 |
| `ripples/` | SHJ的妙妙屋-液态涟漪 | 摄像头、手势 |

来源：https://github.com/lanlingmu27-ops 。每个旧站的来源提交记录在 `migration.json`。`waangzhanceshi` 未下载、未迁移、未修改。原有四个仓库也未删除或更改。

本次为源码快照整合，不合并各仓库的完整 Git 提交历史；来源提交可追溯。子站保留原有互动代码，仅改页面标题、补充元数据和返回总站的链接。首页封面为原创矢量图形示意，并非运行截图。

## 在 GitHub 发布

1. 使用已新建的公开仓库 `lanlingmu27-ops/ego-sopor-SHJ`。
2. 整合源码位于仓库根目录的 `main` 分支，含 `.github` 和 `.nojekyll`。
3. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
4. 在 **Actions** 中运行 `Deploy SHJ sites to GitHub Pages`，或再推送一次更改触发部署。
5. 工作流成功后，预期访问地址为 `https://lanlingmu27-ops.github.io/ego-sopor-SHJ/`。

部署状态以 Actions 的实际结果为准。原站链接会继续使用原仓库，不自动跳转到新地址。

## 名字与域名

- 总站展示名：`SHJ的妙妙屋`。
- 总站页面标题：`SHJ的妙妙屋`。
- 仓库和路径名建议：`ego-sopor-SHJ`。
- `SHJ的妙妙屋` 不是完整域名，空格和下划线不适用于普通网站主机名。
- 如要使用独立域名，需要先拥有相应域名，再配置 GitHub Pages 和 DNS。本包未包含 `CNAME`，不会擅自绑定域名。
- 若改用账号根站或独立域名，请同时将 `404.html` 的返回链接改为 `/`。

## 本地预览

在本目录运行：

```sh
python -m http.server 8766 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8766/`。涉及摄像头的体验需要 localhost 或 HTTPS、用户授权和支持 WebGL 的浏览器。子站仍依赖原有第三方 CDN、MediaPipe 模型；首次加载和运行效果受网络、设备和权限影响。

没有新增摄像头上传服务；本次未完整审计原有第三方依赖的数据处理行为。


## 暗红主题与主页交互

- `assets/home.css`：主题变量、布局、卡片和响应式规则。
- `assets/home.js`：只负责初始化与销毁，不包含具体交互逻辑。
- `assets/modules/field.js`：预生成线条几何、鼠标悬停与拖拽旋转、键盘、暂停与重置。
- `assets/modules/gallery.js`：卡片视差、柔光和入场显示。
- `assets/modules/filters.js`：分类筛选与统一卡片排序。

主页无新增第三方运行时依赖。主视觉使用 Canvas 2D 投影，几何只生成一次，离屏与隐藏标签暂停动画，设备像素比最高 1.75，尊重系统减少动态效果设置。移动端保留纵向页面滚动。

参考的是交互设计思路，实现为本项目独立代码：
- https://tympanus.net/codrops/2025/03/18/building-an-interactive-image-grid-with-three-js/
- https://tympanus.net/codrops/2019/01/24/layer-motion-slideshow/

模块输入与生命周期已自动检查；本轮自动浏览器工具未能启动，未完成本轮桌面/手机截图和实机触控验收。

### 最终交互

- 作品封面统一比例和大小；独立静止图框负责追光和视差，文字区不触发。
- `rotation.js` 只保留当前使用的四元数和透视球面计算，不保留试验用的旧控制方式。
- 主视觉的拖拽朝向与自身竖轴自转相位分开维护，在绘制时组合。
- 抓取时冻结自转相位，松开后恢复；翻转会自然改变屏幕上的自转观感。
- 重置用 0.85 秒平滑过渡，重置途中可重新抓取。
- 用户已在本地预览中确认并于 2026-11-04 授权发布本轮改版。

### 作品封面专属预览

`project-previews.js` 独立管理四种作品预览：沙纹随机切换克拉尼节线、原站铃兰牌背展开、原封面主塔保留、同源塔形分层生长、指针位置水波。通过 `activate/deactivate/destroy` 接口接入图框事件，不修改四个子站代码。所有预览仅在交互时循环，离开淡出后停止；隐藏页面和离屏暂停，画布 DPR 上限 1.5，系统减少动态效果时显示静态预览。触摸滑动不误触链接。
