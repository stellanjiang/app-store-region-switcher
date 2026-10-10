document.addEventListener('DOMContentLoaded', async () => {
  const regions = (typeof APP_STORE_REGIONS !== 'undefined') ? APP_STORE_REGIONS : [];
  const popularCodes = (typeof APP_STORE_POPULAR_CODES !== 'undefined')
    ? APP_STORE_POPULAR_CODES
    : ['us', 'cn', 'hk', 'tw', 'jp', 'kr', 'gb', 'sg'];

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
  const linkStatus = document.getElementById('linkStatus');
  const proxyRoutingToggle = document.getElementById('proxyRoutingToggle');
  const copyHostsCmdBtn = document.getElementById('copyHostsCmdBtn');
  const openTodayBtn = document.getElementById('openTodayBtn');
  const openChartsBtn = document.getElementById('openChartsBtn');

  const HOSTS_COMMAND = 'curl -fsSL https://raw.githubusercontent.com/stellanjiang/app-store-region-switcher/main/install.sh | bash';

  let activeTab = null;
  let activeUrl = null;
  let forwarderReady = false;
  let currentTabInfo = { isAppStore: false, country: '', appId: '' };

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0) {
      activeTab = tabs[0];
      if (activeTab.url) {
        activeUrl = new URL(activeTab.url);
        if (activeUrl.hostname === 'apps.apple.com') {
          currentTabInfo.isAppStore = true;
          currentTabInfo.country = pageCountry(activeUrl.pathname);
          currentTabInfo.appId = appIdFromPath(activeUrl.pathname);
        }
      }
    }
  } catch (err) {
    console.error('Failed to get active tab:', err);
  }

  function getRegion(code) {
    if (typeof getAppStoreRegion === 'function') return getAppStoreRegion(code);
    return regions.find((item) => item.code === code) || { code, name: String(code || '').toUpperCase(), flag: '🌐' };
  }

  function selectedCode() {
    return (popupAllRegionsSelect.value || searchRegionSelect.value || currentTabInfo.country || 'us').toLowerCase();
  }

  function openStore(url) {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;
    if (activeTab) chrome.tabs.update(activeTab.id, { url });
    else chrome.tabs.create({ url });
    window.close();
  }

  regions.forEach((region) => {
    const searchOption = document.createElement('option');
    searchOption.value = region.code;
    searchOption.textContent = `${region.flag} ${region.code.toUpperCase()}`;
    searchRegionSelect.appendChild(searchOption);

    const allOption = document.createElement('option');
    allOption.value = region.code;
    allOption.textContent = `${region.flag} ${region.name}`;
    popupAllRegionsSelect.appendChild(allOption);
  });

  const initialCode = currentTabInfo.country || 'us';
  searchRegionSelect.value = initialCode;
  popupAllRegionsSelect.value = initialCode;

  function renderCurrentPage() {
    if (currentTabInfo.isAppStore) {
      const region = getRegion(currentTabInfo.country || 'us');
      currentRegionBadge.textContent = currentTabInfo.country
        ? `${region.flag} ${region.code.toUpperCase()} · ${region.name}`
        : '未识别地区';
      tabInfo.textContent = currentTabInfo.appId
        ? `这个 App：id${currentTabInfo.appId}`
        : '当前是列表或首页，切换后仍留在同类页面。';
      popupSwitchTabBtn.textContent = '切换';
      return;
    }
    currentRegionBadge.textContent = '非 App Store';
    tabInfo.textContent = '当前不在苹果官网。选择地区后会打开该区页面。';
    popupSwitchTabBtn.textContent = '打开';
  }

  function renderChips() {
    popupQuickChips.replaceChildren();
    popularCodes.forEach((code) => {
      const region = getRegion(code);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `chip-btn${currentTabInfo.country === code ? ' active' : ''}`;
      button.innerHTML = `<span>${region.flag}</span><span>${region.code.toUpperCase()}</span>`;
      button.title = region.name;
      button.addEventListener('click', () => {
        searchRegionSelect.value = code;
        popupAllRegionsSelect.value = code;
        openStore(targetUrl(code));
      });
      popupQuickChips.appendChild(button);
    });
  }

  function targetUrl(code) {
    if (currentTabInfo.isAppStore && activeUrl) return buildStoreUrl(activeUrl.href, code);
    return storePage(code, 'iphone/today');
  }

  renderCurrentPage();
  renderChips();

  popupSwitchTabBtn.addEventListener('click', () => {
    const code = selectedCode();
    searchRegionSelect.value = code;
    openStore(targetUrl(code));
  });

  popupAllRegionsSelect.addEventListener('change', () => {
    if (popupAllRegionsSelect.value) searchRegionSelect.value = popupAllRegionsSelect.value;
  });

  searchRegionSelect.addEventListener('change', () => {
    popupAllRegionsSelect.value = searchRegionSelect.value;
  });

  async function searchAppStore() {
    const query = searchAppInput.value.trim();
    const region = searchRegionSelect.value || 'us';
    if (!query) return;

    searchLoading.classList.remove('hidden');
    searchResults.classList.add('hidden');
    searchResults.replaceChildren();

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
        searchResults.textContent = `在 ${region.toUpperCase()} 商店中没有找到`;
        return;
      }

      data.results.forEach((app) => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        const icon = document.createElement('img');
        icon.className = 'app-icon';
        icon.alt = '';
        if (typeof app.artworkUrl60 === 'string' && app.artworkUrl60.startsWith('https://')) icon.src = app.artworkUrl60;
        const meta = document.createElement('div');
        meta.className = 'app-meta';
        const name = document.createElement('div');
        name.className = 'app-name';
        name.textContent = app.trackName || 'App';
        const sub = document.createElement('div');
        sub.className = 'app-sub';
        const rating = app.averageUserRating ? app.averageUserRating.toFixed(1) : '-';
        sub.textContent = `${app.artistName || ''} · ${app.formattedPrice || '免费'} · ⭐ ${rating}`;
        meta.append(name, sub);
        const badge = document.createElement('span');
        badge.className = 'app-open-badge';
        badge.textContent = '查看';
        item.append(icon, meta, badge);
        item.addEventListener('click', () => {
          openStore(`https://apps.apple.com/${region}/app/id${app.trackId}`);
        });
        searchResults.appendChild(item);
      });
    } catch (err) {
      searchLoading.classList.add('hidden');
      searchResults.classList.remove('hidden');
      searchResults.textContent = '检索失败，请检查网络';
    }
  }

  searchAppBtn.addEventListener('click', searchAppStore);
  searchAppInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') searchAppStore();
  });

  function renderLink(enabled) {
    proxyRoutingToggle.checked = !!enabled;
    document.getElementById('linkHelp').classList.toggle('hidden', forwarderReady);
    if (forwarderReady && enabled) {
      linkStatus.textContent = '已在后台运行。打开官网即可切换地区，其它网站不变。';
      return;
    }
    if (forwarderReady) {
      linkStatus.textContent = '后台程序已运行。打开开关后，Chrome 会用它打开苹果官网。';
      return;
    }
    linkStatus.textContent = '国外直接打开即可。中国大陆先运行下面这一条，开不开代理都可以。';
  }

  async function probeForwarder() {
    try {
      const response = await fetch('http://127.0.0.1:17890/health', { cache: 'no-store' });
      if (!response.ok) return false;
      const data = await response.json();
      return !!data.ok;
    } catch {
      return false;
    }
  }

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'GET_PROXY_STATUS' }, (res) => {
      forwarderReady = !!(res && res.ready);
      renderLink(!!(res && res.enabled));
    });
  } else {
    forwarderReady = await probeForwarder();
    renderLink(false);
  }

  proxyRoutingToggle.addEventListener('change', () => {
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      proxyRoutingToggle.checked = false;
      renderLink(false);
      return;
    }
    chrome.runtime.sendMessage({
      action: 'SET_PROXY_STATUS',
      enabled: proxyRoutingToggle.checked
    }, (res) => {
      forwarderReady = !!(res && res.ready);
      renderLink(!!(res && res.enabled));
    });
  });

  copyHostsCmdBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(HOSTS_COMMAND).then(() => {
      copyHostsCmdBtn.textContent = '已复制';
      setTimeout(() => {
        copyHostsCmdBtn.textContent = '复制命令';
      }, 1500);
    });
  });

  openTodayBtn.addEventListener('click', () => {
    openStore(storePage(searchRegionSelect.value || 'us', 'iphone/today'));
  });

  openChartsBtn.addEventListener('click', () => {
    openStore(storePage(searchRegionSelect.value || 'us', 'charts/iphone'));
  });
});
