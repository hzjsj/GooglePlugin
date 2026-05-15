const DEFAULT_SETTINGS = {
  enabled: true,
  rules: [
    {
      id: crypto.randomUUID(),
      type: "includes",
      pattern: "/api/",
      enabled: true
    }
  ]
};

function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["requestLoggerSettings"], (result) => {
      if (chrome.runtime.lastError) {
        console.warn("[Request Filter Logger] Failed to read settings:", chrome.runtime.lastError);
        resolve(DEFAULT_SETTINGS);
        return;
      }

      const settings = result.requestLoggerSettings;
      if (!settings) {
        resolve(DEFAULT_SETTINGS);
        return;
      }

      resolve({
        enabled: typeof settings.enabled === "boolean" ? settings.enabled : true,
        rules: Array.isArray(settings.rules) ? settings.rules : []
      });
    });
  });
}

function matchesRule(url, rule) {
  if (!rule || !rule.enabled || !rule.pattern) {
    return false;
  }

  if (rule.type === "regex") {
    try {
      const regex = new RegExp(rule.pattern);
      return regex.test(url);
    } catch (error) {
      console.warn("[Request Filter Logger] Invalid regex rule:", rule.pattern, error);
      return false;
    }
  }

  return url.includes(rule.pattern);
}

async function shouldLog(details) {
  const settings = await loadSettings();
  if (!settings.enabled) {
    return false;
  }

  const matchedRules = settings.rules.filter((rule) => matchesRule(details.url, rule));
  if (matchedRules.length === 0) {
    return false;
  }

  const payload = {
    time: new Date().toISOString(),
    method: details.method,
    type: details.type,
    tabId: details.tabId,
    requestId: details.requestId,
    url: details.url,
    matchedRules
  };

  console.log("[Request Filter Logger] Matched request:", payload);
  return true;
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await loadSettings();
  chrome.storage.local.set({ requestLoggerSettings: current });
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    void shouldLog(details);
  },
  { urls: ["<all_urls>"] }
);
