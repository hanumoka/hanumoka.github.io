import type { Locale } from "@/catalog";

/**
 * 연재 목록. 주소·번역 짝이 여기서 나오는 고정 영문 키다.
 *
 * 글 frontmatter 의 `series` 는 표시 이름이 아니라 이 키를 가리킨다.
 * 화면에 보이는 이름은 `labels` 이고, 예전에 쓰이던 한글 주소는
 * `legacySlugs` 로 남겨 넘김 페이지를 만든다.
 */
export const SERIES_KEYS = ["building-this-site", "must-know"] as const;
export type SeriesKey = (typeof SERIES_KEYS)[number];

export const SERIES: Record<
  SeriesKey,
  {
    labels: Record<Locale, string>;
    /** 예전에 공개됐던 슬러그. 기본 언어 주소만 넘긴다. */
    legacySlugs: readonly string[];
  }
> = {
  "building-this-site": {
    labels: { ko: "이 사이트 만들기", en: "Building this site" },
    legacySlugs: ["이-사이트-만들기"],
  },
  "must-know": {
    labels: { ko: "반드시 알아야 할 것", en: "Things you must know" },
    legacySlugs: [],
  },
};

export function isSeriesKey(value: string): value is SeriesKey {
  return SERIES_KEYS.some(key => key === value);
}

export function seriesLabel(key: SeriesKey, locale: Locale): string {
  return SERIES[key].labels[locale];
}
