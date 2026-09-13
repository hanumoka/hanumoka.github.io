import type { CollectionEntry } from "astro:content";
import { KINDS, type Kind } from "@/catalog";
import { postFilter } from "./postFilter";

export type { Kind };

/** 글이 하나라도 있는 종류만, 선언 순서대로. 초안·예약 글은 세지 않는다(태그·연재와 같은 규칙). */
export function getUniqueKinds(posts: CollectionEntry<"posts">[]) {
  const visible = posts.filter(postFilter);
  const used = new Set(
    visible.map(({ data }) => data.kind).filter((k): k is Kind => Boolean(k))
  );
  return KINDS.filter(kind => used.has(kind)).map(kind => ({
    kind,
    count: visible.filter(({ data }) => data.kind === kind).length,
  }));
}
