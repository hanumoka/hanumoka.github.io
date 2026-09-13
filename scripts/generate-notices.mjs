#!/usr/bin/env node
/**
 * `THIRD-PARTY-NOTICES.md`를 락파일에서 다시 쓴다.
 *
 *   node scripts/generate-notices.mjs
 *
 * 공개 저장소는 그 자체로 배포이므로, 실려 나가는 제3자 자산의 고지가
 * 락파일·벤더 파일과 어긋나면 안 된다. 목록을 손으로 유지하지 않는 이유다.
 *
 * npm 패키지 이름·버전·SPDX는 `package-lock.json`이 정본이다. 테마·아이콘·
 * Google Fonts 글꼴처럼 락파일 밖에 있는 것만 이 파일에 적는다.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCK_PATH = join(ROOT, "package-lock.json");
const OUT_PATH = join(ROOT, "THIRD-PARTY-NOTICES.md");

const REQUIRED = [
  "@fontsource/noto-sans-kr",
  "@pagefind/default-ui",
  "mermaid",
  "pagefind",
  "tailwindcss",
];

const LICENSE_FILES = [
  "LICENSE",
  "LICENSE.md",
  "LICENSE.txt",
  "license",
  "license.md",
];

const MIT_TEXT = `MIT License

Copyright (c) 2023 Sat Naing

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

if (!existsSync(LOCK_PATH)) {
  console.error("✗ package-lock.json 이 없습니다.");
  process.exit(2);
}

const lock = JSON.parse(readFileSync(LOCK_PATH, "utf8"));
const packages = lock.packages ?? {};

function packageName(path, meta) {
  if (meta.name) return meta.name;
  const parts = path.replace(/^node_modules\//, "").split("/node_modules/");
  return parts[parts.length - 1] ?? path;
}

function licenseValue(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.type) return String(value.type);
  return null;
}

function readNearbyLicense(pkgPath) {
  const dir = join(ROOT, pkgPath);
  const pkgJsonPath = join(dir, "package.json");
  if (existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
      const fromPkg = licenseValue(pkg.license);
      if (fromPkg) return fromPkg;
    } catch {
      /* package.json 이 깨져 있으면 락파일 쪽으로 돌아간다 */
    }
  }
  for (const name of LICENSE_FILES) {
    const file = join(dir, name);
    if (!existsSync(file)) continue;
    const head = readFileSync(file, "utf8").slice(0, 400);
    if (/MIT License/i.test(head) || /The MIT License/i.test(head)) {
      return "MIT";
    }
    if (/SIL Open Font License/i.test(head)) return "OFL-1.1";
    if (/Apache License/i.test(head)) return "Apache-2.0";
    if (/ISC License/i.test(head)) return "ISC";
    if (/BSD 3-Clause/i.test(head) || /BSD-3-Clause/i.test(head)) {
      return "BSD-3-Clause";
    }
  }
  return null;
}

function licenseOf(path, meta) {
  return licenseValue(meta.license) ?? readNearbyLicense(path) ?? "UNKNOWN";
}

function lockEntries() {
  const rows = [];
  for (const [path, meta] of Object.entries(packages)) {
    if (!path) continue;
    rows.push({
      path,
      name: packageName(path, meta),
      version: meta.version ?? "",
      license: licenseOf(path, meta),
      dependencies: {
        ...meta.dependencies,
        ...meta.optionalDependencies,
      },
    });
  }
  return rows;
}

function posixDirname(path) {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
}

function resolveDep(name, fromPath) {
  let dir = fromPath;
  while (dir) {
    const candidate = `${dir}/node_modules/${name}`;
    if (packages[candidate]) return candidate;
    dir = posixDirname(dir);
  }
  const root = `node_modules/${name}`;
  return packages[root] ? root : null;
}

