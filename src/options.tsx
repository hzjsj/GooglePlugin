import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { DEFAULT_SETTINGS, SETTINGS_KEY, type RequestLoggerSettings, type RequestRule, type RuleType } from './types';

async function getSettings(): Promise<RequestLoggerSettings> {
  const result = await chrome.storage.local.get([SETTINGS_KEY]);
  return (result[SETTINGS_KEY] as RequestLoggerSettings | undefined) ?? DEFAULT_SETTINGS;
}

async function setSettings(settings: RequestLoggerSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

function App() {
  const [settings, setLocalSettings] = useState<RequestLoggerSettings>(DEFAULT_SETTINGS);
  const [ruleType, setRuleType] = useState<RuleType>('includes');
  const [pattern, setPattern] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void getSettings().then(setLocalSettings);
  }, []);

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 1500);
  };

  const persist = async (next: RequestLoggerSettings, text?: string) => {
    setLocalSettings(next);
    await setSettings(next);
    if (text) showMessage(text);
  };

  const addRule = async () => {
    const value = pattern.trim();
    if (!value) return showMessage('请输入匹配模式');
    if (ruleType === 'regex') {
      try {
        new RegExp(value);
      } catch {
        return showMessage('正则表达式无效');
      }
    }

    await persist(
      {
        ...settings,
        rules: [...settings.rules, { id: crypto.randomUUID(), type: ruleType, pattern: value, enabled: true }]
      },
      '规则已添加'
    );
    setPattern('');
  };

  return (
    <main style={{ fontFamily: 'Arial', margin: '24px', maxWidth: '900px' }}>
      <h1>Request Filter Logger</h1>
      <p>支持 includes 和 regex 规则，命中后会输出到扩展 Service Worker 控制台。</p>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => void persist({ ...settings, enabled: (e.target as HTMLInputElement).checked }, '开关已保存')}
          />
          启用监听
        </label>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <select value={ruleType} onChange={(e) => setRuleType((e.target as HTMLSelectElement).value as RuleType)}>
          <option value="includes">includes</option>
          <option value="regex">regex</option>
        </select>
        <input value={pattern} onInput={(e) => setPattern((e.target as HTMLInputElement).value)} placeholder="例如 /api/order" />
        <button onClick={() => void addRule()}>添加规则</button>
      </div>

      <table style={{ marginTop: '16px', borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>启用</th>
            <th>类型</th>
            <th>模式</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {settings.rules.map((rule: RequestRule) => (
            <tr key={rule.id}>
              <td>
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={(e) => {
                    const enabled = (e.target as HTMLInputElement).checked;
                    const next = { ...settings, rules: settings.rules.map((r) => (r.id === rule.id ? { ...r, enabled } : r)) };
                    void persist(next);
                  }}
                />
              </td>
              <td>{rule.type}</td>
              <td>{rule.pattern}</td>
              <td>
                <button
                  onClick={() => {
                    const next = { ...settings, rules: settings.rules.filter((r) => r.id !== rule.id) };
                    void persist(next, '规则已删除');
                  }}
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{message}</p>
    </main>
  );
}

render(<App />, document.getElementById('app')!);
