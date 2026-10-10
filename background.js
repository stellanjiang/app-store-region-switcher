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

const LINK_ALARM = 'asr-link';

function forwarderReady() {
  return fetch(`http://127.0.0.1:${DIRECT_PORT}/health`, { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => !!(data && data.ok))
    .catch(() => false);
}

function syncLink(nextMode) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['directProxyVersion', 'proxyRoutingEnabled', 'linkMode'], async (res) => {
      let mode = nextMode || res.linkMode;
      if (!mode) {
        mode = res.directProxyVersion != null && res.proxyRoutingEnabled === false ? 'off' : 'auto';
      }
      const ready = await forwarderReady();
      const enabled = mode !== 'off' && ready;
      applyDirectProxy(enabled);
      chrome.storage.sync.set({
        directProxyVersion: 5,
        linkMode: mode,
        proxyRoutingEnabled: enabled,
        proxyPort: DIRECT_PORT
      }, () => resolve({ enabled, ready, linkMode: mode, port: DIRECT_PORT }));
    });
  });
}

function scheduleLinkCheck() {
  if (!chrome.alarms) return;
  chrome.alarms.create(LINK_ALARM, { periodInMinutes: 1 });
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
  scheduleLinkCheck();
  syncLink();
});

chrome.runtime.onStartup.addListener(() => {
  setupContextMenus();
  scheduleLinkCheck();
  syncLink();
});

if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === LINK_ALARM) syncLink();
  });
}

scheduleLinkCheck();
syncLink();
setupContextMenus();

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'GET_PROXY_STATUS') {
    syncLink().then(sendResponse);
    return true;
  }
  if (request.action === 'SET_PROXY_STATUS') {
    syncLink(request.enabled ? 'auto' : 'off').then(sendResponse);
    return true;
  }
  return false;
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (!info.menuItemId.startsWith('asr_open_link_') || !info.linkUrl) return;
  const code = info.menuItemId.replace('asr_open_link_', '');
  chrome.tabs.create({ url: regionUrl(info.linkUrl, code) });
});