function dependencyTree(rootName) {
  const rootPath = `node_modules/${rootName}`;
  if (!packages[rootPath]) {
    throw new Error(`락파일에 ${rootName} 이 없습니다.`);
  }
  const seen = new Set();
  const queue = [rootPath];
  while (queue.length) {
    const path = queue.shift();
    if (!path || seen.has(path)) continue;
    seen.add(path);
    const meta = packages[path] ?? {};
    const deps = {
      ...meta.dependencies,
      ...meta.optionalDependencies,
    };
    for (const dep of Object.keys(deps)) {
      const resolved = resolveDep(dep, path);
      if (resolved) queue.push(resolved);
    }
  }
  return [...seen]
    .map(path => {
      const meta = packages[path] ?? {};
      return {
        name: packageName(path, meta),
        version: meta.version ?? "",
        license: licenseOf(path, meta),
      };
    })
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name) || a.version.localeCompare(b.version)
    );
}

function uniquePackages(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.name}@${row.version}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, row);
      continue;
    }
    if (prev.license !== row.license) {
      prev.license = `${prev.license}; ${row.license}`;
    }
  }
  return [...map.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version)
  );
}

function groupByLicense(rows) {
  const groups = new Map();
  for (const row of rows) {
    const list = groups.get(row.license) ?? [];
    list.push(row);
    groups.set(row.license, list);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function fence(text) {
  return "```\n" + text.trimEnd() + "\n```";
}

function table(rows) {
  const lines = [
    "| 패키지 | 버전 | 라이선스 |",
    "| ------ | ---- | -------- |",
  ];
  for (const row of rows) {
    lines.push(`| \`${row.name}\` | ${row.version} | ${row.license} |`);
  }
  return lines.join("\n");
}

function readRequiredFile(rel) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) {
    throw new Error(`${rel} 이 없습니다. npm install 뒤에 다시 돌리세요.`);
  }
  return readFileSync(file, "utf8").trim();
}

const entries = lockEntries();
const missingRequired = REQUIRED.filter(
  name => !packages[`node_modules/${name}`]
);
if (missingRequired.length) {
  console.error(
    `✗ 락파일에 있어야 할 패키지가 없습니다: ${missingRequired.join(", ")}`
  );
  process.exit(1);
}

const unknown = uniquePackages(entries).filter(r => r.license === "UNKNOWN");
if (unknown.length) {
  console.error(
    `✗ SPDX 를 모르는 패키지:\n  ${unknown
      .map(r => `${r.name}@${r.version}`)
      .join("\n  ")}`
  );
  process.exit(1);
}

const mermaidTree = uniquePackages(dependencyTree("mermaid"));
const allPackages = uniquePackages(entries);
const oflText = readRequiredFile(
  "node_modules/@fontsource/noto-sans-kr/LICENSE"
);
const apacheText = readRequiredFile("node_modules/dompurify/LICENSE");
const bsdEase = readRequiredFile("node_modules/d3-ease/LICENSE");
const bsdSankey = readRequiredFile("node_modules/d3-sankey/LICENSE");
const bsdRw = readRequiredFile("node_modules/rw/LICENSE");
const iscD3 = readRequiredFile("node_modules/d3/LICENSE");
const unlicense = readRequiredFile("node_modules/robust-predicates/LICENSE");
const pagefindMit = readRequiredFile("node_modules/pagefind/LICENSE/LICENSE");
const mermaidMit = readRequiredFile("node_modules/mermaid/LICENSE");
const tailwindMit = readRequiredFile("node_modules/tailwindcss/LICENSE");
const notoMeta = packages["node_modules/@fontsource/noto-sans-kr"];
const mermaidMeta = packages["node_modules/mermaid"];
const pagefindMeta = packages["node_modules/pagefind"];
const pagefindUiMeta = packages["node_modules/@pagefind/default-ui"];
const tailwindMeta = packages["node_modules/tailwindcss"];

const lines = [];
const push = (...chunk) => lines.push(...chunk);

