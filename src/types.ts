export type RuleType = 'includes' | 'regex';

export interface RequestRule {
  id: string;
  type: RuleType;
  pattern: string;
  enabled: boolean;
}

export interface RequestLoggerSettings {
  enabled: boolean;
  rules: RequestRule[];
}

export const SETTINGS_KEY = 'requestLoggerSettings';

export const DEFAULT_SETTINGS: RequestLoggerSettings = {
  enabled: true,
  rules: [
    {
      id: crypto.randomUUID(),
      type: 'includes',
      pattern: '/api/',
      enabled: true
    }
  ]
};
