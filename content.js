/**
 * 只负责在真实的 apps.apple.com 上切换 URL 地区。
 * 页面内容由苹果官网返回，不替换成自绘页面。
 */
(function () {
  'use strict';

  if (window.__APP_STORE_REGION_SWITCHER_INJECTED__) return;
  window.__APP_STORE_REGION_SWITCHER_INJECTED__ = true;

  const regions = (typeof APP_STORE_REGIONS !== 'undefined') ? APP_STORE_REGIONS : [
    { code: 'us', name: '美国', flag: '🇺🇸' },
    { code: 'cn', name: '中国大陆', flag: '🇨🇳' },
    { code: 'hk', name: '中国香港', flag: '🇭🇰' },
    { code: 'tw', name: '中国台湾', flag: '🇹🇼' },
    { code: 'jp', name: '日本', flag: '🇯🇵' },
    { code: 'kr', name: '韩国', flag: '🇰🇷' },
    { code: 'gb', name: '英国', flag: '🇬🇧' },
    { code: 'sg', name: '新加坡', flag: '🇸🇬' },
    { code: 'de', name: '德国', flag: '🇩🇪' },
    { code: 'fr', name: '法国', flag: '🇫🇷' },
    { code: 'ca', name: '加拿大', flag: '🇨🇦' },
    { code: 'au', name: '澳大利亚', flag: '🇦🇺' }
  ];

  const popularCodes = (typeof APP_STORE_POPULAR_CODES !== 'undefined')
    ? APP_STORE_POPULAR_CODES
    : ['us', 'cn', 'hk', 'tw', 'jp', 'kr', 'gb', 'sg', 'de', 'fr', 'ca', 'au'];

  function getRegion(code) {
    return regions.find((item) => item.code === code) || {
      code: (code || 'us').toUpperCase(),
      name: (code || 'us').toUpperCase(),
      flag: '🌐'
    };
  }

  function currentCountry() {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length > 0 && /^[a-z]{2}$/i.test(parts[0])) return parts[0].toLowerCase();
    return 'cn';
  }

  function buildRegionUrl(code) {
    const url = new URL(location.href);
    const parts = url.pathname.split('/').filter(Boolean);
    const idMatch = url.pathname.match(/\/id(\d+)/i);
    if (idMatch) {
      return `https://apps.apple.com/${code}/app/id${idMatch[1]}${url.search}${url.hash}`;
    }
    if (parts.length > 0 && /^[a-z]{2}$/i.test(parts[0])) {
      parts[0] = code;
      return `https://apps.apple.com/${parts.join('/')}${url.search}${url.hash}`;
    }
    const path = url.pathname === '/' ? '' : url.pathname;
    return `https://apps.apple.com/${code}${path}${url.search}${url.hash}`;
  }

  function go(code) {
    const next = buildRegionUrl(code);
    if (next === location.href) return;
    location.assign(next);
  }

  const style = document.createElement('style');
  style.textContent = `
    #asr-root-pill { position: fixed; right: 20px; bottom: 20px; z-index: 2147483646; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; }
    #asr-pill-btn { display: inline-flex; align-items: center; gap: 8px; border: 0; border-radius: 999px; padding: 8px 14px; background: rgba(255,255,255,.94); color: #1d1d1f; box-shadow: 0 8px 24px rgba(0,0,0,.18); cursor: pointer; font-size: 13px; font-weight: 650; }
    #asr-menu { position: absolute; right: 0; bottom: 48px; width: 280px; max-height: 420px; overflow: auto; background: #fff; color: #1d1d1f; border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,.22); padding: 10px; }
    #asr-menu.hidden { display: none; }
    #asr-menu input { width: 100%; box-sizing: border-box; border: 1px solid #d2d2d7; border-radius: 8px; padding: 7px 8px; margin-bottom: 8px; }
    .asr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px; }
    .asr-chip, .asr-item { border: 0; background: #f5f5f7; border-radius: 8px; cursor: pointer; color: inherit; }
    .asr-chip { padding: 6px 2px; font-size: 12px; }
    .asr-item { display: flex; width: 100%; justify-content: space-between; padding: 7px 8px; margin-top: 4px; text-align: left; font-size: 13px; }
    .asr-chip.active, .asr-item.active { background: #0071e3; color: #fff; }
    @media (prefers-color-scheme: dark) {
      #asr-pill-btn, #asr-menu { background: #1c1c1e; color: #f5f5f7; }
      #asr-menu input, .asr-chip, .asr-item { background: #2c2c2e; color: #f5f5f7; border-color: #3a3a3c; }
    }
  `;
  document.documentElement.appendChild(style);

  const country = currentCountry();
  const region = getRegion(country);
  const root = document.createElement('div');
  root.id = 'asr-root-pill';
  root.innerHTML = `
    <div id="asr-menu" class="hidden">
      <input id="asr-filter" placeholder="搜索地区，例如 日本 / jp" />
      <div class="asr-grid" id="asr-grid"></div>
      <div id="asr-list"></div>
    </div>
    <button id="asr-pill-btn" type="button">
      <span>${region.flag}</span>
      <span>${region.code.toUpperCase()}</span>
      <span>真实商店</span>
    </button>
  `;
  document.documentElement.appendChild(root);

  const menu = root.querySelector('#asr-menu');
  const grid = root.querySelector('#asr-grid');
  const list = root.querySelector('#asr-list');
  const filter = root.querySelector('#asr-filter');

  popularCodes.forEach((code) => {
    const item = getRegion(code);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'asr-chip' + (code === country ? ' active' : '');
    button.textContent = `${item.flag} ${item.code.toUpperCase()}`;
    button.addEventListener('click', () => go(code));
    grid.appendChild(button);
  });

  function renderList(keyword) {
    const query = keyword.trim().toLowerCase();
    list.replaceChildren();
    regions.filter((item) => {
      if (!query) return true;
      return `${item.code} ${item.name} ${item.en || ''}`.toLowerCase().includes(query);
    }).forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'asr-item' + (item.code === country ? ' active' : '');
      button.innerHTML = `<span>${item.flag} ${item.name}</span><span>${item.code.toUpperCase()}</span>`;
      button.addEventListener('click', () => go(item.code));
      list.appendChild(button);
    });
  }

  renderList('');
  filter.addEventListener('input', () => renderList(filter.value));
  root.querySelector('#asr-pill-btn').addEventListener('click', () => {
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden')) filter.focus();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') menu.classList.add('hidden');
  });
})();
