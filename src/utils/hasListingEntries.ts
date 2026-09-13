import { getLocalizedPosts } from "./getLocalizedPosts";
import { getUniqueKinds } from "./getUniqueKinds";
import { getUniqueSeries } from "./getUniqueSeries";
import { getUniqueTags } from "./getUniqueTags";
import type { Locale } from "./locales";
import { draftFilter, postFilter } from "./postFilter";

/**
 * 글에서 모아 만드는 목록 구역. 그 언어에 글이 없으면 빈 페이지가 된다.
 *
 * 경로는 언어마다 늘 만들어진다(언어 전환 버튼이 갈 곳이 있어야 하므로).
 * 그래서 "그 페이지가 있는가"가 아니라 "보여 줄 항목이 있는가"를 따로 물어야 한다.
 */
export const LISTING_SECTIONS = new Set([
  "posts",
  "archives",
  "tree",
  "tags",
  "kinds",
  "series",
  "drafts",
]);

/**
 * 그 언어의 정식 글로 태그·종류·연재 **개별** 페이지가 실제로 만들어지는가.
 *
 * ★ 초안 글도 태그·종류를 붙이지만, 목록 라우트는 `postFilter` 를 지난 글에서만
 * 만든다. 초안에만 있는 값으로 `/tags/…`·`/kinds/…` 를 링크하면 404 가 된다.
 */
export async function hasOfficialTerm(
  section: "tags" | "kinds" | "series",
  locale: Locale,
  slug: string
): Promise<boolean> {
  const posts = await getLocalizedPosts(locale);
  switch (section) {
    case "tags":
      return getUniqueTags(posts).some(({ tag }) => tag === slug);
    case "kinds":
      return getUniqueKinds(posts).some(({ kind }) => kind === slug);
    case "series":
      return getUniqueSeries(posts).some(({ series }) => series === slug);
  }
}

/** 그 언어의 목록 구역에 보여 줄 항목이 하나라도 있는가. 초안·예약 글은 세지 않는다. */
export async function hasListingEntries(
  section: string,
  locale: Locale
): Promise<boolean> {
  const posts = (await getLocalizedPosts(locale)).filter(postFilter);
  switch (section) {
    case "tags":
      return getUniqueTags(posts).length > 0;
    case "kinds":
      return getUniqueKinds(posts).length > 0;
    case "series":
      return getUniqueSeries(posts).length > 0;
    case "drafts": {
      const all = await getLocalizedPosts(locale, { includeDrafts: true });
      return all.filter(draftFilter).length > 0;
    }
    default:
      return posts.length > 0;
  }
}
