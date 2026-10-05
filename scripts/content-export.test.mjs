import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { unzipSync, strFromU8 } from "fflate";
import {
  containedFile,
  markdownAssets,
  packageArticle,
  checkSvg,
} from "./content-export.mjs";
import { rewriteHtmlAssetUrls } from "../src/utils/remarkLocalAssets.ts";
import { isPublishTimePassed } from "../src/utils/publicationTime.ts";
import { isPublicAddress } from "./import-image.mjs";

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "blog-export-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "post", "assets"), { recursive: true });
  return { root, post: join(root, "post") };
}
test("ZIP preserves Markdown and every local image/source, including GIF bytes", async t => {
  const { post } = await fixture(t);
  const content =
    "# 전체 본문\n![과정](./assets/progress.gif)\n![정적 대체](./assets/poster.png)\n[원본](./assets/flow.mmd)\n[근거](https://example.com)\n";
  const gif = Buffer.from("GIF89a-original-frames");
  await Promise.all([
    writeFile(join(post, "index.md"), content),
    writeFile(join(post, "assets/progress.gif"), gif),
    writeFile(join(post, "assets/poster.png"), "poster"),
    writeFile(join(post, "assets/flow.mmd"), "flowchart LR\nA --> B"),
    writeFile(
      join(post, "visual-assets.json"),
      JSON.stringify({
        assets: [
          {
            file: "./assets/progress.gif",
            poster: "./assets/poster.png",
            alt: "과정",
          },
        ],
      })
    ),
  ]);
  const packed = await packageArticle(join(post, "index.md"));
  const files = unzipSync(packed.zip);
  assert.equal(strFromU8(files["index.md"]), content);
  assert.deepEqual(Buffer.from(files["assets/progress.gif"]), gif);
  for (const url of markdownAssets(content))
    assert.ok(files[url.replace(/^\.\//, "")], url);
  assert.ok(files["assets/flow.mmd"]);
});
test("path traversal, percent-encoded traversal and missing assets fail", async t => {
  const { root, post } = await fixture(t);
  await writeFile(join(root, "outside.png"), "private");
  for (const path of [
    "../outside.png",
    "%2e%2e/outside.png",
    "assets/missing.svg",
    "C:\\private.png",
    "/private.png",
  ]) {
    await assert.rejects(containedFile(post, path));
  }
});
test("symlink cannot smuggle an outside file", async t => {
  const { root, post } = await fixture(t);
  await writeFile(join(root, "outside.png"), "private");
  try {
    await symlink(join(root, "outside.png"), join(post, "assets/link.png"));
  } catch (error) {
    if (error.code === "EPERM")
      return t.skip("OS does not permit unprivileged symlinks");
    throw error;
  }
  await assert.rejects(containedFile(post, "assets/link.png"), /폴더 밖/);
});
test("remote, protocol-relative, reference-style and HTML images fail; citation links stay", () => {
  for (const body of [
    "![x](https://example.com/a.png)",
    "![x](//example.com/a.png)",
    "![x][id]\n\n[id]: https://example.com/a.png",
    '<img src="https://example.com/a.png">',
    '<source srcset="https://example.com/a.png 1x">',
    '<svg><image href="https://example.com/a.png"/></svg>',
  ])
    assert.throws(() => markdownAssets(body));
  assert.deepEqual(markdownAssets("[근거](https://example.com)"), []);
});
test("SVG external resources and executable content fail; embedded fonts work", () => {
  for (const svg of [
    '<image href="https://example.com/image.png"/>',
    '<style>@import "https://example.com/a.css";</style>',
    "<script>alert(1)</script>",
    "<foreignObject>HTML</foreignObject>",
    '<svg onload="alert(1)"/>',
  ])
    assert.throws(() => checkSvg(svg, "x.svg"));
  checkSvg(
    "<style>@font-face {src:url(data:application/font-woff;base64,YQ==)}</style>",
    "x.svg"
  );
});
test("legacy MDX needs an explicit full replacement; components are never silently stripped", async t => {
  const { post } = await fixture(t);
  await writeFile(
    join(post, "index.mdx"),
    '---\nkey: legacy\n---\nimport Demo from "./Demo.astro";\n\n# Existing\n<Demo />'
  );
  assert.equal(await packageArticle(join(post, "index.mdx")), null);
  await writeFile(
    join(post, "_export.md"),
    "# Complete static explanation\nAll former states are explained here."
  );
  const packed = await packageArticle(join(post, "index.mdx"));
  assert.equal(packed.data.key, "legacy");
  assert.match(packed.content, /All former states/);
  await writeFile(join(post, "_export.md"), "# Incomplete\n<Demo />");
  await assert.rejects(packageArticle(join(post, "index.mdx")), /MDX/);
});
test("unrendered diagram fences and missing GIF poster fail", async t => {
  assert.throws(() => markdownAssets("```mermaid\nA --> B\n```"), /다이어그램/);
  const { post } = await fixture(t);
  await writeFile(join(post, "index.md"), "![진행](./assets/progress.gif)");
  await writeFile(join(post, "assets/progress.gif"), "GIF89a");
  await assert.rejects(packageArticle(join(post, "index.md")), /GIF/);
});
test("private/local image import addresses are denied", () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "::1",
    "::ffff:127.0.0.1",
    "fe80::1",
    "fc00::1",
  ])
    assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress("1.1.1.1"), true);
});
test("ZIP keeps all five editable source formats", async t => {
  const { post } = await fixture(t);
  const file = join(post, "index.md");
  await writeFile(file, "# Source attachment fixture\n");
  const originals = [
    "flow.mmd",
    "sequence.puml",
    "services.d2",
    "boxes.drawio",
    "sketch.excalidraw",
  ];
  for (const name of originals)
    await writeFile(join(post, "assets", name), "source fixture");
  const packed = await packageArticle(file);
  const files = unzipSync(packed.zip);
  for (const name of originals) assert.ok(files[`assets/${name}`], name);
  assert.equal(strFromU8(files["index.md"]), await readFile(file, "utf8"));
});

