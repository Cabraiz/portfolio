import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import i18n from './i18n';
import labelKeys from './label-keys.json';

const keys = labelKeys as Record<string, string>;
const foldedKeys = new Map(Object.entries(keys).map(([source, key]) => [source.toLocaleLowerCase('pt'), key]));
const patterns = Object.entries(keys).filter(([source]) => source.includes('{{')).map(([source, key]) => {
  const names: string[] = [];
  const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = escaped.replace(/\\\{\\\{(\w+)\\\}\\\}/g, (_, name: string) => {
    names.push(name);
    return '(.+?)';
  });
  return { key, names, expression: new RegExp(`^${expression}$`) };
});

/** Subscribe at the component boundary; data, IDs and layout stay language-neutral. */
export function useLabelLanguage(): void {
  useTranslation();
}

/** Localize presentation strings only. Unknown values (including names) stay intact. */
export function localizeLabel<T extends ReactNode>(value: T): T {
  if (Array.isArray(value)) return value.map(item => localizeLabel(item)) as unknown as T;
  if (typeof value !== 'string') return value;
  if (!i18n.isInitialized) return value;
  const source = value.replace(/\s+/g, ' ').trim();
  let key: string | undefined = keys[source];
  let lowercase = false;
  if (!key && source === source.toLocaleLowerCase('pt')) {
    key = foldedKeys.get(source);
    lowercase = Boolean(key);
  }
  const options: Record<string, string | number> = { defaultValue: source };
  if (!key) {
    for (const pattern of patterns) {
      const match = source.match(pattern.expression);
      if (!match) continue;
      key = pattern.key;
      pattern.names.forEach((name, index) => {
        options[name] = name === 'count' ? Number(match[index + 1]) : localizeLabel(match[index + 1]);
      });
      break;
    }
  }
  if (!key) return value;
  const message = i18n.t(`labels.${key}`, options);
  const translated = lowercase ? message.toLocaleLowerCase(i18n.resolvedLanguage ?? 'pt') : message;
  return `${value.match(/^\s*/)?.[0] ?? ''}${translated}${value.match(/\s*$/)?.[0] ?? ''}` as T;
}
