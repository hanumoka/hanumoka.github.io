import userConfig from "../../astro-paper.config.ts";

/** Same time gate for published HTML and downloadable Markdown/assets. */
export function isPublishTimePassed(
  pubDatetime: string | Date,
  now = Date.now(),
  margin = userConfig.posts?.scheduledPostMargin ?? 15 * 60 * 1000
) {
  return now > new Date(pubDatetime).getTime() - margin;
}
