import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";

export type Kind = NonNullable<CollectionEntry<"posts">["data"]["kind"]>;

/**
 * 선언 순서. 빈도로 정렬하면 글이 하나 늘 때마다 차례가 바뀌어 읽는 쪽이 위치를
 * 기억하지 못한다.
 */
export const KIND_ORDER = [
  "til",
  "troubleshooting",
  "concept",
  "snippet",
  "agent-issue",
] as const satisfies readonly Kind[];

/** 글이 하나라도 있는 종류만, 선언 순서대로. 초안·예약 글은 세지 않는다(태그·연재와 같은 규칙). */
export function getUniqueKinds(posts: CollectionEntry<"posts">[]) {
  const visible = posts.filter(postFilter);
  const used = new Set(
    visible.map(({ data }) => data.kind).filter((k): k is Kind => Boolean(k))
  );
  return KIND_ORDER.filter(kind => used.has(kind)).map(kind => ({
    kind,
    count: visible.filter(({ data }) => data.kind === kind).length,
  }));
}
