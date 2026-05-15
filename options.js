function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["requestLoggerSettings"], (result) => {
      const settings = result.requestLoggerSettings || { enabled: true, rules: [] };
      resolve(settings);
    });
  });
}

function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ requestLoggerSettings: settings }, () => {
      resolve();
    });
  });
}

function showMessage(text) {
  const message = document.getElementById("message");
  message.textContent = text;
  setTimeout(() => {
    message.textContent = "";
  }, 1600);
}

function createRuleRow(rule, onChange, onDelete) {
  const tr = document.createElement("tr");

  const enabledTd = document.createElement("td");
  const enabled = document.createElement("input");
  enabled.type = "checkbox";
  enabled.checked = Boolean(rule.enabled);
  enabled.addEventListener("change", () => onChange({ ...rule, enabled: enabled.checked }));
  enabledTd.appendChild(enabled);

  const typeTd = document.createElement("td");
  typeTd.textContent = rule.type;

  const patternTd = document.createElement("td");
  patternTd.textContent = rule.pattern;

  const actionTd = document.createElement("td");
  const del = document.createElement("button");
  del.textContent = "删除";
  del.addEventListener("click", () => onDelete(rule.id));
  actionTd.appendChild(del);

  tr.append(enabledTd, typeTd, patternTd, actionTd);
  return tr;
}

async function render() {
  const settings = await loadSettings();
  const tbody = document.getElementById("rulesBody");
  tbody.innerHTML = "";

  document.getElementById("enabled").checked = Boolean(settings.enabled);

  for (const rule of settings.rules) {
    const row = createRuleRow(
      rule,
      async (updatedRule) => {
        const next = await loadSettings();
        next.rules = next.rules.map((r) => (r.id === updatedRule.id ? updatedRule : r));
        await saveSettings(next);
        await render();
      },
      async (ruleId) => {
        const next = await loadSettings();
        next.rules = next.rules.filter((r) => r.id !== ruleId);
        await saveSettings(next);
        await render();
      }
    );
    tbody.appendChild(row);
  }
}

document.getElementById("saveToggle").addEventListener("click", async () => {
  const settings = await loadSettings();
  settings.enabled = document.getElementById("enabled").checked;
  await saveSettings(settings);
  showMessage("开关已保存");
});

document.getElementById("addRule").addEventListener("click", async () => {
  const type = document.getElementById("ruleType").value;
  const pattern = document.getElementById("rulePattern").value.trim();

  if (!pattern) {
    showMessage("请输入匹配模式");
    return;
  }

  if (type === "regex") {
    try {
      // eslint-disable-next-line no-new
      new RegExp(pattern);
    } catch (_error) {
      showMessage("正则表达式无效");
      return;
    }
  }

  const settings = await loadSettings();
  settings.rules.push({
    id: crypto.randomUUID(),
    type,
    pattern,
    enabled: true
  });

  await saveSettings(settings);
  document.getElementById("rulePattern").value = "";
  showMessage("规则已添加");
  await render();
});

void render();
