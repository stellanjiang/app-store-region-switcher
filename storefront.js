/**
 * 把任意 apps.apple.com 地址改成指定商店地区。
 * 扩展页面、弹窗、右键菜单共用这一份。
 */
(function (root) {
  'use strict';

  function normalizeCode(code) {
    return String(code || 'us').toLowerCase();
  }

  function pageCountry(pathname) {
    const parts = String(pathname || '').split('/').filter(Boolean);
    if (parts.length > 0 && /^[a-z]{2}$/i.test(parts[0])) return parts[0].toLowerCase();
    return '';
  }

  function appIdFromPath(pathname) {
    const match = String(pathname || '').match(/\/id(\d+)/i);
    return match ? match[1] : '';
  }

  function buildStoreUrl(href, code) {
    const url = new URL(href, 'https://apps.apple.com');
    const country = normalizeCode(code);
    const id = appIdFromPath(url.pathname);
    if (id) return `https://apps.apple.com/${country}/app/id${id}${url.search}${url.hash}`;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length > 0 && /^[a-z]{2}$/i.test(parts[0])) {
      parts[0] = country;
      return `https://apps.apple.com/${parts.join('/')}${url.search}${url.hash}`;
    }
    const path = url.pathname === '/' ? '' : url.pathname;
    return `https://apps.apple.com/${country}${path}${url.search}${url.hash}`;
  }

  function storePage(code, page) {
    const country = normalizeCode(code);
    const leaf = String(page || 'iphone/today').replace(/^\/+/, '');
    return `https://apps.apple.com/${country}/${leaf}`;
  }

  const api = { pageCountry, appIdFromPath, buildStoreUrl, storePage };
  root.pageCountry = pageCountry;
  root.appIdFromPath = appIdFromPath;
  root.buildStoreUrl = buildStoreUrl;
  root.storePage = storePage;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
