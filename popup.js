/**
 * App Store Region Switcher - Popup Controller v2.1
 */

document.addEventListener('DOMContentLoaded', async () => {
  const regions = (typeof APP_STORE_REGIONS !== 'undefined') ? APP_STORE_REGIONS : [];
  const popularCodes = (typeof APP_STORE_POPULAR_CODES !== 'undefined') ? APP_STORE_POPULAR_CODES : ['us', 'cn', 'hk', 'tw', 'jp', 'kr', 'gb', 'sg'];

  const currentRegionBadge = document.getElementById('currentRegionBadge');
  const tabInfo = document.getElementById('tabInfo');
  const popupQuickChips = document.getElementById('popupQuickChips');
  const popupAllRegionsSelect = document.getElementById('popupAllRegionsSelect');
  const popupSwitchTabBtn = document.getElementById('popupSwitchTabBtn');

  const searchRegionSelect = document.getElementById('searchRegionSelect');
  const searchAppInput = document.getElementById('searchAppInput');
  const searchAppBtn = document.getElementById('searchAppBtn');
  const searchLoading = document.getElementById('searchLoading');
  const searchResults = document.getElementById('searchResults');

  const proxyRoutingToggle = document.getElementById('proxyRoutingToggle');
  const proxyPortRow = document.getElementById('proxyPortRow');
  const proxyPortInput = document.getElementById('proxyPortInput');
  const saveProxyPortBtn = document.getElementById('saveProxyPortBtn');
  const copyHostsCmdBtn = document.getElementById('copyHostsCmdBtn');

  const openExploreCenterBtn = document.getElementById('openExploreCenterBtn');
  const openChartsBtn = document.getElementById('openChartsBtn');

  let activeTab = null;
  let activeUrl = null;
  let currentTabInfo = { isAppStore: false, country: 'cn', appId: null };

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0) {
      activeTab = tabs[0];
      if (activeTab.url) {
        activeUrl = new URL(activeTab.url);
        if (activeUrl.hostname === 'apps.apple.com') {
          currentTabInfo.isAppStore = true;
          const parts = activeUrl.pathname.split('/').filter(Boolean);
          if (parts.length > 0 && /^[a-zA-Z]{2}$/.test(parts[0])) {
            currentTabInfo.country = parts[0].toLowerCase();
          }
          const idMatch = activeUrl.pathname.match(/\/id(\d+)/i);
          if (idMatch) {
            currentTabInfo.appId = idMatch[1];
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to get active tab:', err);
  }

  function getRegion(code) {
    if (!code) return { code: '??', name: '未知地区', en: 'Unknown', flag: '🌐' };
    const found = regions.find(r => r.code.toLowerCase() === code.toLowerCase());
    return found || { code: code.toUpperCase(), name: code.toUpperCase(), en: code.toUpperCase(), flag: '🌐' };
  }

  // 下拉填充
  regions.forEach(r => {
    const optSearch = document.createElement('option');
    optSearch.value = r.code;
    optSearch.textContent = `${r.flag} ${r.code.toUpperCase()}`;
    searchRegionSelect.appendChild(optSearch);

    const optAll = document.createElement('option');
    optAll.value = r.code;
    optAll.textContent = `${r.flag} ${r.name} (${r.code.toUpperCase()})`;
    popupAllRegionsSelect.appendChild(optAll);
  });

  searchRegionSelect.value = 'us';

  // 渲染当前页状态
  if (currentTabInfo.isAppStore) {
    const reg = getRegion(currentTabInfo.country);
    currentRegionBadge.textContent = `${reg.flag} ${reg.code.toUpperCase()} · ${reg.name}`;

    if (currentTabInfo.appId) {
      tabInfo.textContent = `检测到 App ID: ${currentTabInfo.appId} (${activeTab.title || 'App 页面'})`;
    } else {
      tabInfo.textContent = `当前处于 App Store 列表或首页 (可在当前页调起探索中心)`;
    }

    popupQuickChips.innerHTML = '';
    popularCodes.forEach(code => {
      const r = getRegion(code);
      const btn = document.createElement('button');
      btn.className = `chip-btn ${currentTabInfo.country === r.code ? 'active' : ''}`;
      btn.innerHTML = `<span>${r.flag}</span><span>${r.code.toUpperCase()}</span>`;
      btn.title = `以 ${r.name} 真实商店查看`;
      btn.addEventListener('click', () => switchTabToRegion(r.code));
      popupQuickChips.appendChild(btn);
    });

    popupSwitchTabBtn.addEventListener('click', () => {
      if (popupAllRegionsSelect.value) {
        switchTabToRegion(popupAllRegionsSelect.value);
      }
    });
  } else {
    currentRegionBadge.textContent = '非 App Store';
    tabInfo.textContent = '当前不在 App Store 网页。您可在上方跨区搜索 App，或打开探索中心。';

    popupQuickChips.innerHTML = '';
    popularCodes.forEach(code => {
      const r = getRegion(code);
      const btn = document.createElement('button');
      btn.className = 'chip-btn';
      btn.innerHTML = `<span>${r.flag}</span><span>${r.code.toUpperCase()}</span>`;
      btn.title = `打开 ${r.name} 探索中心`;
      btn.addEventListener('click', () => {
        chrome.tabs.create({ url: `https://apps.apple.com/${r.code}` });
      });
      popupQuickChips.appendChild(btn);
    });

    popupSwitchTabBtn.textContent = '打开所选商店';
    popupSwitchTabBtn.addEventListener('click', () => {
      const code = popupAllRegionsSelect.value || 'us';
      chrome.tabs.create({ url: `https://apps.apple.com/${code}` });
    });
  }

  // 切换目标地区
  function realStoreUrl(code) {
    if (!activeUrl || !currentTabInfo.isAppStore) {
      return `https://apps.apple.com/${code}/iphone/today`;
    }
    if (currentTabInfo.appId) {
      return `https://apps.apple.com/${code}/app/id${currentTabInfo.appId}`;
    }
    const parts = activeUrl.pathname.split('/').filter(Boolean);
    if (parts.length > 0 && /^[a-zA-Z]{2}$/.test(parts[0])) {
      parts[0] = code;
      return `https://apps.apple.com/${parts.join('/')}${activeUrl.search}${activeUrl.hash}`;
    }
    return `https://apps.apple.com/${code}${activeUrl.pathname}${activeUrl.search}${activeUrl.hash}`;
  }

  function switchTabToRegion(targetCode) {
    const code = targetCode.toLowerCase();
    const targetUrl = realStoreUrl(code);
    if (currentTabInfo.isAppStore && activeTab) {
      chrome.tabs.update(activeTab.id, { url: targetUrl });
    } else {
      chrome.tabs.create({ url: targetUrl });
    }
    window.close();
  }

  // 跨区实时搜索 App
  async function searchAppStore() {
    const query = searchAppInput.value.trim();
    const region = searchRegionSelect.value || 'us';

    if (!query) return;

    searchLoading.classList.remove('hidden');
    searchResults.classList.add('hidden');
    searchResults.innerHTML = '';

    try {
      const isPureId = /^\d+$/.test(query);
      const apiUrl = isPureId
        ? `https://itunes.apple.com/lookup?id=${encodeURIComponent(query)}&country=${region}`
        : `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=${region}&entity=software&limit=6`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      searchLoading.classList.add('hidden');
      searchResults.classList.remove('hidden');

      if (!data.results || data.results.length === 0) {
        searchResults.innerHTML = `<div class="search-loading">在 ${region.toUpperCase()} 商店中未检索到相关 App</div>`;
        return;
      }

      data.results.forEach(app => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
          <img class="app-icon" src="${app.artworkUrl60 || ''}" alt="icon" />
          <div class="app-meta">
            <div class="app-name" title="${app.trackName}">${app.trackName}</div>
            <div class="app-sub">${app.artistName || ''} · ${app.formattedPrice || '免费'} · ⭐ ${app.averageUserRating ? app.averageUserRating.toFixed(1) : '-'}</div>
          </div>
          <span class="app-open-badge">查看 ↗</span>
        `;
        item.addEventListener('click', () => {
          const appUrl = `https://apps.apple.com/${region}/app/id${app.trackId}`;
          if (currentTabInfo.isAppStore && activeTab) {
            chrome.tabs.update(activeTab.id, { url: appUrl });
          } else {
            chrome.tabs.create({ url: appUrl });
          }
          window.close();
        });
        searchResults.appendChild(item);
      });
    } catch (err) {
      searchLoading.classList.add('hidden');
      searchResults.classList.remove('hidden');
      searchResults.innerHTML = `<div class="search-loading">检索请求异常，请检查网络连接</div>`;
    }
  }

  searchAppBtn.addEventListener('click', searchAppStore);
  searchAppInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchAppStore();
  });

  // 读取并设置代理分流状态
  chrome.runtime.sendMessage({ action: 'GET_PROXY_STATUS' }, (res) => {
    if (res) {
      proxyRoutingToggle.checked = !!res.enabled;
      proxyPortInput.value = res.port || 17890;
      if (res.enabled) {
        proxyPortRow.classList.remove('hidden');
      }
    }
  });

  proxyRoutingToggle.addEventListener('change', () => {
    const isChecked = proxyRoutingToggle.checked;
    proxyPortRow.classList.toggle('hidden', !isChecked);
    const port = parseInt(proxyPortInput.value, 10) || 17890;
    chrome.runtime.sendMessage({
      action: 'SET_PROXY_STATUS',
      enabled: isChecked,
      port: port
    });
  });

  saveProxyPortBtn.addEventListener('click', () => {
    const port = parseInt(proxyPortInput.value, 10) || 17890;
    chrome.runtime.sendMessage({
      action: 'SET_PROXY_STATUS',
      enabled: proxyRoutingToggle.checked,
      port: port
    }, () => {
      saveProxyPortBtn.textContent = '已保存';
      setTimeout(() => saveProxyPortBtn.textContent = '保存', 1500);
    });
  });

  // 复制 Hosts 命令
  copyHostsCmdBtn.addEventListener('click', () => {
    const cmd = `sudo sh -c 'echo "151.101.3.6 apps.apple.com" >> /etc/hosts'`;
    navigator.clipboard.writeText(cmd).then(() => {
      copyHostsCmdBtn.textContent = '✓ 已复制';
      setTimeout(() => copyHostsCmdBtn.textContent = '复制命令', 1500);
    });
  });

  // 快速切换到美区官方页面
  openExploreCenterBtn.addEventListener('click', () => {
    const url = 'https://apps.apple.com/us/iphone/today';
    if (activeTab) chrome.tabs.update(activeTab.id, { url });
    else chrome.tabs.create({ url });
    window.close();
  });

  openChartsBtn.addEventListener('click', () => {
    const code = searchRegionSelect.value || 'us';
    chrome.tabs.create({ url: `https://apps.apple.com/${code}/charts/iphone` });
  });
});
