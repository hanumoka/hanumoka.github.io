#!/usr/bin/env node
/**
 * 빌드 결과(`dist`)를 배포 전에 검사한다.
 *
 *   node scripts/check-dist.mjs [dist 경로]   (기본 ./dist)
 *
 * 검사는 넷이다. 하나라도 걸리면 exit 1.
 *
 *   1. 링크 — 같은 사이트를 가리키는 모든 주소(a · link · img · script ·
 *      공유용 meta)가 dist 안의 실제 파일로 풀리는가.
 *   2. 언어 짝 — hreflang이 가리키는 페이지가 있고, noindex가 아니며,
 *      그 페이지도 이쪽을 되돌아 가리키는가.
 *   3. noindex — 검색 제외 페이지가 hreflang을 내지 않는가.
 *   4. 사이트맵 — 사이트맵의 모든 주소가 있고 noindex가 아닌가.
 *
 * 주소 해석은 GitHub Pages 규칙을 따른다. `/`로 끝나면 그 폴더의
 * `index.html`, 확장자가 없으면 `.html` 또는 `/index.html`이다.
 *
 * 사이트 주소는 이 파일에 적지 않는다. 빌드된 `index.html`의 canonical에서
 * 읽는다 — 설정과 두 벌이 되지 않게 하려는 것이다.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parse } from "parse5";

const DIST = process.argv[2] ?? "dist";
const SKIP_SCHEMES = /^(mailto:|tel:|javascript:|data:|#)/i;
const SKIP_RELS = new Set(["preconnect", "dns-prefetch"]);

if (!existsSync(join(DIST, "index.html"))) {
  console.error(`✗ ${DIST}/index.html 이 없습니다. 먼저 빌드하세요.`);
  process.exit(2);
}

// ---------- HTML 읽기 ----------

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (name.endsWith(".html")) yield p;
  }
}

function* elements(node) {
  for (const child of node.childNodes ?? []) {
    if (child.tagName) yield child;
    yield* elements(child.content ?? child); // <template> 안도 본다
  }
}

const attr = (el, name) => el.attrs.find(a => a.name === name)?.value;

/** dist 안의 파일 → 그 페이지의 공개 경로 */
function pagePath(file) {
  const rel = relative(DIST, file).split(sep).join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html"))
    return "/" + rel.slice(0, -"index.html".length);
  return "/" + rel;
}

const pages = new Map(); // 공개 경로 → { file, noindex, refs[], alternates[] }

for (const file of walk(DIST)) {
  const doc = parse(readFileSync(file, "utf8"));
  const page = { file, noindex: false, refs: [], alternates: [] };
  for (const el of elements(doc)) {
    const t = el.tagName;
    if (t === "meta") {
      const name = attr(el, "name");
      const prop = attr(el, "property");
      if (name === "robots" && /noindex/i.test(attr(el, "content") ?? ""))
        page.noindex = true;
      if (["og:image", "og:url"].includes(prop) || name === "twitter:image")
        page.refs.push({
          where: `meta ${prop ?? name}`,
          url: attr(el, "content"),
        });
    } else if (t === "a" || t === "area") {
      page.refs.push({ where: `<${t}>`, url: attr(el, "href") });
    } else if (t === "link") {
      const rels = (attr(el, "rel") ?? "").toLowerCase().split(/\s+/);
      if (rels.some(r => SKIP_RELS.has(r))) continue;
      const href = attr(el, "href");
      const hreflang = attr(el, "hreflang");
      if (rels.includes("alternate") && hreflang)
        page.alternates.push({ hreflang, url: href });
      else
        page.refs.push({ where: `<link rel="${rels.join(" ")}">`, url: href });
    } else if (
      t === "img" ||
      t === "source" ||
      t === "script" ||
      t === "iframe"
    ) {
      const src = attr(el, "src");
      if (src) page.refs.push({ where: `<${t} src>`, url: src });
      for (const part of (attr(el, "srcset") ?? "").split(",")) {
        const u = part.trim().split(/\s+/)[0];
        if (u) page.refs.push({ where: `<${t} srcset>`, url: u });
      }
    }
  }
  pages.set(pagePath(file), page);
}

// ---------- 주소 해석 ----------

