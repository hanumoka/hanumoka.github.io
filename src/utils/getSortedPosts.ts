import type { CollectionEntry } from "astro:content";
import { draftFilter, postFilter } from "./postFilter";

function byUpdatedDesc(a: CollectionEntry<"posts">, b: CollectionEntry<"posts">) {
  return (
    Math.floor(
      new Date(b.data.modDatetime ?? b.data.pubDatetime).getTime() / 1000
    ) -
    Math.floor(
      new Date(a.data.modDatetime ?? a.data.pubDatetime).getTime() / 1000
    )
  );
}

/** 정식 글만. 초안은 여기 넣지 않는다. */
export function getSortedPosts(posts: CollectionEntry<"posts">[]) {
  return posts.filter(postFilter).sort(byUpdatedDesc);
}

/** 초안만. 공개 초안 목록과 초안 글의 이전/다음에 쓴다. */
export function getSortedDrafts(posts: CollectionEntry<"posts">[]) {
  return posts.filter(draftFilter).sort(byUpdatedDesc);
}
