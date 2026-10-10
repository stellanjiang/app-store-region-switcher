# App Store Region Switcher

在浏览器里打开真正的 [apps.apple.com](https://apps.apple.com)，并切换网址里的商店地区，例如 `/us/`、`/jp/`、`/cn/`。页面仍是苹果官网。

这不会修改 Apple ID 的账号地区。购买和下载仍跟随账号所属国家。

## 安装

1. 打开 `chrome://extensions/`（Edge 用 `edge://extensions/`）。
2. 打开「开发者模式」。
3. 选择「加载已解压的扩展程序」，选中本目录。

打开任意 App Store 网页后，用右下角的地区按钮，或扩展弹窗里的地区，跳到对应官方页面。弹窗里也可以按名称或 App ID 搜索。

## 页面被送回中国区时

国内线路访问 `apps.apple.com` 时，外区网址会被送回 `/cn`。扩展改完网址后，还要让这个域名连到苹果的海外服务器。两种做法选一种。

没开系统代理时，在本机域名表加一行：

```text
151.101.3.6 apps.apple.com
```

macOS：

```bash
sudo sh -c 'grep -q "[[:space:]]apps.apple.com" /etc/hosts || echo "151.101.3.6 apps.apple.com" >> /etc/hosts'
```

这是域名对照。浏览器会直接连接这个地址，其它网站不变。

已经开着 Clash、系统代理或 TUN 时，代理软件会自己解析域名，上面这一行经常不起作用。在本目录运行：

```bash
node direct-proxy.mjs
```

它只监听 `127.0.0.1:17890`，只转发 `apps.apple.com`。然后在扩展弹窗里打开「使用本机转发」。

## 油猴脚本

`app-store-region-switcher.user.js` 使用同一套网址规则，只切换地区。它不包含本机转发。在中国大陆，仍需要上面的域名表或 `direct-proxy.mjs`。

## 许可

[MIT](LICENSE)
