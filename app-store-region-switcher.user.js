// ==UserScript==
// @name         App Store Region Switcher
// @namespace    https://github.com/appstore-region-switcher
// @version      3.1.0
// @description  在真实的 apps.apple.com 上切换商店地区。网址规则与扩展里的 storefront.js 相同。
// @match        https://apps.apple.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  if (window.__APP_STORE_REGION_SWITCHER_INJECTED__) return;
  window.__APP_STORE_REGION_SWITCHER_INJECTED__ = true;

  const regions = [
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

  function currentCountry() {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length > 0 && /^[a-z]{2}$/i.test(parts[0])) return parts[0].toLowerCase();
    return 'cn';
  }

  function buildRegionUrl(code) {
    const url = new URL(location.href);
    const country = String(code || 'us').toLowerCase();
    const idMatch = url.pathname.match(/\/id(\d+)/i);
    if (idMatch) return `https://apps.apple.com/${country}/app/id${idMatch[1]}${url.search}${url.hash}`;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length > 0 && /^[a-z]{2}$/i.test(parts[0])) {
      parts[0] = country;
      return `https://apps.apple.com/${parts.join('/')}${url.search}${url.hash}`;
    }
    const path = url.pathname === '/' ? '' : url.pathname;
    return `https://apps.apple.com/${country}${path}${url.search}${url.hash}`;
  }

  const country = currentCountry();
  const root = document.createElement('div');
  root.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483646;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = `${regions.find((item) => item.code === country)?.flag || '🌐'} ${country.toUpperCase()}`;
  button.style.cssText = 'border:0;border-radius:999px;padding:8px 14px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.18);cursor:pointer;';
  const menu = document.createElement('div');
  menu.style.cssText = 'display:none;position:absolute;right:0;bottom:42px;width:180px;background:#fff;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.2);padding:8px;';
  regions.forEach((region) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.textContent = `${region.flag} ${region.name}`;
    item.style.cssText = 'display:block;width:100%;text-align:left;border:0;background:transparent;padding:6px 8px;cursor:pointer;';
    item.addEventListener('click', () => {
      location.assign(buildRegionUrl(region.code));
    });
    menu.appendChild(item);
  });
  button.addEventListener('click', () => {
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  });
  root.append(menu, button);
  document.documentElement.appendChild(root);
})();
