# App Store Region Switcher

在浏览器里打开真正的 [apps.apple.com](https://apps.apple.com)，并切换网址里的商店地区，例如 `/us/`、`/jp/`、`/cn/`。页面仍是苹果官网。

这不会修改 Apple ID 的账号地区。购买和下载仍跟随账号所属国家。

## 用法

先装好扩展，再按自己的网络选一条命令。扩展负责改网址。命令只在中国大陆需要，用来让外区页面不要被送回 `/cn`。

### 国外：不用额外命令

打开 [apps.apple.com](https://apps.apple.com)，点页面右下角的地区，或按 `Alt+Shift+A` 打开扩展弹窗。也可以在弹窗里搜索 App 名称或 ID。

### 中国大陆，没开代理：一条域名命令

```bash
sudo sh -c 'grep -q "[[:space:]]apps.apple.com" /etc/hosts || echo "151.101.3.6 apps.apple.com" >> /etc/hosts'
```

这条命令把 `apps.apple.com` 指到 `151.101.3.6`。浏览器会直接连接这个地址，其它网站不变。命令可以重复执行，已经有这一行时不会再写一次。

然后打开官网，用扩展切换地区。

不再需要时删掉这一行：

```bash
sudo sed -i '' '/[[:space:]]apps\.apple\.com$/d' /etc/hosts
```

### 中国大陆，开着 Clash 或 TUN：一条转发命令

系统代理会自己解析域名，上面的域名命令经常不起作用。在本目录执行：

```bash
node direct-proxy.mjs
```

终端出现 `direct proxy on 127.0.0.1:17890` 后，打开扩展弹窗，打开「使用本机转发」，再切换地区。这个程序只转发 `apps.apple.com`。结束时在该终端按 `Ctrl+C`。

确认它在运行：

```bash
curl -s http://127.0.0.1:17890/health
```

返回 `"ok":true` 即可。

## 安装扩展

1. 打开 `chrome://extensions/`（Edge 用 `edge://extensions/`）。
2. 打开「开发者模式」。
3. 选择「加载已解压的扩展程序」，选中本目录。

## 油猴脚本

`app-store-region-switcher.user.js` 使用同一套网址规则，只切换地区。它不包含上面的域名命令和转发命令。在中国大陆，仍需要其中一条。

## 许可

[MIT](LICENSE)
