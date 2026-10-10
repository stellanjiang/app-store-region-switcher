# App Store Region Switcher

在浏览器里打开真正的 [apps.apple.com](https://apps.apple.com)，并切换网址里的商店地区，例如 `/us/`、`/jp/`、`/cn/`。页面仍是苹果官网。

这不会修改 Apple ID 的账号地区。购买和下载仍跟随账号所属国家。

## 用法

### 国外

装上扩展即可。打开 [apps.apple.com](https://apps.apple.com)，点页面右下角的地区，或按 `Alt+Shift+A` 打开扩展弹窗。弹窗里也可以搜索 App 名称或 ID。

### 中国大陆

Mac 和 Windows 都支持。每台电脑各自安装一次，开着代理和没开代理用同一条对应系统的命令。它只处理 `apps.apple.com`，其它网站不变。扩展在每台电脑上各自检测本机程序。

#### Mac

已克隆本仓库时，在仓库目录执行：

```bash
./install.sh
```

还没有仓库时：

```bash
curl -fsSL https://raw.githubusercontent.com/stellanjiang/app-store-region-switcher/main/install.sh | bash
```

停止并取消登录自启：

```bash
bash install.sh --uninstall
```

#### Windows

不需要安装 Python，用系统自带的 PowerShell：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/stellanjiang/app-store-region-switcher/main/install.ps1 | iex"
```

如果 Windows 询问防火墙，允许专用网络即可。这个程序只监听本机 `127.0.0.1`。

停止并取消登录自启：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:ASR_UNINSTALL='1'; irm https://raw.githubusercontent.com/stellanjiang/app-store-region-switcher/main/install.ps1 | iex"
```

看到「已在后台运行」后，在这台电脑上打开扩展，再切换地区。

## 安装扩展

1. 打开 `chrome://extensions/`（Edge 用 `edge://extensions/`）。
2. 打开「开发者模式」。
3. 选择「加载已解压的扩展程序」，选中本目录。

## 油猴脚本

`app-store-region-switcher.user.js` 使用同一套网址规则，只切换地区。在中国大陆，仍需要上面的安装命令。

## 许可

[MIT](LICENSE)
