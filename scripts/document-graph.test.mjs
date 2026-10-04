import test from "node:test";
import assert from "node:assert/strict";
import {
  collectDocumentLinks,
  remarkDocumentLinks,
} from "../src/utils/remarkDocumentLinks.ts";
import { connectDocuments } from "../src/utils/documentGraph.ts";

const node = (id, links = [], draft = false, url = `/posts/${id}/`) => ({
  id,
  title: id,
  description: "",
  url,
  links,
  draft,
});

test("본문 링크·참조형 링크·HTML·정적 MDX 링크만 수집한다", () => {
  const tree = {
    type: "root",
    children: [
      { type: "link", url: "/posts/a/#one" },
      { type: "linkReference", identifier: "Guide" },
      { type: "definition", identifier: "guide", url: "/posts/b/" },
      {
        type: "html",
        value: '<a href="/posts/c/">C</a><!-- <a href="/posts/fake/"> -->',
      },
      {
        type: "mdxJsxTextElement",
        name: "a",
        attributes: [{ name: "href", value: "/posts/d/" }],
      },
      {
        type: "mdxJsxTextElement",
        name: "a",
        attributes: [
          { name: "href", value: { type: "expression", value: "malicious()" } },
        ],
      },
      {
        type: "code",
        value: "[fake](/posts/code/)",
        children: [{ type: "link", url: "/posts/also-fake/" }],
      },
      { type: "inlineCode", value: "/posts/inline/" },
      { type: "image", url: "/posts/image/" },
    ],
  };
  assert.deepEqual(collectDocumentLinks(tree), [
    "/posts/a/#one",
    "/posts/b/",
    "/posts/c/",
    "/posts/d/",
  ]);
});

test("파서 메타데이터가 비어 있어도 링크를 전달하고 기존 메타데이터를 보존한다", () => {
  const file = { data: { astro: { frontmatter: { title: "kept" } } } };
  remarkDocumentLinks()(
    { type: "root", children: [{ type: "link", url: "/posts/b/" }] },
    file
  );
  assert.deepEqual(file.data.astro.frontmatter, {
    title: "kept",
    documentLinks: ["/posts/b/"],
  });
  const empty = { data: {} };
  remarkDocumentLinks()({ type: "root" }, empty);
  assert.deepEqual(empty.data.astro.frontmatter.documentLinks, []);
});

test("절·쿼리·중복은 한 방향 연결로 합치고 자기 문서·외부·허용 목록 밖은 제외한다", () => {
  const nodes = [
    node("a", [
      "../b/#tcc",
      "/posts/b?x=1",
      "/posts/a/#own",
      "https://other.test/posts/b/",
      "/posts/draft/",
      "javascript:alert(1)",
    ]),
    node("b", ["/posts/a/"]),
  ];
  assert.deepEqual(connectDocuments(nodes, "https://site.test"), [
    { source: "a", target: "b" },
    { source: "b", target: "a" },
  ]);
});

test("초안은 공개 지도 데이터와 연결 수에 포함되지 않는다", () => {
  const all = [
    node("published", ["/posts/draft/"]),
    node("draft", ["/posts/published/"], true),
  ];
  assert.deepEqual(
    connectDocuments(
      all.filter(item => !item.draft),
      "https://site.test"
    ),
    []
  );
  assert.equal(connectDocuments(all, "https://site.test").length, 2);
});

test("base와 언어 접두사 및 인코딩을 실제 글 URL 기준으로 해석한다", () => {
  const nodes = [
    node("a", ["../%EB%82%98/#term"], false, "/blog/en/posts/a/"),
    node("b", [], false, "/blog/en/posts/나/"),
  ];
  assert.deepEqual(connectDocuments(nodes, "https://site.test/blog/"), [
    { source: "a", target: "b" },
  ]);
});
