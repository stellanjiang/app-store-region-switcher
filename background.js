/**
 * 让 Chrome 只把 apps.apple.com 交给本机直连代理。
 * 其它网站保持直连，系统 IP 不变。页面仍是苹果官网。
 */

importScripts('regions.js', 'storefront.js');

const DIRECT_PORT = 17890;
const MENU_CODES = ['us', 'cn', 'hk', 'tw', 'jp', 'kr', 'gb'];

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
    const fresh = res.directProxyVersion == null;
    const enabled = fresh ? false : res.proxyRoutingEnabled === true;
    if (res.directProxyVersion !== 4) {
      chrome.storage.sync.set({
        directProxyVersion: 4,
        proxyRoutingEnabled: enabled,
        proxyPort: DIRECT_PORT
      }, () => applyDirectProxy(enabled));
      return;
    }
    applyDirectProxy(enabled);
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

    MENU_CODES.forEach((code) => {
      const region = getAppStoreRegion(code);
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
  return buildStoreUrl(linkUrl, code);
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
    applyDirectProxy(changes.proxyRoutingEnabled.newValue === true);
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'GET_PROXY_STATUS') {
    chrome.storage.sync.get(['proxyRoutingEnabled'], (res) => {
      sendResponse({
        enabled: res.proxyRoutingEnabled === true,
        port: DIRECT_PORT
      });
    });
    return true;
  }
  if (request.action === 'SET_PROXY_STATUS') {
    chrome.storage.sync.set({
      directProxyVersion: 4,
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
