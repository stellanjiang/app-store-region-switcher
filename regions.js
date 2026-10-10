/**
 * App Store 全球主要国家/地区、货币、StoreFront ID 映射库
 */

const POPULAR_REGION_CODES = [
  'us', 'cn', 'hk', 'tw', 'jp', 'kr', 'gb', 'sg', 'de', 'fr', 'ca', 'au'
];

const ALL_REGIONS = [
  // 常用核心亚太与美洲
  { code: 'us', name: '美国', en: 'United States', flag: '🇺🇸', currency: 'USD', storefrontId: '143441' },
  { code: 'cn', name: '中国大陆', en: 'China', flag: '🇨🇳', currency: 'CNY', storefrontId: '143465' },
  { code: 'hk', name: '中国香港', en: 'Hong Kong', flag: '🇭🇰', currency: 'HKD', storefrontId: '143463' },
  { code: 'tw', name: '中国台湾', en: 'Taiwan', flag: '🇹🇼', currency: 'TWD', storefrontId: '143470' },
  { code: 'mo', name: '中国澳门', en: 'Macau', flag: '🇲🇴', currency: 'MOP', storefrontId: '143515' },
  { code: 'jp', name: '日本', en: 'Japan', flag: '🇯🇵', currency: 'JPY', storefrontId: '143462' },
  { code: 'kr', name: '韩国', en: 'South Korea', flag: '🇰🇷', currency: 'KRW', storefrontId: '143466' },
  { code: 'sg', name: '新加坡', en: 'Singapore', flag: '🇸🇬', currency: 'SGD', storefrontId: '143464' },
  { code: 'gb', name: '英国', en: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', storefrontId: '143444' },
  { code: 'de', name: '德国', en: 'Germany', flag: '🇩🇪', currency: 'EUR', storefrontId: '143443' },
  { code: 'fr', name: '法国', en: 'France', flag: '🇫🇷', currency: 'EUR', storefrontId: '143442' },
  { code: 'ca', name: '加拿大', en: 'Canada', flag: '🇨🇦', currency: 'CAD', storefrontId: '143455' },
  { code: 'au', name: '澳大利亚', en: 'Australia', flag: '🇦🇺', currency: 'AUD', storefrontId: '143460' },
  { code: 'my', name: '马来西亚', en: 'Malaysia', flag: '🇲🇾', currency: 'MYR', storefrontId: '143473' },
  { code: 'th', name: '泰国', en: 'Thailand', flag: '🇹🇭', currency: 'THB', storefrontId: '143475' },
  { code: 'vn', name: '越南', en: 'Vietnam', flag: '🇻🇳', currency: 'VND', storefrontId: '143471' },
  { code: 'ph', name: '菲律宾', en: 'Philippines', flag: '🇵🇭', currency: 'PHP', storefrontId: '143474' },
  { code: 'id', name: '印度尼西亚', en: 'Indonesia', flag: '🇮🇩', currency: 'IDR', storefrontId: '143476' },
  { code: 'in', name: '印度', en: 'India', flag: '🇮🇳', currency: 'INR', storefrontId: '143467' },
  { code: 'nz', name: '新西兰', en: 'New Zealand', flag: '🇳🇿', currency: 'NZD', storefrontId: '143461' },

  // 欧洲主要地区
  { code: 'it', name: '意大利', en: 'Italy', flag: '🇮🇹', currency: 'EUR', storefrontId: '143450' },
  { code: 'es', name: '西班牙', en: 'Spain', flag: '🇪🇸', currency: 'EUR', storefrontId: '143454' },
  { code: 'nl', name: '荷兰', en: 'Netherlands', flag: '🇳🇱', currency: 'EUR', storefrontId: '143452' },
  { code: 'ch', name: '瑞士', en: 'Switzerland', flag: '🇨🇭', currency: 'CHF', storefrontId: '143459' },
  { code: 'se', name: '瑞典', en: 'Sweden', flag: '🇸🇪', currency: 'SEK', storefrontId: '143456' },
  { code: 'no', name: '挪威', en: 'Norway', flag: '🇳🇴', currency: 'NOK', storefrontId: '143457' },
  { code: 'dk', name: '丹麦', en: 'Denmark', flag: '🇩🇰', currency: 'DKK', storefrontId: '143458' },
  { code: 'fi', name: '芬兰', en: 'Finland', flag: '🇫🇮', currency: 'EUR', storefrontId: '143447' },
  { code: 'ie', name: '爱尔兰', en: 'Ireland', flag: '🇮🇪', currency: 'EUR', storefrontId: '143449' },
  { code: 'be', name: '比利时', en: 'Belgium', flag: '🇧🇪', currency: 'EUR', storefrontId: '143446' },
  { code: 'at', name: '奥地利', en: 'Austria', flag: '🇦🇹', currency: 'EUR', storefrontId: '143445' },
  { code: 'pt', name: '葡萄牙', en: 'Portugal', flag: '🇵🇹', currency: 'EUR', storefrontId: '143453' },
  { code: 'pl', name: '波兰', en: 'Poland', flag: '🇵🇱', currency: 'PLN', storefrontId: '143478' },
  { code: 'ru', name: '俄罗斯', en: 'Russia', flag: '🇷🇺', currency: 'RUB', storefrontId: '143469' },
  { code: 'tr', name: '土耳其', en: 'Turkey', flag: '🇹🇷', currency: 'TRY', storefrontId: '143480' },
  { code: 'ua', name: '乌克兰', en: 'Ukraine', flag: '🇺🇦', currency: 'USD', storefrontId: '143492' },

  // 美洲主要地区
  { code: 'br', name: '巴西', en: 'Brazil', flag: '🇧🇷', currency: 'BRL', storefrontId: '143503' },
  { code: 'mx', name: '墨西哥', en: 'Mexico', flag: '🇲🇽', currency: 'MXN', storefrontId: '143468' },
  { code: 'ar', name: '阿根廷', en: 'Argentina', flag: '🇦🇷', currency: 'USD', storefrontId: '143505' },
  { code: 'cl', name: '智利', en: 'Chile', flag: '🇨🇱', currency: 'CLP', storefrontId: '143483' },
  { code: 'co', name: '哥伦比亚', en: 'Colombia', flag: '🇨🇴', currency: 'COP', storefrontId: '143501' },

  // 中东与非洲
  { code: 'ae', name: '阿联酋', en: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', storefrontId: '143481' },
  { code: 'sa', name: '沙特阿拉伯', en: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', storefrontId: '143479' },
  { code: 'il', name: '以色列', en: 'Israel', flag: '🇮🇱', currency: 'ILS', storefrontId: '143491' },
  { code: 'za', name: '南非', en: 'South Africa', flag: '🇿🇦', currency: 'ZAR', storefrontId: '143472' },
  { code: 'eg', name: '埃及', en: 'Egypt', flag: '🇪🇬', currency: 'EGP', storefrontId: '143516' }
];

const REGION_MAP = {};
ALL_REGIONS.forEach(r => {
  REGION_MAP[r.code.toLowerCase()] = r;
});

function getRegionByCode(code) {
  if (!code) return { code: '??', name: '未知地区', en: 'Unknown', flag: '🌐', currency: 'USD' };
  return REGION_MAP[code.toLowerCase()] || {
    code: code.toLowerCase(),
    name: code.toUpperCase(),
    en: code.toUpperCase(),
    flag: '🌐',
    currency: 'USD'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ALL_REGIONS, POPULAR_REGION_CODES, REGION_MAP, getRegionByCode };
}
if (typeof globalThis !== 'undefined') {
  globalThis.APP_STORE_REGIONS = ALL_REGIONS;
  globalThis.APP_STORE_POPULAR_CODES = POPULAR_REGION_CODES;
  globalThis.APP_STORE_REGION_MAP = REGION_MAP;
  globalThis.getAppStoreRegion = getRegionByCode;
}
