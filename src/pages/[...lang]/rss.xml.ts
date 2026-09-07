import rss from "@astrojs/rss";
import { getLocalizedPosts } from "@/utils/getLocalizedPosts";
import { localePaths, resolveLocale } from "@/utils/locales";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { getPostUrl } from "@/utils/getPostPaths";
import config from "@/config";

export const getStaticPaths = localePaths;

export async function GET(context: { currentLocale?: string }) {
  const locale = resolveLocale(context.currentLocale);
  const posts = await getLocalizedPosts(locale);
  const sortedPosts = getSortedPosts(posts);

  return rss({
    title: config.site.title,
    description: config.site.description,
    site: config.site.url,
    items: sortedPosts.map(({ data, id, filePath }) => ({
      link: getPostUrl(id, filePath, locale),
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}
