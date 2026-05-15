(() => {
  const ROOT_ID = 'request-filter-logger-root';
  const STATE = {
    open: false,
    logs: [],
    maxLogs: 200
  };

  function ensureRoot() {
    let root = document.getElementById(ROOT_ID);
    if (root) return root;

    root = document.createElement('div');
    root.id = ROOT_ID;
    root.style.position = 'fixed';
    root.style.zIndex = '2147483647';
    root.style.top = '20px';
    root.style.right = '20px';
    root.style.fontFamily = 'Arial, sans-serif';
    document.documentElement.appendChild(root);
    return root;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function render() {
    const root = ensureRoot();
    const logsHtml = STATE.logs
      .map((item) => {
        const rules = item.matchedRules.map((rule) => `${rule.type}:${rule.pattern}`).join(', ');
        return `<div style="border-bottom:1px solid #eee;padding:8px 0;">
          <div style="font-size:12px;color:#666;">${escapeHtml(item.time)} · ${escapeHtml(item.method || '')}</div>
          <div style="font-size:12px;word-break:break-all;">${escapeHtml(item.url)}</div>
          <div style="font-size:12px;color:#0a5;">${escapeHtml(rules)}</div>
        </div>`;
      })
      .join('');

    root.innerHTML = `
      <button id="rfl-toggle-btn" style="background:#1a73e8;color:#fff;border:none;border-radius:16px;padding:8px 12px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);">
        ${STATE.open ? '隐藏请求面板' : '显示请求面板'} (${STATE.logs.length})
      </button>
      <div id="rfl-drawer" style="margin-top:8px;width:420px;max-height:70vh;background:#fff;border:1px solid #ddd;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.2);display:${STATE.open ? 'block' : 'none'};overflow:hidden;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #eee;background:#fafafa;">
          <strong style="font-size:14px;">请求日志</strong>
          <button id="rfl-clear-btn" style="border:1px solid #ddd;background:#fff;border-radius:8px;padding:4px 8px;cursor:pointer;">清空</button>
        </div>
        <div style="padding:0 12px 8px;max-height:58vh;overflow:auto;">${logsHtml || '<p style="color:#888;font-size:12px;">暂无命中请求</p>'}</div>
      </div>
    `;

    root.querySelector('#rfl-toggle-btn')?.addEventListener('click', () => {
      STATE.open = !STATE.open;
      render();
    });
    root.querySelector('#rfl-clear-btn')?.addEventListener('click', () => {
      STATE.logs = [];
      render();
    });
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== 'REQUEST_LOGGER_MATCHED') return;
    STATE.logs.unshift(message.payload);
    if (STATE.logs.length > STATE.maxLogs) {
      STATE.logs = STATE.logs.slice(0, STATE.maxLogs);
    }
    render();
  });

  render();
})();
