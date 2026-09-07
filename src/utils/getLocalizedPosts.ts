import { getCollection } from "astro:content";
import { getEntryLocale, type Locale } from "./locales";

/**
 * 한 언어의 글만 가져온다.
 *
 * ★ 모든 목록·페이지네이션·태그·RSS 가 이것을 지나야 한다. 걸러지지 않으면
 * 영어 목록에 한국어 글이 섞이고, 그 글의 링크는 `/en/posts/…` 를 가리키는데
 * 그 라우트는 만들어지지 않아 404 가 된다.
 */
export async function getLocalizedPosts(
  locale: Locale,
  options: { includeDrafts?: boolean } = {}
) {
  return getCollection(
    "posts",
    ({ id, data }) =>
      getEntryLocale(id) === locale && (options.includeDrafts || !data.draft)
  );
}
