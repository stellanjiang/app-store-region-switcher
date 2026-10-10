/**
 * 让 Chrome 只把 apps.apple.com 交给本机直连代理。
 * 其它网站保持直连，系统 IP 不变。页面仍是苹果官网。
 */

const DIRECT_PORT = 17890;

const POPULAR_MENU_REGIONS = [
  { code: 'us', name: '美国', flag: '🇺🇸' },
  { code: 'cn', name: '中国大陆', flag: '🇨🇳' },
  { code: 'hk', name: '中国香港', flag: '🇭🇰' },
  { code: 'tw', name: '中国台湾', flag: '🇹🇼' },
  { code: 'jp', name: '日本', flag: '🇯🇵' },
  { code: 'kr', name: '韩国', flag: '🇰🇷' },
  { code: 'gb', name: '英国', flag: '🇬🇧' }
];

function applyDirectProxy(enabled) {
  if (!chrome.proxy) return;
  if (!enabled) {
    chrome.proxy.settings.clear({ scope: 'regular' });
    return;
  }

  const pacScript = `
    function FindProxyForURL(url, host) {
      if (host === "apps.apple.com" || dnsDomainIs(host, ".apps.apple.com")) {
        return "PROXY 127.0.0.1:${DIRECT_PORT}";
      }
      return "DIRECT";
    }
  `;

  chrome.proxy.settings.set({
    value: {
      mode: 'pac_script',
      pacScript: { data: pacScript }
    },
    scope: 'regular'
  });
}

function syncProxySetting() {
  chrome.storage.sync.get(['directProxyVersion', 'proxyRoutingEnabled'], (res) => {
    if (res.directProxyVersion !== 3) {
      chrome.storage.sync.set({
        directProxyVersion: 3,
        proxyRoutingEnabled: true,
        proxyPort: DIRECT_PORT,
        preferredRegion: 'us'
      }, () => applyDirectProxy(true));
      return;
    }
    applyDirectProxy(res.proxyRoutingEnabled !== false);
  });
}

function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'asr_parent_link',
      title: '在真实 App Store 中打开',
      contexts: ['link'],
      targetUrlPatterns: ['*://apps.apple.com/*']
    });

    POPULAR_MENU_REGIONS.forEach((region) => {
      chrome.contextMenus.create({
        id: `asr_open_link_${region.code}`,
        parentId: 'asr_parent_link',
        title: `${region.flag} ${region.name}`,
        contexts: ['link']
      });
    });
  });
}

function regionUrl(linkUrl, code) {
  const url = new URL(linkUrl);
  const idMatch = url.pathname.match(/\/id(\d+)/i);
  if (idMatch) return `https://apps.apple.com/${code}/app/id${idMatch[1]}`;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length > 0 && /^[a-z]{2}$/i.test(parts[0])) {
    parts[0] = code;
    return `https://apps.apple.com/${parts.join('/')}${url.search}${url.hash}`;
  }
  return `https://apps.apple.com/${code}${url.pathname}${url.search}${url.hash}`;
}

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
  syncProxySetting();
});

chrome.runtime.onStartup.addListener(() => {
  setupContextMenus();
  syncProxySetting();
});

syncProxySetting();
setupContextMenus();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.proxyRoutingEnabled) {
    applyDirectProxy(changes.proxyRoutingEnabled.newValue !== false);
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'GET_PROXY_STATUS') {
    chrome.storage.sync.get(['proxyRoutingEnabled'], (res) => {
      sendResponse({
        enabled: res.proxyRoutingEnabled !== false,
        port: DIRECT_PORT
      });
    });
    return true;
  }
  if (request.action === 'SET_PROXY_STATUS') {
    chrome.storage.sync.set({
      directProxyVersion: 3,
      proxyRoutingEnabled: !!request.enabled,
      proxyPort: DIRECT_PORT
    }, () => {
      applyDirectProxy(!!request.enabled);
      sendResponse({ success: true });
    });
    return true;
  }
  return false;
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (!info.menuItemId.startsWith('asr_open_link_') || !info.linkUrl) return;
  const code = info.menuItemId.replace('asr_open_link_', '');
  chrome.tabs.create({ url: regionUrl(info.linkUrl, code) });
});
