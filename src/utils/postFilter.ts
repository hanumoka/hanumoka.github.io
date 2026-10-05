import type { CollectionEntry } from "astro:content";
import { isPublishTimePassed } from "./publicationTime";

const timeOk = (data: CollectionEntry<"posts">["data"]) =>
  import.meta.env.DEV || isPublishTimePassed(data.pubDatetime);

/** 정식 글. 소유자가 검토·실습·확인한 것만 글 목록·검색·RSS에 넣는다. */
export function postFilter({ data }: CollectionEntry<"posts">) {
  return !data.draft && timeOk(data);
}

/** 초안. 공개하지만 정식 목록과는 갈라 둔다. */
export function draftFilter({ data }: CollectionEntry<"posts">) {
  return !!data.draft && timeOk(data);
}
