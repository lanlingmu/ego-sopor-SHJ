# ego sopor_SHJ · SHJ的小网站们

四个互动网站的静态合集，已准备 GitHub Pages 工作流，无需安装前端依赖。

## 目录

| 入口 | 标题 | 互动方式 |
| --- | --- | --- |
| `/` | SHJ的小网站们 | 作品导航、筛选、动态线条 |
| `3d_sanddraw/` | SHJ的小网站们-3D 沙纹 | 鼠标拖动、参数调整 |
| `Daily-Luck/` | SHJ的小网站们-每日塔罗 | 摄像头、手势 |
| `particle-pagoda/` | SHJ的小网站们-粒子古塔 | 摄像头、手势 |
| `ripples/` | SHJ的小网站们-液态涟漪 | 摄像头、手势 |

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

- 总站展示名：`ego sopor_SHJ`。
- 总站页面标题：`SHJ的小网站们`。
- 仓库和路径名建议：`ego-sopor-SHJ`。
- `ego sopor_SHJ` 不是完整域名，空格和下划线不适用于普通网站主机名。
- 如要使用独立域名，需要先拥有相应域名，再配置 GitHub Pages 和 DNS。本包未包含 `CNAME`，不会擅自绑定域名。
- 若改用账号根站或独立域名，请同时将 `404.html` 的返回链接改为 `/`。

## 本地预览

在本目录运行：

```sh
python -m http.server 8766 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8766/`。涉及摄像头的体验需要 localhost 或 HTTPS、用户授权和支持 WebGL 的浏览器。子站仍依赖原有第三方 CDN、MediaPipe 模型；首次加载和运行效果受网络、设备和权限影响。

没有新增摄像头上传服务；本次未完整审计原有第三方依赖的数据处理行为。
