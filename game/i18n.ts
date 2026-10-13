// file: game/i18n.ts
//
// Languages. English is written straight into the code and the story
// script; other languages are dictionaries from the English text to theirs
// (game/content/lang/fi.ts). Anything missing falls back to English.
//
//   t('TANTRUM!!')                        → 'RAIVARI!!' in Finnish
//   tf('{n} RESIGNATIONS!', { n: 4 })     → '4 IRTISANOUTUMISTA!'

import { FI } from './content/lang/fi';

export type Lang = 'en' | 'fi';
export const LANGS: { id: Lang; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'fi', name: 'Suomi' },
];

const DICTS: Record<Lang, Record<string, string>> = { en: {}, fi: FI };

let lang: Lang = 'en';
const listeners = new Set<() => void>();

export function setLang(l: Lang): void {
  if (l === lang) return;
  lang = l;
  for (const fn of listeners) fn();
}
export function getLang(): Lang { return lang; }
export function subscribeLang(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** The text in the current language (English if there's no translation). */
export function t(en: string): string {
  return DICTS[lang][en] ?? en;
}

/** t() with {placeholders} filled in. */
export function tf(en: string, vars: Record<string, string | number>): string {
  let out = t(en);
  for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}
