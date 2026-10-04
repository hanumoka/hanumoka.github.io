import { parseFragment } from "parse5";

type Node = {
  type?: string;
  value?: string;
  url?: string;
  identifier?: string;
  name?: string;
  children?: Node[];
  attributes?: { name: string; value: unknown }[];
};
/** 코드·이미지·JS 표현식을 읽지 않고 본문에 직접 작성한 링크만 모은다. */
export function collectDocumentLinks(tree: Node): string[] {
  const links = new Set<string>();
  const definitions = new Map<string, string>();
  const normalize = (id: string) =>
    id.trim().replace(/\s+/g, " ").toLowerCase();
  function visit(node: Node, fn: (node: Node) => void) {
    if (["code", "inlineCode", "yaml"].includes(node.type ?? "")) return;
    fn(node);
    node.children?.forEach(child => visit(child, fn));
  }
  visit(tree, node => {
    if (node.type === "definition" && node.identifier && node.url)
      definitions.set(normalize(node.identifier), node.url);
  });
  visit(tree, node => {
    if (node.type === "link" && node.url) links.add(node.url);
    if (node.type === "linkReference" && node.identifier) {
      const url = definitions.get(normalize(node.identifier));
      if (url) links.add(url);
    }
    if (node.name === "a" && node.type?.startsWith("mdxJsx")) {
      const href = node.attributes?.find(attr => attr.name === "href")?.value;
      if (typeof href === "string") links.add(href);
    }
    if (node.type === "html" && node.value) {
      const fragment = parseFragment(node.value);
      const htmlVisit = (
        element: typeof fragment | (typeof fragment.childNodes)[number]
      ) => {
        if ("tagName" in element && element.tagName === "a") {
          const href = element.attrs.find(attr => attr.name === "href")?.value;
          if (href) links.add(href);
        }
        if ("childNodes" in element) element.childNodes.forEach(htmlVisit);
      };
      htmlVisit(fragment);
    }
  });
  return [...links];
}

export function remarkDocumentLinks() {
  return (
    tree: Node,
    file: { data: { astro?: { frontmatter?: Record<string, unknown> } } }
  ) => {
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.documentLinks = collectDocumentLinks(tree);
  };
}
