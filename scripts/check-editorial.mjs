import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve, relative, sep } from "node:path";
import { checkSeriesNavigation, checkPublication } from "./editorial-rules.mjs";

const root = resolve(".");
function inside(path) {
  const full = resolve(root, path);
  assert(full.startsWith(root + sep), `저장소 밖 경로: ${path}`);
  return full;
}
function* files(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) yield* files(path);
    else yield path;
  }
}
const manifest = JSON.parse(readFileSync("trash/manifest.json", "utf8"));
const archivedKeys = new Set(manifest.entries.map(entry => entry.key));
for (const entry of manifest.entries) {
  assert(Array.isArray(entry.restoreWith), `동반 복구 목록 누락: ${entry.key}`);
  for (const dependency of entry.restoreWith) {
    assert(
      archivedKeys.has(dependency),
      `알 수 없는 동반 복구 글: ${dependency}`
    );
    assert(
      dependency !== entry.key,
      `자기 자신을 동반 복구로 지정: ${entry.key}`
    );
  }
  assert(
    !existsSync(inside(entry.original)),
    `휴지통과 현재 글이 중복: ${entry.key}`
  );
  for (const file of entry.files) {
    const full = inside(join(entry.archived, file.path));
    const digest = createHash("sha256")
      .update(readFileSync(full))
      .digest("hex");
    assert.equal(
      digest,
      file.sha256,
      `보관 원본 변경: ${entry.key}/${file.path}`
    );
  }
  assert(
    !existsSync(`dist/posts/${entry.key}/index.html`),
    `휴지통 글이 빌드됨: ${entry.key}`
  );
}
assert(!existsSync("dist/trash"), "휴지통이 정적 파일로 배포됨");

const temporal = [];
const indexed = JSON.parse(
  readFileSync("dist/search-index.json", "utf8")
).pages;
for (const path of files("src/content/posts")) {
  if (!/\.mdx?$/.test(path)) continue;
  const raw = readFileSync(path, "utf8");
  const front = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/u)?.[1] ?? "";
  const scalar = name =>
    front
      .match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1]
      ?.trim()
      .replace(/^"|"$/g, "");
  if (scalar("series") !== "temporal") continue;
  const key = scalar("key");
  const draft = scalar("draft") === "true";
  const order = Number(scalar("seriesOrder"));
  const minutes = Number(scalar("readingMinutes"));
  checkPublication({
    key,
    draft,
    publishedAt: scalar("pubDatetime"),
    body: raw.slice(raw.indexOf(front) + front.length),
  });
  assert(Number.isInteger(order) && order > 0, `연재 순서 오류: ${key}`);
  assert(minutes >= 5 && minutes <= 10, `읽기 분량 재검토 필요: ${key}`);
  assert(
    !/\{(?:placeholder|TODO)\}|TODO:|TBD/u.test(raw),
    `미완성 본문: ${key}`
  );
  const html = readFileSync(`dist/posts/${key}/index.html`, "utf8");
  const noindex = /<meta name="robots" content="noindex/.test(html);
  assert.equal(noindex, draft, `초안 검색 정책 불일치: ${key}`);
  if (draft)
    assert(
      !html.includes("data-pagefind-body"),
      `초안이 검색 본문에 포함: ${key}`
    );
  assert.equal(
    indexed.includes(`/posts/${key}/`),
    !draft,
    `검색 색인 상태 불일치: ${key}`
  );
  temporal.push({ key, order, draft, html });
}
temporal.sort((a, b) => a.order - b.order);
assert.equal(
  new Set(temporal.map(p => p.order)).size,
  temporal.length,
  "연재 순서 중복"
);
const reviewPath = "dist/drafts/series/temporal/index.html";
const review = temporal.length ? readFileSync(reviewPath, "utf8") : "";
if (temporal.length)
  assert(
    /<meta name="robots" content="noindex/.test(review),
    "검토 목차 noindex 누락"
  );
else
  assert(!existsSync(reviewPath), "글 없는 Temporal 검토 목차가 남아 있습니다");
let last = -1;
for (const post of temporal) {
  const offset = review.indexOf(`/posts/${post.key}/`);
  assert(offset > last, `검토 목차 순서 누락/역전: ${post.key}`);
  last = offset;
  const parts = post.draft ? temporal : temporal.filter(p => !p.draft);
  const index = parts.indexOf(post);
  checkSeriesNavigation(post.html, {
    key: post.key,
    previous: parts[index - 1]?.key,
    next: parts[index + 1]?.key,
  });
}
const feeds = [...files("dist")].filter(p =>
  /(?:rss|sitemap[^/\\]*)\.xml$/.test(p)
);
for (const file of feeds) {
  const body = readFileSync(file, "utf8");
  for (const post of temporal.filter(p => p.draft)) {
    assert(
      !body.includes(`/posts/${post.key}/`),
      `초안 유입: ${relative(root, file)}`
    );
  }
}
if (!temporal.some(p => !p.draft))
  assert(
    !existsSync("dist/series/temporal/index.html"),
    "정식 글 없는 연재가 정식 목록에 생성됨"
  );
console.log(
  `편집 검사 통과: Temporal ${temporal.length}편 · 휴지통 ${manifest.entries.length}편 원본 보존 · 초안과 정식 분리`
);