push(
  "<!-- 이 파일은 scripts/generate-notices.mjs 가 package-lock.json 에서 만든다. 직접 고치지 말 것. -->",
  "",
  "# 제3자 고지",
  "",
  "이 사이트는 정적 파일로 **배포**됩니다. 공개 저장소도 그 자체로 배포입니다.",
  "아래는 빌드 결과물과 이 저장소에 실려 나가는 제3자 자산의 고지입니다.",
  "",
  "npm 패키지의 이름·버전·라이선스 목록은 `scripts/generate-notices.mjs`가",
  "`package-lock.json`에서 다시 씁니다. 테마·아이콘·Google Fonts 글꼴처럼",
  "락파일 밖에 있는 것만 예외로 적습니다.",
  "",
  "---",
  "",
  "## AstroPaper (사이트 테마)",
  "",
  "이 저장소의 구조·레이아웃·스타일은 AstroPaper에서 가져와 고친 것입니다.",
  "",
  "- 저작자: Sat Naing",
  "- 출처: <https://github.com/satnaing/astro-paper>",
  "- 라이선스: MIT",
  "",
  fence(MIT_TEXT),
  "",
  "전문은 이 저장소의 [`LICENSE`](LICENSE)에도 그대로 있습니다.",
  "",
  "## Google Sans Code (웹폰트)",
  "",
  "라틴 본문과 코드에 쓰는 고정폭 글꼴입니다. Astro의 폰트 기능이 빌드 때",
  "내려받아 **자가 호스팅**하므로 폰트 파일이 사이트와 함께 배포됩니다.",
  "이 글꼴에는 한글 글리프가 없고, 한글은 아래 Noto Sans KR이 이어받습니다.",
  "",
  "공유 이미지(OG)용 ttf는 satori가 빌드 때 읽습니다. 그 얼굴에는 `<Font>`를",
  "걸지 않으므로 방문자의 `@font-face`에는 오르지 않습니다.",
  "",
  "- 저작자: The Google Sans Code Project Authors",
  "- 발행: Google LLC",
  "- 출처: <https://github.com/googlefonts/googlesans-code>",
  "- 라이선스: **SIL Open Font License 1.1**",
  "",
  "OFL은 재배포와 임베딩을 허용하되 저작권 고지 유지를 요구하며, **글꼴을 고치면",
  "이름을 바꾸어야 합니다.** 이 저장소는 글꼴을 고치지 않고 그대로 씁니다.",
  "전문은 아래 Noto Sans KR과 같습니다.",
  "",
  "## Noto Sans KR (웹폰트)",
  "",
  "한글 본문 글꼴입니다. 브라우저용은 `@fontsource/noto-sans-kr` " +
    `(${notoMeta.version})` +
    "의",
  "unicode-range 조각이고, `@font-face` 선언은 CSS 번들로 들어가 캐시됩니다.",
  "공유 이미지용은 Astro가 Google Fonts에서 받는 통짜 ttf이며, 그 변수에는",
  "`<Font>`를 걸지 않아 방문자가 내려받지 않습니다.",
  "",
  "- 패키지: `@fontsource/noto-sans-kr@" + notoMeta.version + "`",
  "- 저작자: Google Inc. / The Noto Project Authors",
  "- 출처: <https://fontsource.org/fonts/noto-sans-kr>",
  "- 라이선스: **SIL Open Font License 1.1** (`OFL-1.1`)",
  "",
  fence(oflText),
  "",
  "## Tabler Icons",
  "",
  "헤더·검색·페이지네이션 등에 쓰는 SVG는 Tabler Icons를 이 저장소에 복사한",
  "것입니다(`src/assets/icons/`). npm 패키지로 받지 않습니다.",
  "",
  "- 저작자: Paweł Kuna",
  "- 출처: <https://github.com/tabler/tabler-icons>",
  "- 라이선스: MIT",
  "",
  fence(`MIT License

Copyright (c) 2020-2025 Paweł Kuna

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`),
  "",
  "## Tailwind CSS",
  "",
  "페이지 스타일은 Tailwind CSS로 빌드되어 CSS 번들에 들어갑니다. 원본",
  "런타임이 그대로 실리는 것은 아니고, 산출 CSS가 실립니다.",
  "",
  `- 패키지: \`tailwindcss@${tailwindMeta.version}\``,
  "- 저작자: Tailwind Labs, Inc.",
  "- 출처: <https://github.com/tailwindlabs/tailwindcss>",
  "- 라이선스: MIT",
  "",
  fence(tailwindMit),
  "",
  "## Pagefind",
  "",
  "검색 런타임과 색인이 빌드 산출물 `dist/pagefind/`로 나갑니다. UI는",
  "`@pagefind/default-ui`입니다. 색인은 빌드가 만들고 저장소에는 두지 않습니다.",
  "",
  `- 패키지: \`pagefind@${pagefindMeta.version}\`, \`@pagefind/default-ui@${pagefindUiMeta.version}\``,
  "- 출처: <https://github.com/Pagefind/pagefind>",
  "- 라이선스: MIT",
  "",
  fence(pagefindMit),
  "",
  "## mermaid",
  "",
  "다이어그램이 있는 글에서만 본체를 받습니다. 그때 mermaid와 그 의존 패키지가",
  "JS 청크로 실립니다. 아래 목록은 `package-lock.json`에서 `mermaid`를 뿌리로",
  "걸어 만든 것입니다.",
  "",
  `- 패키지: \`mermaid@${mermaidMeta.version}\``,
  "- 저작자: Knut Sveidqvist",
  "- 출처: <https://github.com/mermaid-js/mermaid>",
  "- 라이선스: MIT",
  "",
  fence(mermaidMit),
  "",
  "`dompurify`는 `MPL-2.0 OR Apache-2.0`입니다. 이 사이트는 **Apache-2.0을",
  "고릅니다.**",
  "",
  "### mermaid가 끌어오는 패키지",
  "",
  table(mermaidTree),
  "",
  "## 락파일 라이선스 목록",
  "",
  `\`${lock.name}@${lock.version}\`의 \`package-lock.json\`(lockfileVersion ${lock.lockfileVersion})에서`,
  `고른 패키지 ${allPackages.length}개입니다. 이 목록의 패키지가 모두 사이트에`,
  "실리는 것은 아닙니다. 실리는 것은 위 절에 적었습니다. 빌드 기계에서만 쓰는",
  "것(이미지 변환용 libvips, CSS 변환기, 형식 검사기 등)의 바이너리는 저장소에도",
  "사이트에도 실리지 않습니다.",
  ""
);

