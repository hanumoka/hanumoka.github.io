import type { UIStrings } from "./types";
import { DEFAULT_LOCALE } from "@/utils/locales";

export { tplStr } from "./format";

const modules = import.meta.glob<{ default: UIStrings }>("./lang/*.ts", {
  eager: true,
});

const translations: Record<string, UIStrings> = {};
for (const [path, mod] of Object.entries(modules)) {
  const locale = path.slice("./lang/".length, -".ts".length);
  translations[locale] = mod.default;
}

/**
 * 주어진 언어의 UI 문자열. 모르거나 빈 값이면 기본 언어(한국어)로 떨어진다.
 * 테마 기본값은 영어였는데, 그러면 언어를 못 받은 컴포넌트가 한국어 페이지에
 * 영어 라벨을 섞어 냈다.
 */
export function useTranslations(locale: string = DEFAULT_LOCALE): UIStrings {
  return translations[locale] ?? translations[DEFAULT_LOCALE];
}
