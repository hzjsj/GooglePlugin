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

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await loadSettings();
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
});

chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    const settings = await loadSettings();
    if (!settings.enabled) return;

    const payload = {
      time: new Date().toISOString(),
      url: details.url,
      method: details.method,
      type: details.type,
      tabId: details.tabId,
      requestId: details.requestId,
      matchedRules: settings.rules
    };

    console.log('[Request Filter Logger] Captured request:', payload);

    if (details.tabId >= 0) {
      chrome.tabs.sendMessage(details.tabId, {
        type: 'REQUEST_LOGGER_MATCHED',
        payload
      }).catch(() => undefined);
    }
  },
  { urls: ['<all_urls>'] }
);
