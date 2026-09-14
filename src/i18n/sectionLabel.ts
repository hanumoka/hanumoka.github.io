import type { Section } from "@/catalog";
import type { UIStrings } from "./types";

/**
 * 구역 화면에 쓰는 이름. 헤더·빵부스러기·분류 축이 여기를 본다.
 *
 * 무엇이 구역인지는 `src/catalog.ts` 가 정하고, 무슨 글자로 보일지는
 * 번역 파일이 정한다. 두 맵을 컴포넌트마다 따로 두면 한쪽만 고치게 된다.
 */
export function sectionLabel(section: Section, t: UIStrings): string {
  const labels: Record<Section, string> = {
    posts: t.nav.posts,
    drafts: t.nav.drafts,
    tree: t.nav.tree,
    tags: t.nav.tags,
    kinds: t.pages.kindsTitle,
    series: t.pages.seriesTitle,
    about: t.nav.about,
    archives: t.nav.archives,
    search: t.nav.search,
  };
  return labels[section];
}
