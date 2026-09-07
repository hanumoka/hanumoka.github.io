import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { slugifyStr } from "./slugify";

type Series = {
  /** URL 에 쓰는 슬러그 */
  series: string;
  /** 화면에 쓰는 원래 이름 */
  seriesName: string;
  /** 그 연재에 속한 글 수 */
  count: number;
};

/**
 * 글 목록에서 연재를 모은다. 태그와 같은 규칙이다 — 슬러그로 중복을 없애고,
 * 표시 이름은 처음 만난 것을 쓴다.
 */
export function getUniqueSeries(posts: CollectionEntry<"posts">[]): Series[] {
  const counts = new Map<string, Series>();

  for (const post of posts.filter(postFilter)) {
    const name = post.data.series;
    if (!name) continue;

    const slug = slugifyStr(name);
    const found = counts.get(slug);
    if (found) {
      found.count += 1;
    } else {
      counts.set(slug, { series: slug, seriesName: name, count: 1 });
    }
  }

  return [...counts.values()].sort((a, b) => a.series.localeCompare(b.series));
}

/**
 * 한 연재의 글을 **읽는 순서대로** 돌려준다.
 *
 * ★ 정렬 축이 발행일이 아니다. `seriesOrder` 가 있으면 그것이 먼저이고,
 * 없는 글은 뒤로 보낸 뒤 발행일 순으로 놓는다. 연재는 쓴 순서와 읽는 순서가
 * 다를 수 있으므로 사람이 정한 번호가 이긴다.
 */
export function getSeriesPosts(
  posts: CollectionEntry<"posts">[],
  seriesSlug: string
): CollectionEntry<"posts">[] {
  return posts
    .filter(postFilter)
    .filter(
      post => post.data.series && slugifyStr(post.data.series) === seriesSlug
    )
    .sort((a, b) => {
      const orderA = a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a.data.pubDatetime.getTime() - b.data.pubDatetime.getTime();
    });
}
