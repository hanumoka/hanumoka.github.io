import { getCollection } from "astro:content";
import type { Locale } from "@/catalog";

let pageIds: Set<string> | undefined;

async function contentPageIds(): Promise<Set<string>> {
  pageIds ??= new Set((await getCollection("pages")).map(entry => entry.id));
  return pageIds;
}

/** 그 언어의 페이지 컬렉션에 해당 슬러그가 있는가. `home` 은 루트라 여기 묻지 않는다. */
export async function hasContentPage(
  slug: string,
  locale: Locale
): Promise<boolean> {
  return (await contentPageIds()).has(`${locale}/${slug}`);
}