for (const [license, rows] of groupByLicense(allPackages)) {
  push(`### ${license}`, "");
  for (const row of rows) {
    push(`- \`${row.name}@${row.version}\``);
  }
  push("");
}

push(
  "## 그 밖에, mermaid 의존 패키지 중 MIT가 아닌 전문",
  "",
  "위 표에서 MIT가 아닌 항목 가운데 산출물 JS에 함께 실릴 수 있는 것들입니다.",
  "",
  "### ISC (d3)",
  "",
  fence(iscD3),
  "",
  "### BSD-3-Clause (d3-ease)",
  "",
  fence(bsdEase),
  "",
  "### BSD-3-Clause (d3-sankey)",
  "",
  fence(bsdSankey),
  "",
  "### BSD-3-Clause (rw)",
  "",
  fence(bsdRw),
  "",
  "### Apache-2.0 (DOMPurify — 이 사이트가 고른 쪽)",
  "",
  fence(apacheText),
  "",
  "### Unlicense (robust-predicates)",
  "",
  fence(unlicense),
  "",
  "---",
  "",
  "**이 문서를 두는 이유**는 공개 저장소를 그 자체로 배포로 보기 때문입니다.",
  "이전에 다른 저장소에서 MIT 자산을 고지 없이 재배포한 일이 있었고, 그때 세운",
  "규칙을 여기서 지킵니다.",
  ""
);

writeFileSync(OUT_PATH, lines.join("\n"), "utf8");
console.log(
  `THIRD-PARTY-NOTICES.md: 패키지 ${allPackages.length}개 · mermaid 트리 ${mermaidTree.length}개`
);