test("HTML attachment links outside assets are included in the ZIP", async t => {
  const { post } = await fixture(t);
  await mkdir(join(post, "downloads"));
  await writeFile(join(post, "downloads/example.pdf"), "PDF attachment");
  await writeFile(
    join(post, "index.md"),
    '<a href="downloads/example.pdf">자료</a>'
  );
  const files = unzipSync((await packageArticle(join(post, "index.md"))).zip);
  assert.equal(strFromU8(files["downloads/example.pdf"]), "PDF attachment");
});

test("inline Mermaid exports a matching static image and retains editable source", async t => {
  const { post } = await fixture(t);
  const definition = "flowchart LR\nA --> B";
  await writeFile(
    join(post, "index.md"),
    `# Intro\n\n\`\`\`mermaid\n${definition}\n\`\`\`\n\nAfter.`
  );
  await writeFile(join(post, "assets/flow.mmd"), definition);
  await writeFile(join(post, "assets/flow.png"), "image fixture");
  await writeFile(
    join(post, "visual-assets.json"),
    JSON.stringify({
      assets: [
        {
          file: "./assets/flow.png",
          source: "./assets/flow.mmd",
          alt: "A to B",
        },
      ],
    })
  );
  const files = unzipSync((await packageArticle(join(post, "index.md"))).zip);
  const exported = strFromU8(files["index.md"]);
  assert.match(exported, /!\[A to B\]\(\.\/assets\/flow.png\)/);
  assert.ok(exported.includes("After."));
  assert.equal(strFromU8(files["assets/flow.mmd"]), definition);
  await writeFile(join(post, "assets/flow.mmd"), "flowchart LR\nA --> C");
  await assert.rejects(
    packageArticle(join(post, "index.md")),
    /Mermaid 내보내기/
  );
});

test("HTML URL rewriting preserves split details tags and Markdown boundaries", () => {
  const opening = "<details>\n<summary>설명</summary>";
  assert.equal(
    rewriteHtmlAssetUrls(opening, url => `/exports/${url}`),
    opening
  );
  assert.equal(
    rewriteHtmlAssetUrls("</details>", url => `/exports/${url}`),
    "</details>"
  );
  assert.equal(
    rewriteHtmlAssetUrls(
      '<a href="downloads/a.pdf">자료</a>',
      url => `/exports/${url}`
    ),
    '<a href="/exports/downloads/a.pdf">자료</a>'
  );
});
test("scheduled articles and exports share the same strict publication time gate", () => {
  const now = Date.parse("2026-10-05T00:00:00Z");
  assert.equal(isPublishTimePassed("2026-10-06T00:00:00Z", now), false);
  assert.equal(isPublishTimePassed("2026-10-05T00:00:00Z", now, 0), false);
  assert.equal(isPublishTimePassed("2026-10-05T00:00:01Z", now, 1001), true);
  assert.equal(isPublishTimePassed("invalid", now), false);
});

test("site export removes stale scheduled bundles and never writes future posts", async t => {
  const { root } = await fixture(t);
  const posts = join(root, "posts", "ko", "scheduled");
  await mkdir(posts, { recursive: true });
  await writeFile(
    join(posts, "index.md"),
    "---\nkey: scheduled\npubDatetime: 2999-01-01T00:00:00Z\n---\n# Future private draft"
  );
  await mkdir(join(root, "public", "exports"), { recursive: true });
  await writeFile(join(root, "public", "exports", "stale.zip"), "stale");
  const module = new URL("./content-export.mjs", import.meta.url).href;
  const code = `import { buildExports } from ${JSON.stringify(module)}; await buildExports("posts");`;
  const child = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", code],
    { cwd: root, encoding: "utf8" }
  );
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(
    JSON.parse(
      await readFile(join(root, "public", "exports", "manifest.json"), "utf8")
    ),
    {}
  );
  await assert.rejects(readFile(join(root, "public", "exports", "stale.zip")), {
    code: "ENOENT",
  });
  await assert.rejects(
    readFile(join(root, "public", "exports", "ko", "scheduled", "index.md")),
    { code: "ENOENT" }
  );
});
