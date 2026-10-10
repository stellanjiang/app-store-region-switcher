# App Store Region Switcher

在浏览器里打开真正的 [apps.apple.com](https://apps.apple.com)，并切换网址里的商店地区，例如 `/us/`、`/jp/`、`/cn/`。页面仍是苹果官网。

这不会修改 Apple ID 的账号地区。购买和下载仍跟随账号所属国家。

## 用法

### 国外

装上扩展即可。打开 [apps.apple.com](https://apps.apple.com)，点页面右下角的地区，或按 `Alt+Shift+A` 打开扩展弹窗。弹窗里也可以搜索 App 名称或 ID。

### 中国大陆

开着代理和没开代理用同一条命令。它会安装一个登录后自动启动的小程序，只处理 `apps.apple.com`，其它网站不变。扩展检测到它就会自动接上。

已克隆本仓库时，在仓库目录执行：

```bash
./install.sh
```

还没有仓库时，在终端执行：

```bash
curl -fsSL https://raw.githubusercontent.com/stellanjiang/app-store-region-switcher/main/install.sh | bash
```

看到「已在后台运行」后，打开扩展，再切换地区。

停止并取消登录自启：

```bash
bash install.sh --uninstall
```

这条命令用于 macOS，使用系统自带的 Python。其它系统在本目录运行 `python3 direct-proxy.py`，并在扩展里打开「自动使用本机转发」。

## 安装扩展

1. 打开 `chrome://extensions/`（Edge 用 `edge://extensions/`）。
2. 打开「开发者模式」。
3. 选择「加载已解压的扩展程序」，选中本目录。

## 油猴脚本

`app-store-region-switcher.user.js` 使用同一套网址规则，只切换地区。在中国大陆，仍需要上面的安装命令。

## 许可

[MIT](LICENSE)
