import { getRelativeLocaleUrl } from "astro:i18n";
import { BLOG_PATH } from "@/content.config";
import { slugifyStr } from "./slugify";
import { isLocale } from "./locales";
import config from "@/config";

function getPostPathSegments(filePath: string | undefined): string[] {
  const segments =
    filePath
      ?.replace(BLOG_PATH, "")
      .split("/")
      .filter(path => path !== "")
      .filter(path => !path.startsWith("_"))
      .slice(0, -1) ?? [];

  // ★ 첫 조각이 언어면 버린다. 언어는 디렉터리로 나뉘어 있지만
  // (`posts/ko/…`) URL 의 언어 접두사는 Astro 의 i18n 라우팅이 붙이므로,
  // 여기서 남기면 `/en/posts/en/글` 처럼 두 번 붙는다.
  if (isLocale(segments[0])) {
    segments.shift();
  }

  return segments.map(segment => slugifyStr(segment));
}

function getIdSlug(id: string): string {
  const postId = id.split("/");
  return postId.length > 0 ? String(postId[postId.length - 1]) : id;
}

function getPostSlugPath(id: string, filePath: string | undefined): string {
  const pathSegments = getPostPathSegments(filePath);
  const slug = getIdSlug(id);

  // ★ 글을 폴더로 두고 본문을 `index.md` 로 쓰는 형태를 받는다.
  //
  //   posts/ko/2026-09-07-media-test/
  //     index.md
  //     contrast.png
  //
  // 이러면 글과 그 글의 이미지가 한 폴더에 있어 **글 단위로 관리되고**,
  // 본문에서 `./contrast.png` 로 부르므로 **VS Code 미리보기에서도 그대로
  // 보인다**(상대 경로를 파일 위치 기준으로 풀기 때문이다).
  //
  // ★ 판정은 **파일 이름**으로 한다. `id` 를 보면 안 된다 — Astro 의 glob
  // 로더가 `…/index.md` 의 id 에서 `/index` 를 이미 떼기 때문에, id 의 마지막
  // 조각이 폴더 이름과 같아져 주소가 `/posts/글/글` 로 겹친다. 실제로 그랬다.
  if (/(^|\/)index\.mdx?$/.test(filePath ?? "") && pathSegments.length > 0) {
    return pathSegments.join("/");
  }

  return pathSegments.length > 0
    ? [...pathSegments, slug].join("/")
    : String(slug);
}

/**
 * Returns the slug-only path for use as a route param in `getStaticPaths`.
 * No base prefix, no locale — Astro handles those at a higher level.
 * e.g. `/examples/my-post`
 */
export function getPostSlug(id: string, filePath: string | undefined): string {
  return `/${getPostSlugPath(id, filePath)}`;
}

/**
 * Returns a fully navigable URL for use in `<a href>` and RSS links.
 * Applies both locale routing and the configured Astro base via
 * `getRelativeLocaleUrl`.
 * e.g. `/posts/my-post` or `/en/posts/my-post`
 */
export function getPostUrl(
  id: string,
  filePath: string | undefined,
  locale: string | undefined = config.site.lang
): string {
  return getRelativeLocaleUrl(locale, `posts/${getPostSlugPath(id, filePath)}`);
}
