import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseFragment } from "parse5";
import { parse } from "yaml";

type Node = { type?: string; url?: string; value?: string; children?: Node[] };

/** Keep article bytes in public/exports, preserving GIF animation and editable attachments. */
export function remarkLocalAssets() {
  return (tree: Node, file: { path?: string }) => {
    if (!file.path || !file.path.endsWith(".md")) return;
    const normalized = file.path.replace(/\\/g, "/");
    const locale = /(?:^|\/)src\/content\/posts\/([^/]+)\//.exec(
      normalized
    )?.[1];
    if (!locale) return;
    const content = readFileSync(file.path, "utf8");
    const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
    const key = front ? parse(front[1])?.key : undefined;
    if (typeof key !== "string") return;
    function target(url: string) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(url)) return url;
      const local = url.split(/[?#]/)[0].replace(/^\.\//, "");
      if (!existsSync(resolve(dirname(file.path!), decodeURIComponent(local))))
        return url;
      return `/exports/${locale}/${key}/${local}${url.slice(url.split(/[?#]/)[0].length)}`;
    }
    function visit(node: Node) {
      if (["image", "link", "definition"].includes(node.type ?? "") && node.url)
        node.url = target(node.url);
      if (node.type === "html" && node.value) {
        node.value = rewriteHtmlAssetUrls(node.value, target);
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}

/** Rewrite attribute bytes only: parsing must not insert closing details/summary tags. */
export function rewriteHtmlAssetUrls(
  html: string,
  target: (url: string) => string
) {
  const fragment = parseFragment(html, { sourceCodeLocationInfo: true });
  const edits: { start: number; end: number; text: string }[] = [];
  const walk = (
    element: typeof fragment | (typeof fragment.childNodes)[number]
  ) => {
    if ("attrs" in element)
      for (const attr of element.attrs) {
        if (!["src", "href"].includes(attr.name)) continue;
        const location = element.sourceCodeLocation?.attrs?.[attr.name];
        const url = target(attr.value);
        if (!location || url === attr.value) continue;
        const escaped = url
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;");
        edits.push({
          start: location.startOffset,
          end: location.endOffset,
          text: `${attr.name}="${escaped}"`,
        });
      }
    if ("childNodes" in element) element.childNodes.forEach(walk);
  };
  walk(fragment);
  for (const edit of edits.sort((a, b) => b.start - a.start))
    html = html.slice(0, edit.start) + edit.text + html.slice(edit.end);
  return html;
}
