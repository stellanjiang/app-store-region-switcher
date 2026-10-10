#!/bin/bash
# 中国大陆用这一条即可。开着代理或没开代理都一样。
# 它会在登录时启动本机转发，只处理 apps.apple.com。

set -euo pipefail

LABEL="com.stellanjiang.app-store-region"
LEGACY_LABEL="com.aso.apps-apple-direct"
DEST="${HOME}/Library/Application Support/app-store-region-switcher"
PLIST="${HOME}/Library/LaunchAgents/${LABEL}.plist"
LOG="${HOME}/Library/Logs/app-store-region-switcher.log"
SOURCE_URL="https://raw.githubusercontent.com/stellanjiang/app-store-region-switcher/main/direct-proxy.py"
DOMAIN="gui/$(id -u)"

stop_agent() {
  launchctl bootout "${DOMAIN}/${1}" >/dev/null 2>&1 || true
}

if [[ "${1:-}" == "--uninstall" ]]; then
  stop_agent "${LABEL}"
  rm -f "${PLIST}"
  echo "已停止，并取消登录时自动启动。"
  exit 0
fi

if [[ "$(uname)" != "Darwin" ]]; then
  echo "这条安装命令用于 macOS。Windows 不需要 Python，请运行 install.ps1。"
  exit 1
fi

PYTHON="/usr/bin/python3"
if [[ ! -x "${PYTHON}" ]]; then
  PYTHON="$(command -v python3 || true)"
fi
if [[ -z "${PYTHON}" ]]; then
  echo "没有找到 python3。"
  exit 1
fi

mkdir -p "${DEST}" "${HOME}/Library/LaunchAgents" "${HOME}/Library/Logs"
SCRIPT_DIR=""
if [[ -n "${BASH_SOURCE[0]:-}" && -f "${BASH_SOURCE[0]}" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi
if [[ -n "${SCRIPT_DIR}" && -f "${SCRIPT_DIR}/direct-proxy.py" ]]; then
  cp "${SCRIPT_DIR}/direct-proxy.py" "${DEST}/direct-proxy.py"
else
  curl -fsSL "${SOURCE_URL}" -o "${DEST}/direct-proxy.py"
fi
chmod 755 "${DEST}/direct-proxy.py"

cat > "${PLIST}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${PYTHON}</string>
    <string>${DEST}/direct-proxy.py</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG}</string>
  <key>StandardErrorPath</key>
  <string>${LOG}</string>
</dict>
</plist>
EOF

stop_agent "${LEGACY_LABEL}"
stop_agent "${LABEL}"
launchctl bootstrap "${DOMAIN}" "${PLIST}"
launchctl enable "${DOMAIN}/${LABEL}" || true

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS --max-time 1 "http://127.0.0.1:17890/health" >/dev/null 2>&1; then
    echo "已在后台运行。打开浏览器扩展即可切换地区。以后登录也会自动启动。"
    echo "停止并取消自启：bash install.sh --uninstall"
    exit 0
  fi
  sleep 0.3
done

echo "已安装，但 127.0.0.1:17890 还没有响应。日志：${LOG}"
exit 1
