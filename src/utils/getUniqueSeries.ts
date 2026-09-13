import type { CollectionEntry } from "astro:content";
import { type SeriesKey } from "@/series";
import { postFilter } from "./postFilter";

type Series = {
  /** URL 에 쓰는 고정 키 */
  series: SeriesKey;
  /** 그 연재에 속한 글 수 */
  count: number;
};

/**
 * 글 목록에서 연재를 모은다. 키로 중복을 없앤다. 표시 이름은 호출하는
 * 쪽이 `seriesLabel` 로 고른다 — 같은 키가 언어마다 다른 이름을 갖기
 * 때문이다.
 */
export function getUniqueSeries(posts: CollectionEntry<"posts">[]): Series[] {
  const counts = new Map<SeriesKey, number>();

  for (const post of posts.filter(postFilter)) {
    const key = post.data.series;
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([series, count]) => ({ series, count }));
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
  seriesKey: string
): CollectionEntry<"posts">[] {
  return posts
    .filter(postFilter)
    .filter(post => post.data.series === seriesKey)
    .sort((a, b) => {
      const orderA = a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a.data.pubDatetime.getTime() - b.data.pubDatetime.getTime();
    });
}