const home = [
  ...elements(parse(readFileSync(join(DIST, "index.html"), "utf8"))),
].find(el => el.tagName === "link" && attr(el, "rel") === "canonical");
if (!home) {
  console.error(
    "✗ index.html 에 canonical 이 없어 사이트 주소를 알 수 없습니다."
  );
  process.exit(2);
}
const ORIGIN = new URL(attr(home, "href")).origin;

/** 같은 사이트 주소면 { path, file } — file은 없으면 null. 바깥 주소면 null. */
function resolve(raw, fromPath = "/") {
  if (!raw || SKIP_SCHEMES.test(raw.trim())) return null;
  let u;
  try {
    u = new URL(raw.trim(), ORIGIN + fromPath);
  } catch {
    return { path: raw, file: null };
  }
  if (u.origin !== ORIGIN) return null;
  let path;
  try {
    path = decodeURIComponent(u.pathname);
  } catch {
    path = u.pathname;
  }
  const candidates = path.endsWith("/")
    ? [path + "index.html"]
    : /\.[^/]+$/.test(path)
      ? [path]
      : [path + ".html", path + "/index.html"];
  const hit = candidates.find(c => existsSync(join(DIST, c)));
  return { path, file: hit ?? null };
}

/** 해석된 파일 → 그 페이지 레코드 (HTML이 아니면 undefined) */
const pageOf = r =>
  r?.file ? pages.get(pagePath(join(DIST, r.file))) : undefined;

// ---------- 검사 ----------

const problems = { links: [], hreflang: [], noindex: [], sitemap: [] };
let checked = 0;

for (const [path, page] of pages) {
  for (const ref of page.refs) {
    const r = resolve(ref.url, path);
    if (!r) continue;
    checked++;
    if (!r.file) problems.links.push(`${path} → ${ref.url}  (${ref.where})`);
  }

  if (page.noindex && page.alternates.length)
    problems.noindex.push(
      `${path} 는 noindex 인데 hreflang ${page.alternates.length}개를 냅니다`
    );

  for (const alt of page.alternates) {
    const r = resolve(alt.url, path);
    if (!r) continue;
    checked++;
    if (!r.file) {
      problems.hreflang.push(
        `${path} → [${alt.hreflang}] ${alt.url}  (없는 페이지)`
      );
      continue;
    }
    const target = pageOf(r);
    if (!target) continue;
    if (target.noindex)
      problems.hreflang.push(
        `${path} → [${alt.hreflang}] ${alt.url}  (대상이 noindex)`
      );
    if (alt.hreflang === "x-default") continue;
    const backs = target.alternates.some(
      b => resolve(b.url, r.path)?.file === resolve(path)?.file
    );
    if (!backs)
      problems.hreflang.push(
        `${path} → [${alt.hreflang}] ${alt.url}  (되돌아 가리키지 않음)`
      );
  }
}

const sitemapFiles = readdirSync(DIST).filter(
  n => /^sitemap.*\.xml$/.test(n) && n !== "sitemap-index.xml"
);
for (const name of sitemapFiles) {
  const xml = readFileSync(join(DIST, name), "utf8");
  const urls = [
    ...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]),
    ...[...xml.matchAll(/<xhtml:link[^>]*href="([^"]+)"/g)].map(m => m[1]),
  ];
  for (const u of urls) {
    const r = resolve(u.replace(/&amp;/g, "&"));
    if (!r) continue;
    checked++;
    if (!r.file) problems.sitemap.push(`${name}: ${u}  (없는 페이지)`);
    else if (pageOf(r)?.noindex)
      problems.sitemap.push(`${name}: ${u}  (noindex 페이지)`);
  }
}

// ---------- 보고 ----------

const LABELS = {
  links: "링크",
  hreflang: "언어 짝",
  noindex: "noindex",
  sitemap: "사이트맵",
};
const total = Object.values(problems).reduce((n, list) => n + list.length, 0);
console.log(
  `dist 검사: HTML ${pages.size}개 · 확인한 주소 ${checked}개 · 기준 ${ORIGIN}`
);
for (const [key, list] of Object.entries(problems)) {
  console.log(`  ${list.length ? "✗" : "✓"} ${LABELS[key]} ${list.length}건`);
  for (const line of [...new Set(list)].slice(0, 15))
    console.log(`      ${line}`);
  if (new Set(list).size > 15)
    console.log(`      … 외 ${new Set(list).size - 15}건`);
}
process.exit(total ? 1 : 0);
