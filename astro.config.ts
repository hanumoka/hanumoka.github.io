import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { remarkMermaid } from "./src/utils/remarkMermaid";
import config from "./astro-paper.config";

// 사이트맵 필터는 HTML 이 다 쓰인 뒤(astro:build:done) 돈다. 그래서 빌드된 페이지에
// robots noindex 가 붙었는지 직접 읽어 판정할 수 있다. 판정을 두 곳(페이지·설정)에
// 따로 적지 않으려는 것이다. 기본값 outDir "dist" 와 build.format "directory" 를 전제한다.
const DIST = fileURLToPath(new URL("./dist/", import.meta.url));
const isNoindex = (pageUrl: string) => {
  const file = join(
    DIST,
    decodeURIComponent(new URL(pageUrl).pathname),
    "index.html"
  );
  return (
    existsSync(file) &&
    /<meta name="robots" content="noindex/.test(readFileSync(file, "utf8"))
  );
};

// ★ `site.lang` 이 UI 문자열을 고르고 아래 `i18n.defaultLocale` 이 라우팅을 고른다.
// 둘이 갈라지면 Astro 가 MissingLocaleError 로 죽는데, 그 메시지만으로는 원인이
// 여기라는 것이 드러나지 않는다. 그래서 먼저 잡는다.
if (config.site.lang !== "ko") {
  throw new Error(
    `astro-paper.config.ts 의 site.lang 이 "${config.site.lang}" 인데 ` +
      `astro.config.ts 의 i18n.defaultLocale 은 "ko" 입니다. 둘을 같게 맞추세요.`
  );
}

export default defineConfig({
  site: config.site.url,
  integrations: [
    mdx(),
    sitemap({
      filter: page =>
        (config.features?.showArchives !== false ||
          !page.endsWith("/archives/")) &&
        !isNoindex(page),
      // 걸러지고 남은 주소끼리만 언어 짝을 짓는다(짝이 둘 이상일 때만 적는다).
      // 그래서 번역이 없는 글이나 빈 목록을 짝이라고 주장하지 않는다.
      i18n: { defaultLocale: "ko", locales: { ko: "ko", en: "en" } },
    }),
  ],
  i18n: {
    // 한국어가 기본이고 접두사가 없다(`/`), 영어는 `/en/` 아래에 선다.
    //
    // ★ `defaultLocale`은 `astro-paper.config.ts`의 `site.lang`과 반드시 같아야
    // 한다. 그 값이 UI 문자열을 고르는데 여기와 갈라지면 빌드가
    // MissingLocaleError로 죽는다 — 실제로 겪었다.
    locales: ["ko", "en"],
    // Astro 가 이 값을 `locales` 의 리터럴 유니온으로 좁히므로 `config.site.lang`
    // (string) 을 그대로 넣을 수 없다. 리터럴로 적되 아래 검사로 갈라짐을 막는다.
    defaultLocale: "ko",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        // 목차를 꽂을 제목을 한국어로도 받는다. 테마 기본값은 영어 제목만 보므로
        // 한글 글에 `## Table of contents`라고 써야 목차가 생겼다.
        [remarkToc, { heading: "목차|table[ -]of[ -]contents?" }],
        [remarkCollapse, { test: /목차|Table of contents/i }],
        // ★ Shiki 보다 먼저 돌아야 한다. 순서가 뒤집히면 다이어그램이
        // 문법 강조된 코드 블록이 되어 되돌릴 수 없다.
        remarkMermaid,
      ],
      rehypePlugins: [rehypeCallouts],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      // ★ 폴백을 비운다. 기본값 `["monospace"]`를 두면 이 CSS 변수가 generic
      // family로 끝나는데, generic family는 어떤 문자에도 매치되므로 뒤에 한글
      // 폰트를 이어 붙여도 브라우저가 그곳까지 내려가지 않는다. 한글 폰트는
      // `theme.css`의 `--font-app`에서 이 변수 다음에 놓는다.
      fallbacks: [],
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      // 웹용은 woff2 만 받는다. 공유 이미지(satori)는 woff2 를 못 읽으므로 ttf 는
      // 아래 `--font-google-sans-code-og` 항목이 따로 받는다.
      formats: ["woff2"],
    },
    {
      // ★ OG 이미지(satori) 전용. satori 는 woff2 를 읽지 못해 ttf 를 받는다.
      // `<Font>` 를 걸지 않으므로 방문자는 이 파일을 받지 않는다.
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code-og",
      provider: fontProviders.google(),
      fallbacks: [],
      weights: [400, 700],
      styles: ["normal"],
      formats: ["ttf"],
    },
    {
      // ★ OG 이미지(satori) 전용 한글. 브라우저용 한글은 Layout.astro 가 가져오는
      // Fontsource CSS 가 따로 싣는다. 이쪽은 통짜 ttf 를 받는다.
      // satori 는 woff2 를 읽지 못하고, unicode-range 조각 하나에는 제목의
      // 글자가 다 들어 있지도 않기 때문이다.
      //
      // ★ 이 변수에는 `<Font>` 컴포넌트를 걸지 않는다. 걸면 @font-face 가
      // 나가는데 이 얼굴에는 unicode-range 가 없어 모든 문자에 매치되고,
      // 방문자가 35KB 조각 대신 6MB 통짜 파일을 내려받게 된다.
      name: "Noto Sans KR",
      cssVariable: "--font-noto-sans-kr-og",
      provider: fontProviders.google(),
      subsets: ["korean"],
      weights: [400, 700],
      styles: ["normal"],
      fallbacks: [],
      formats: ["ttf"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
