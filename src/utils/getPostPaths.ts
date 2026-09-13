import { getRelativeLocaleUrl } from "astro:i18n";
import type { CollectionEntry } from "astro:content";
import config from "@/config";

/**
 * 글 주소의 유일한 입구. 공개 URL 은 `/posts/{key}/` 이고, 키는
 * frontmatter 의 `key` 다. 폴더 이름에서 파생하지 않는다 — 폴더를 옮겨도
 * 주소·번역 짝·댓글 연결이 같이 깨지지 않게 하려는 것이다.
 *
 * `[...slug]` 라우트 파라미터는 앞에 슬래시를 붙인다. Astro rest 파라미터가
 * 그 형태를 받는다.
 */
export function getPostSlug(key: string): string {
  return `/${key}`;
}

/**
 * `<a href>` 와 RSS 가 쓰는 주소. 언어 접두사와 `base` 를 붙인다.
 * 예: `/posts/2026-09-05-site-setup` 또는 `/en/posts/…`
 */
export function getPostUrl(
  key: string,
  locale: string | undefined = config.site.lang
): string {
  return getRelativeLocaleUrl(locale, `posts/${key}`);
}

/** 한 언어 안에서 키가 겹치면 주소가 덮이므로 빌드를 죽인다. */
export function assertUniquePostKeys(posts: CollectionEntry<"posts">[]): void {
  const seen = new Map<string, string>();
  for (const post of posts) {
    const prev = seen.get(post.data.key);
    if (prev) {
      throw new Error(
        `Duplicate post key "${post.data.key}" in ${prev} and ${post.id}`
      );
    }
    seen.set(post.data.key, post.id);
  }
}
