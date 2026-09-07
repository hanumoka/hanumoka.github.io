import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
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
import config from "./astro-paper.config";

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
        config.features?.showArchives !== false || !page.endsWith("/archives/"),
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
      formats: ["woff", "ttf"],
    },
    {
      // 이 폰트가 한글 본문을 담당한다. Google Sans Code는 라틴 전용이라
      // 한글 글리프가 하나도 없고(cmap 확인: A 있음 / 가·한·ㄱ 없음),
      // 그동안 한글은 브라우저 기본 monospace로 떨어지고 있었다.
      name: "Noto Sans KR",
      cssVariable: "--font-noto-sans-kr",
      provider: fontProviders.google(),
      // 한글만 받는다. 라틴은 앞의 Google Sans Code가 이미 담당한다.
      subsets: ["korean"],
      // ★ 400 하나만 적는다. 굵게를 포기한 것이 아니라 이 폰트로는 못 받는다.
      //
      // Google Fonts의 Noto Sans KR은 **가변 폰트**라 wght 400과 700이 같은
      // 파일 124개를 가리킨다(직접 조회해 확인). Astro가 중복을 합쳐 얼굴을
      // 하나만 내고 `font-weight: 400`으로 적으므로, 굵은 한글은 브라우저가
      // 합성해 그린다. `[400, 700]`·`["400 700"]`·`["100 900"]` 셋 다 시도했고
      // 전부 400 하나만 나왔다.
      //
      // ★ 진짜 굵기를 원하면 `provider`를 `fontProviders.fontsource()`로 바꾸면
      // 된다. 400·700이 각각 실제 파일로 온다. **대신 unicode-range 분할이
      // 사라진다** — 실측으로 방문당 내려받는 양이 이렇게 갈렸다.
      //
      //   google     : 조각 120개 중 필요한 것만 →   270 KB (합성 굵게)
      //   fontsource : 통짜 두 벌            → 1,075 KB (진짜 굵게)
      //
      // 4배 차이라 작은 쪽을 골랐다. 굵기 품질이 더 중요하다고 판단하면
      // 이 한 줄만 바꾸면 되돌아간다.
      weights: [400],
      styles: ["normal"],
      fallbacks: [],
      // woff2 하나만 받는다. 2016년 이후 모든 대상 브라우저가 지원하고,
      // 포맷을 셋으로 두었더니 폰트 산출물이 31MB가 됐다.
      formats: ["woff2"],
    },
    {
      // ★ OG 이미지(satori) 전용. 위 항목과 같은 폰트지만 통짜 ttf 로 받는다.
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
