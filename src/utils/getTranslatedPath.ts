import { getLocalizedPosts } from "./getLocalizedPosts";
import { getPostSlug } from "./getPostPaths";
import { getUniqueKinds } from "./getUniqueKinds";
import { getUniqueSeries } from "./getUniqueSeries";
import { getUniqueTags } from "./getUniqueTags";
import { hasListingEntries, LISTING_SECTIONS } from "./hasListingEntries";
import type { Locale } from "./locales";
import { postFilter } from "./postFilter";

export type TranslatedPath = {
  /** 언어 접두사가 없는 목적지 경로. 예: `/posts/my-post` */
  path: string;
  /**
   * 같은 내용이 저쪽 언어에 **실제로 빌드되는가.** 거짓이면 위 경로는 대체
   * 목적지다. 참일 때만 hreflang 을 낸다.
   */
  exact: boolean;
};

/** 모든 언어에 늘 있고 내용도 서로 대응하는 최상위 페이지. */
const STATIC_PAGES = new Set(["about", "search"]);

/** `Astro.url.pathname` 은 퍼센트 인코딩돼 있어서 한글 이름과 바로 비교하면 틀린다. */
const decodeSegment = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * 지금 보고 있는 경로에 대응하는 **다른 언어의 경로**를 고른다.
 *
 * ★ 이 함수의 존재 이유는 하나다 — **없는 곳으로 보내지 않기 위해서다.**
 * 글은 언어마다 따로 쓰므로 한쪽에만 있는 글이 정상 상태이고, 태그·종류·연재도
 * 그 언어의 글에서만 모은다. 경로를 그대로 바꿔 달면 그런 자리에서 404 가 난다.
 *
 * 대응이 없으면 **그 구역의 목록으로 물러선다.** 구역을 모르면 홈으로 간다.
 *
 * ★ 확실하지 않으면 `exact: false` 로 둔다. 틀린 hreflang 은 없는 것보다 나쁘다 —
 * 2026-09-10 에 한국어 연재 페이지가 없는 영어 주소를 짝이라고 알리고 있었다
 * (연재 분기가 없어 마지막 줄의 "그대로 짝" 처리로 빠졌다).
 *
 * @param from 지금 페이지의 언어. 목록 구역은 **양쪽 모두** 항목이 있어야 짝이다 —
 *   한쪽이 비어 있으면 그 빈 페이지는 짝을 주장하는데 저쪽은 되돌아 가리키지 않는다.
 */
export async function getTranslatedPath(
  currentPath: string,
  target: Locale,
  from?: Locale
): Promise<TranslatedPath> {
  const clean = currentPath.replace(/\/+$/, "") || "/";
  const segments = clean.split("/").filter(Boolean).map(decodeSegment);

  if (segments.length === 0) return { path: "/", exact: true };

  const [section, ...rest] = segments as [string, ...string[]];
  const sectionPath = `/${section}`;

  if (rest.length === 0) {
    if (STATIC_PAGES.has(section)) return { path: sectionPath, exact: true };
    if (LISTING_SECTIONS.has(section)) {
      const exact =
        (await hasListingEntries(section, target)) &&
        (!from || (await hasListingEntries(section, from)));
      return { path: sectionPath, exact };
    }
    // 모르는 최상위 페이지(404 등)는 저쪽 홈으로 보낸다.
    return { path: "/", exact: false };
  }

  const leaf = rest[0]!;
  const posts = (await getLocalizedPosts(target)).filter(postFilter);

  switch (section) {
    case "posts": {
      // 쪽 번호(`/posts/2`)는 저쪽 글 수가 다르면 없다. 목록 첫 쪽으로.
      if (rest.length === 1 && /^\d+$/.test(leaf)) {
        return { path: sectionPath, exact: false };
      }
      const slugs = new Set(
        posts.map(post =>
          getPostSlug(post.id, post.filePath).replace(/^\//, "")
        )
      );
      const slug = rest.join("/");
      return slugs.has(slug)
        ? { path: `/posts/${slug}`, exact: true }
        : { path: sectionPath, exact: false };
    }
    case "tags":
    case "kinds":
    case "series": {
      const terms = new Set<string>(
        section === "tags"
          ? getUniqueTags(posts).map(({ tag }) => tag)
          : section === "kinds"
            ? getUniqueKinds(posts).map(({ kind }) => kind)
            : getUniqueSeries(posts).map(({ series }) => series)
      );
      if (!terms.has(leaf)) return { path: sectionPath, exact: false };
      // `/tags/x/2` 같은 쪽 번호는 저쪽 글 수가 달라 같은 쪽이 없다. 첫 쪽으로.
      return { path: `${sectionPath}/${leaf}`, exact: rest.length === 1 };
    }
    default:
      return { path: "/", exact: false };
  }
}
