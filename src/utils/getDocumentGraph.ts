import { render } from "astro:content";
import { getLocalizedPosts } from "./getLocalizedPosts";
import { getPostUrl } from "./getPostPaths";
import { postFilter, draftFilter } from "./postFilter";
import { connectDocuments, type GraphNode } from "./documentGraph";
import type { Locale } from "./locales";
import config from "@/config";

export async function getDocumentGraph(locale: Locale, review = false) {
  const posts = (await getLocalizedPosts(locale, { includeDrafts: review }))
    .filter(post => postFilter(post) || (review && draftFilter(post)))
    .sort((a, b) => a.data.key.localeCompare(b.data.key));
  const nodes: GraphNode[] = await Promise.all(
    posts.map(async post => {
      const { remarkPluginFrontmatter } = await render(post);
      const raw = remarkPluginFrontmatter.documentLinks;
      return {
        id: post.data.key,
        title: post.data.title,
        description: post.data.description,
        url: getPostUrl(post.data.key, locale),
        draft: !!post.data.draft,
        links: Array.isArray(raw)
          ? raw.filter((value): value is string => typeof value === "string")
          : [],
      };
    })
  );
  const edges = connectDocuments(nodes, config.site.url);
  // 원문 URL 배열은 연결 계산에만 사용하고 브라우저에는 보내지 않는다.
  return { nodes: nodes.map(node => ({ ...node, links: [] })), edges };
}
