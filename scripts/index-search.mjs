import assert from "node:assert/strict";
import { readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import * as pagefind from "pagefind";

const dist = resolve("dist");
function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "pagefind") yield* walk(path);
    else if (entry.isFile() && entry.name.endsWith(".html")) yield path;
  }
}
const pages = [...walk(dist)]
  .map(path => ({ path, content: readFileSync(path, "utf8") }))
  .filter(page =>
    /<main\b[^>]*\bdata-pagefind-body(?:[\s=>])/.test(page.content)
  );
const urls = pages.map(
  page =>
    "/" +
    relative(dist, page.path)
      .split(sep)
      .join("/")
      .replace(/index\.html$/, "")
);
writeFileSync(
  join(dist, "search-index.json"),
  JSON.stringify({ pages: urls }, null, 2) + "\n"
);
const output = resolve(dist, "pagefind");
assert.equal(relative(dist, output), "pagefind");
assert(output.startsWith(dist + sep));
// 빌드 생성물만 지운다. 정식 글이 0개여도 이전 색인을 남기지 않는다.
rmSync(output, { recursive: true, force: true });
if (pages.length === 0) {
  console.log("검색 색인: 정식 글 0편. 초안을 대신 색인하지 않습니다.");
} else {
  try {
    const result = await pagefind.createIndex({
      rootSelector: "[data-pagefind-body]",
    });
    assert(!result.errors?.length, JSON.stringify(result.errors));
    const { index } = result;
    assert(index, "Pagefind index 생성 실패");
    for (const page of pages) {
      const added = await index.addHTMLFile({
        sourcePath: relative(dist, page.path).split(sep).join("/"),
        content: page.content,
      });
      assert(!added.errors?.length, JSON.stringify(added.errors));
    }
    const written = await index.writeFiles({ outputPath: output });
    assert(!written.errors?.length, JSON.stringify(written.errors));
    console.log(`검색 색인: 정식 글 ${pages.length}편`);
  } finally {
    await pagefind.close();
  }
}
