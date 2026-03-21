import type { Locale, Messages } from "./types.js";
import { en } from "./en.js";
import { ja } from "./ja.js";
import { zh } from "./zh.js";
import { ko } from "./ko.js";

export type { Locale, Messages };

const locales: Record<Locale, Messages> = { en, ja, zh, ko };

export function getMessages(locale: Locale): Messages {
  return locales[locale];
}

export const localeChoices: ReadonlyArray<{ name: string; value: Locale }> = [
  { name: "English", value: "en" },
  { name: "日本語", value: "ja" },
  { name: "中文", value: "zh" },
  { name: "한국어", value: "ko" },
];
