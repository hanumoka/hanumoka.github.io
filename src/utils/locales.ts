import { getRelativeLocaleUrl } from "astro:i18n";
import config from "@/config";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/catalog";

export { DEFAULT_LOCALE, isLocale, LOCALES, type Locale };

/** 화면에 보이는 언어 이름. 그 언어를 쓰는 사람이 읽으므로 자기 언어로 적는다. */
export const LOCALE_LABELS: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
};

/** 헤더의 좁은 자리에 쓰는 짧은 표기. */
export const LOCALE_SHORT: Record<Locale, string> = {
  ko: "KO",
  en: "EN",
};

/**
 * 파일을 가리키는 로케일 URL.
 *
 * ★ `getRelativeLocaleUrl` 은 디렉터리 라우트를 전제해 끝에 슬래시를 붙인다.
 * 그대로 쓰면 `/rss.xml/` 이 되는데 그런 경로는 없다 — head 의 RSS 링크가
 * 실제로 그렇게 404 를 가리키고 있었다.
 */
export function getLocaleFileUrl(locale: string, file: string): string {
  return getRelativeLocaleUrl(locale, file).replace(/\/$/, "");
}

/** `Astro.currentLocale`은 string | undefined 라 그대로 쓰면 좁혀지지 않는다. */
export function resolveLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * 로케일마다 라우트를 하나씩 내는 `getStaticPaths` 값.
 *
 * ★ 기본 로케일은 접두사가 없어야 하므로 `lang`을 `undefined`로 낸다 —
 * rest 파라미터(`[...lang]`)라 그 자리가 통째로 사라져 `/` 가 된다.
 */
export function localePaths() {
  return LOCALES.map(locale => ({
    params: { lang: locale === DEFAULT_LOCALE ? undefined : locale },
    props: { locale },
  }));
}

/**
 * 글·페이지의 컬렉션 id 에서 언어를 읽는다. 첫 경로 조각이 언어다
 * (`ko/2026-09-05-site-setup`). **frontmatter 필드로 두지 않은 이유는
 * 적기를 잊을 수 있기 때문이다** — 디렉터리는 잊을 수가 없다.
 */
export function getEntryLocale(id: string): Locale {
  const head = id.split("/")[0];
  return isLocale(head) ? head : DEFAULT_LOCALE;
}

export { config };
