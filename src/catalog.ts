/**
 * 사이트 구조의 정본. 언어·종류·구역 목록은 여기만 적는다.
 *
 * 라우팅(`astro.config.ts`), 콘텐츠 스키마, 헤더, 빵부스러기, 언어 전환이
 * 여기를 본다. 같은 목록을 여러 곳에 적으면 하나를 고치고 나머지를 잊는다.
 */

export const LOCALES = ["ko", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ko";

/**
 * 글의 종류. 값은 비공개 문서 허브의 `kind` 계약과 같아야 하므로 영문이다.
 * 화면에 보이는 이름만 번역 파일이 옮긴다.
 *
 * 선언 순서가 목록의 순서다. 빈도로 정렬하면 글이 늘 때마다 자리가 바뀐다.
 */
export const KINDS = [
  "til",
  "troubleshooting",
  "concept",
  "snippet",
  "agent-issue",
] as const;
export type Kind = (typeof KINDS)[number];

/**
 * 사이트의 최상위 구역. 주소를 더할 때 여기부터 적는다.
 *
 * `home` 은 루트라 구역이 아니다. 이력처럼 페이지 컬렉션에서만 나오는
 * 주소는 파일을 두는 순간 생기므로 여기 미리 적지 않는다.
 */
export const SECTIONS = [
  "posts",
  "drafts",
  "tree",
  "tags",
  "kinds",
  "series",
  "about",
  "archives",
  "search",
] as const;
export type Section = (typeof SECTIONS)[number];

/** 글에서 모아 만드는 목록. 그 언어에 항목이 없으면 빈 페이지가 된다. */
export const LISTING_SECTIONS = [
  "posts",
  "archives",
  "tree",
  "tags",
  "kinds",
  "series",
  "drafts",
] as const satisfies readonly Section[];
export type ListingSection = (typeof LISTING_SECTIONS)[number];

/** 모든 언어에 늘 있고 내용도 서로 대응하는 최상위 페이지. */
export const STATIC_PAGES = [
  "about",
  "search",
] as const satisfies readonly Section[];
export type StaticPage = (typeof STATIC_PAGES)[number];

/** 항마다 하위 페이지가 있는 분류 축. */
export const TAXONOMIES = [
  "tags",
  "kinds",
  "series",
] as const satisfies readonly Section[];
export type Taxonomy = (typeof TAXONOMIES)[number];

/** 분류 페이지 아래 「이렇게도 볼 수 있습니다」에 나열하는 축. */
export const BROWSE_AXES = [
  "tags",
  "kinds",
  "series",
  "tree",
] as const satisfies readonly Section[];
export type BrowseAxis = (typeof BROWSE_AXES)[number];

/**
 * 헤더에 보이는 순서. 화면 모양(글자 vs 아이콘)은 헤더가 정하고,
 * 무엇이 헤더에 있는지는 여기가 정한다.
 */
export const HEADER_NAV = [
  { section: "posts", appearance: "text" },
  { section: "drafts", appearance: "text" },
  { section: "tree", appearance: "text" },
  { section: "tags", appearance: "text" },
  { section: "about", appearance: "text" },
  { section: "archives", appearance: "icon" },
  { section: "search", appearance: "icon" },
] as const satisfies readonly {
  section: Section;
  appearance: "text" | "icon";
}[];

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.some(locale => locale === value);
}

export function isSection(value: string): value is Section {
  return SECTIONS.some(section => section === value);
}

export function isListingSection(value: string): value is ListingSection {
  return LISTING_SECTIONS.some(section => section === value);
}

export function isStaticPage(value: string): value is StaticPage {
  return STATIC_PAGES.some(page => page === value);
}

export function isTaxonomy(value: string): value is Taxonomy {
  return TAXONOMIES.some(taxonomy => taxonomy === value);
}

export function isBrowseAxis(value: string): value is BrowseAxis {
  return BROWSE_AXES.some(axis => axis === value);
}

/** 사이트맵 i18n.locales. 언어 코드가 곧 hreflang 값이다. */
export function sitemapLocales(): Record<string, string> {
  return Object.fromEntries(LOCALES.map(locale => [locale, locale]));
}
