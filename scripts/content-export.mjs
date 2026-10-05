import {
  readFile,
  writeFile,
  readdir,
  mkdir,
  realpath,
  stat,
  rm,
} from "node:fs/promises";
import { resolve, dirname, relative, sep, extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { parseFragment } from "parse5";
import { zipSync, strToU8 } from "fflate";
import { isPublishTimePassed } from "../src/utils/publicationTime.ts";

const parser = unified().use(remarkParse);
const remote = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;
const slash = value => value.split(sep).join("/");
export function splitDocument(text) {
  const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  return {
    data: front ? (parseYaml(front[1]) ?? {}) : {},
    body: front ? text.slice(front[0].length) : text,
  };
}
export async function containedFile(root, name) {
  const decoded = decodeURIComponent(name.split(/[?#]/)[0]);
  if (
    remote.test(decoded) ||
    decoded.startsWith("/") ||
    decoded.includes("\\") ||
    decoded.includes("\0")
  )
    throw new Error(`로컬 상대 경로가 필요합니다: ${name}`);
  const base = await realpath(root);
  const target = await realpath(resolve(base, decoded)).catch(() => {
    throw new Error(`파일이 없습니다: ${name}`);
  });
  const rel = relative(base, target);
  if (rel === ".." || rel.startsWith(`..${sep}`) || resolve(target) === base)
    throw new Error(`글 폴더 밖의 파일은 첨부할 수 없습니다: ${name}`);
  if (!(await stat(target)).isFile())
    throw new Error(`첨부 파일이 아닙니다: ${name}`);
  return { path: target, name: slash(rel) };
}
function walk(node, callback) {
  callback(node);
  for (const child of node.children ?? node.childNodes ?? [])
    walk(child, callback);
}
export function markdownAssets(body, { portable = true } = {}) {
  const tree = parser.parse(body);
  const definitions = new Map();
  walk(tree, node => {
    if (node.type === "definition")
      definitions.set(node.identifier.toLowerCase(), node.url);
  });
  const assets = new Set();
  function add(url, image = false) {
    if (!url) throw new Error("이미지 주소가 없습니다.");
    if (remote.test(url)) {
      if (image) throw new Error(`외부 이미지 직접 참조 금지: ${url}`);
      return;
    }
    if (url.startsWith("#") || (url.startsWith("/") && !image)) return;
    if (image || extname(url.split(/[?#]/)[0])) assets.add(url);
  }
  walk(tree, node => {
    if (node.type === "image" || node.type === "link")
      add(node.url, node.type === "image");
    if (node.type === "imageReference" || node.type === "linkReference") {
      const url = definitions.get(node.identifier.toLowerCase());
      if (!url && node.type === "imageReference")
        throw new Error(`정의 없는 이미지 참조: ${node.identifier}`);
      if (url) add(url, node.type === "imageReference");
    }
    if (
      portable &&
      node.type === "code" &&
      /^(mermaid|plantuml|d2)$/.test(node.lang ?? "")
    )
      throw new Error(
        "다이어그램 코드는 assets 원본에 보관하고 렌더한 SVG/PNG를 Markdown 이미지로 삽입하세요."
      );
    if (node.type === "html") {
      walk(parseFragment(node.value), element => {
        const attrs = Object.fromEntries(
          (element.attrs ?? []).map(a => [a.name, a.value])
        );
        if (
          portable &&
          /^(script|iframe|object|embed|video|audio|svg|style|link)$/.test(
            element.tagName ?? ""
          )
        )
          throw new Error(`Markdown 내보내기 미지원 요소: ${element.tagName}`);
        if (
          portable &&
          Object.keys(attrs).some(
            key => key === "style" || key.startsWith("on")
          )
        )
          throw new Error(
            "본문 HTML의 style/이벤트 속성 대신 Markdown 이미지와 설명을 사용하세요."
          );
        if (element.tagName === "a" && attrs.href) add(attrs.href);
        if (element.tagName === "img" || element.tagName === "source") {
          if (attrs.src) add(attrs.src, true);
          if (attrs.srcset)
            throw new Error(
              "srcset 대신 단일 로컬 이미지와 설명을 사용하세요."
            );
        }
      });
    }
  });
  if (portable && /^(?:import|export)\s|<[A-Z][\w.]*(?:\s|\/?>)/m.test(body))
    throw new Error(
      "MDX 컴포넌트를 삭제하지 마세요. 완전한 _export.md 대체 본문이 필요합니다."
    );
  return [...assets];
}
export function checkSvg(text, name) {
  if (/<(?:script|foreignObject|iframe)\b|\bon\w+\s*=/i.test(text))
    throw new Error(`실행 가능한 SVG 요소 금지: ${name}`);
  for (const match of text.matchAll(
    /(?:\b(?:href|xlink:href)\s*=\s*["']([^"']+)|url\(\s*["']?([^)'"\s]+))/gi
  )) {
    const url = match[1] ?? match[2];
    if (
      !url.startsWith("#") &&
      !/^data:(?:image\/(?:png|jpeg|gif|webp)|application\/font-woff|font\/woff2?);base64,/.test(
        url
      )
    )
      throw new Error(
        `SVG는 외부 파일을 불러올 수 없습니다: ${name} (${url.slice(0, 100)})`
      );
  }
  if (/@import\b/i.test(text)) throw new Error(`SVG 외부 스타일 금지: ${name}`);
}
async function filesIn(root) {
  const out = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isSymbolicLink())
      throw new Error(`심볼릭 링크 첨부 금지: ${entry.name}`);
    const path = join(root, entry.name);
    if (entry.isDirectory()) out.push(...(await filesIn(path)));
    else out.push(path);
  }
  return out;
}
export async function packageArticle(file) {
  const root = dirname(resolve(file));
  const original = await readFile(file, "utf8");
  const { data } = splitDocument(original);
  markdownAssets(splitDocument(original).body, {
    portable: false,
  });
  let content = original;
  if (extname(file) === ".mdx") {
    try {
      content = await readFile(join(root, "_export.md"), "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }
  let manifest = null;
  try {
    manifest = JSON.parse(
      await readFile(join(root, "visual-assets.json"), "utf8")
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  // The site renders Mermaid directly. Offline exports use a registered image
  // only when its editable source exactly matches the inline definition.
  const diagramNodes = [];
  walk(parser.parse(content), node => {
    if (node.type === "code" && node.lang === "mermaid")
      diagramNodes.push(node);
  });
  for (const node of diagramNodes.reverse()) {
    let matched;
    for (const asset of manifest?.assets ?? []) {
      if (!/\.(?:mmd|mermaid)$/i.test(asset.source ?? "")) continue;
      const source = await containedFile(root, asset.source);
      const definition = await readFile(source.path, "utf8");
      if (definition.replaceAll("\r\n", "\n").trim() === node.value.trim()) {
        matched = asset;
        break;
      }
    }
    if (!matched)
      throw new Error(
        "Mermaid 내보내기에는 코드와 일치하는 원본·정적 그림을 visual-assets.json에 등록하세요."
      );
    const alt = matched.alt.replace(/[\[\]\r\n]/g, " ");
    const replacement = `![${alt}](${matched.file})`;
    content =
      content.slice(0, node.position.start.offset) +
      replacement +
      content.slice(node.position.end.offset);
  }
  const { body } = splitDocument(content);
  const names = new Set(markdownAssets(body));
  if (manifest) {
    names.add("visual-assets.json");
    for (const item of manifest.assets ?? []) {
      if (!item.file || !item.alt)
        throw new Error("visual-assets.json: file과 alt가 필요합니다.");
      names.add(item.file);
      if (item.source) names.add(item.source);
      if (/\.gif$/i.test(item.file) && !item.poster)
        throw new Error(`GIF에는 정적 poster가 필요합니다: ${item.file}`);
      if (item.poster) names.add(item.poster);
      if (
        /\.gif$/i.test(item.file) &&
        (!body.includes(item.poster) || !body.includes(item.file))
      )
        throw new Error("GIF와 정적 대체 그림을 모두 본문에 삽입하세요.");
    }
  }
  // Include editable originals and attribution with images, without including unrelated post files.
  try {
    for (const path of await filesIn(join(root, "assets")))
      names.add(slash(relative(root, path)));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const entries = { "index.md": strToU8(content) };
  for (const name of names) {
    const asset = await containedFile(root, name);
    const bytes = new Uint8Array(await readFile(asset.path));
    if (/\.svg$/i.test(name)) checkSvg(new TextDecoder().decode(bytes), name);
    if (
      /\.gif$/i.test(name) &&
      !manifest?.assets?.some(
        item =>
          item.file.replace(/^\.\//, "") === name.replace(/^\.\//, "") &&
          item.poster
      )
    )
      throw new Error(
        `GIF 정적 대체 그림을 visual-assets.json에 등록하세요: ${name}`
      );
    entries[asset.name] = bytes;
  }
  return {
    data,
    content,
    entries,
    zip: zipSync(entries, {
      level: 6,
      mtime: new Date("2026-01-01T00:00:00Z"),
    }),
  };
}
export async function buildExports(
  root = "src/content/posts",
  output = "public/exports"
) {
  const manifest = {};
  const pending = [];
  for (const file of await filesIn(resolve(root))) {
    if (!/[/\\][^_][^/\\]*\.mdx?$/.test(file)) continue;
    const packed = await packageArticle(file);
    if (!packed) {
      console.warn(`내보내기 생략 (_export.md 없음): ${file}`);
      continue;
    }
    if (!isPublishTimePassed(packed.data.pubDatetime)) {
      console.log(`예약 글 내보내기 보류: ${file}`);
      continue;
    }
    const locale = relative(resolve(root), file).split(sep)[0];
    const key = packed.data.key;
    if (
      !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(locale) ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key ?? "")
    )
      throw new Error(`내보내기 locale/key 오류: ${file}`);
    const id = `${locale}/${key}`;
    if (manifest[id]) throw new Error(`중복 내보내기: ${id}`);
    manifest[id] = {
      markdown: `/exports/${id}/index.md`,
      bundle: `/exports/${id}/article.zip`,
    };
    pending.push({ id, packed });
  }
  // Only remove this dedicated generated directory after every article validates.
  const target = resolve(output);
  if (target !== resolve("public/exports"))
    throw new Error("사이트 내보내기는 public/exports에만 씁니다.");
  await rm(target, { recursive: true, force: true });
  for (const { id, packed } of pending) {
    const dest = join(target, id);
    await mkdir(dest, { recursive: true });
    for (const [name, bytes] of Object.entries(packed.entries)) {
      await mkdir(dirname(join(dest, name)), { recursive: true });
      await writeFile(join(dest, name), bytes);
    }
    await writeFile(join(dest, "article.zip"), packed.zip);
  }
  await mkdir(target, { recursive: true });
  await writeFile(
    join(target, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  console.log(`Markdown/ZIP 내보내기 ${pending.length}건 검증·생성`);
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [file, output] = process.argv.slice(2);
  if (file) {
    const packed = await packageArticle(file);
    if (!packed)
      throw new Error("완전한 _export.md가 없는 MDX는 내보내지 않습니다.");
    if (!output?.endsWith(".zip"))
      throw new Error(
        "사용법: node scripts/content-export.mjs 원고.md 출력.zip"
      );
    await mkdir(dirname(resolve(output)), { recursive: true });
    await writeFile(output, packed.zip);
    console.log(
      `본문과 자산 ${Object.keys(packed.entries).length}개: ${output}`
    );
  } else await buildExports();
}
