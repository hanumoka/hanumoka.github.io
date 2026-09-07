import { getLocalizedPosts } from "./getLocalizedPosts";
import { getPostSlug } from "./getPostPaths";
import { getUniqueTags } from "./getUniqueTags";
import { getUniqueKinds } from "./getUniqueKinds";
import type { Locale } from "./locales";

export type TranslatedPath = {
  /** 언어 접두사가 없는 목적지 경로. 예: `/posts/my-post` */
  path: string;
  /** 같은 내용이 저쪽 언어에 있는가. 없으면 위 경로는 대체 목적지다. */
  exact: boolean;
};

/**
 * 지금 보고 있는 경로에 대응하는 **다른 언어의 경로**를 고른다.
 *
 * ★ 이 함수의 존재 이유는 하나다 — **없는 곳으로 보내지 않기 위해서다.**
 * 글은 언어마다 따로 쓰므로 한쪽에만 있는 글이 정상 상태이고, 태그와 종류도
 * 그 언어의 글에서만 모은다. 경로를 그대로 바꿔 달면 그런 자리에서 404 가 난다.
 *
 * 대응이 없으면 **그 구역의 목록으로 물러선다.** 홈으로 보내지 않는 이유는,
 * 글을 보다 언어를 바꾼 사람이 원하는 것은 홈이 아니라 그 언어의 글 목록이기
 * 때문이다.
 */
export async function getTranslatedPath(
  currentPath: string,
  target: Locale
): Promise<TranslatedPath> {
  const clean = currentPath.replace(/\/+$/, "") || "/";
  const segments = clean.split("/").filter(Boolean);

  // 최상위 페이지(`/`, `/about`, `/posts`, `/tags` …)는 언제나 양쪽에 있다.
  if (segments.length <= 1) {
    return { path: clean, exact: true };
  }

  const [section, ...rest] = segments;
  const leaf = rest[0]!;
  const sectionPath = `/${section}`;

  // 페이지네이션(`/posts/2`)은 저쪽 글 수가 다르면 존재하지 않는다.
  // 목록 첫 장으로 보내는 것이 언제나 옳다.
  if (/^\d+$/.test(leaf)) {
    return { path: sectionPath, exact: false };
  }

  const posts = await getLocalizedPosts(target, { includeDrafts: true });

  if (section === "posts") {
    const slugs = new Set(
      posts.map(post => getPostSlug(post.id, post.filePath).replace(/^\//, ""))
    );
    const slug = rest.join("/");
    return slugs.has(slug)
      ? { path: `/posts/${slug}`, exact: true }
      : { path: sectionPath, exact: false };
  }

  if (section === "tags") {
    const tags = new Set<string>(getUniqueTags(posts).map(({ tag }) => tag));
    return tags.has(leaf)
      ? { path: `/tags/${leaf}`, exact: true }
      : { path: sectionPath, exact: false };
  }

  if (section === "kinds") {
    const kinds = new Set<string>(
      getUniqueKinds(posts).map(({ kind }) => kind)
    );
    return kinds.has(leaf)
      ? { path: `/kinds/${leaf}`, exact: true }
      : { path: sectionPath, exact: false };
  }

  return { path: clean, exact: true };
}
