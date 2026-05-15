const SETTINGS_KEY = 'requestLoggerSettings';
const DEFAULT_SETTINGS = {
  enabled: true,
  rules: [{ id: crypto.randomUUID(), type: 'includes', pattern: '/api/', enabled: true }]
};

async function loadSettings() {
  const result = await chrome.storage.local.get([SETTINGS_KEY]);
  const stored = result[SETTINGS_KEY];
  if (!stored) return DEFAULT_SETTINGS;
  return {
    enabled: typeof stored.enabled === 'boolean' ? stored.enabled : true,
    rules: Array.isArray(stored.rules) ? stored.rules : []
  };
}

function matchesRule(url, rule) {
  if (!rule?.enabled || !rule.pattern) return false;
  if (rule.type === 'regex') {
    try {
      return new RegExp(rule.pattern).test(url);
    } catch {
      return false;
    }
  }
  return url.includes(rule.pattern);
}

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await loadSettings();
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
});

chrome.webRequest.onBeforeRequest.addListener(async (details) => {
  const settings = await loadSettings();
  if (!settings.enabled) return;
  const matchedRules = settings.rules.filter((rule) => matchesRule(details.url, rule));
  if (!matchedRules.length) return;

  console.log('[Request Filter Logger] Matched request:', {
    time: new Date().toISOString(),
    url: details.url,
    method: details.method,
    type: details.type,
    tabId: details.tabId,
    requestId: details.requestId,
    matchedRules
  });
}, { urls: ['<all_urls>'] });
