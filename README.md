# App Store Region Switcher

在浏览器里打开真正的 [apps.apple.com](https://apps.apple.com)，并切换网页上的商店地区。页面仍是苹果官网。扩展只改网址里的国家代码，例如 `/us/`、`/jp/`、`/cn/`。

这不会修改 Apple ID 的账号地区。购买和下载仍跟随账号所属国家。

## 谁只需要这个扩展

人在国外，或网络已经直接连到苹果海外服务器时，安装扩展即可。打开任意 App Store 网页，点右下角的地区按钮，地址会变成对应国家的官方页面。

## 人在中国大陆时

国内线路访问 `apps.apple.com` 时，外区网址会被送回 `/cn`。只改网址不够，还要让这个域名连到苹果的海外服务器。

不用 Clash 等代理时，在本机域名表加一行：

```text
151.101.3.6 apps.apple.com
```

macOS 可以在终端执行：

```bash
sudo sh -c 'grep -q "apps.apple.com" /etc/hosts || echo "151.101.3.6 apps.apple.com" >> /etc/hosts'
```

这是域名对照，不是代理。浏览器会直接连接 `151.101.3.6`。

已经开着系统代理或 TUN 时，代理软件会自己解析域名，上面这一行经常不起作用。这时再运行本仓库里的 `direct-proxy.mjs`。它只监听 `127.0.0.1:17890`，只转发 `apps.apple.com`。扩展里打开「打开真实 App Store 网站」后，Chrome 会把这个网站交给它，其它网站仍按原来的方式访问。

```bash
node direct-proxy.mjs
```

## 安装扩展

1. 打开 `chrome://extensions/`（Edge 用 `edge://extensions/`）。
2. 打开「开发者模式」。
3. 选择「加载已解压的扩展程序」，选中本目录。

油猴脚本 `app-store-region-switcher.user.js` 同样只改网址。国外可直接用。在中国大陆，仍需要上面的域名表或本机转发。

## 许可

[MIT](LICENSE)
