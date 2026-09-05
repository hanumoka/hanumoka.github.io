---
title: '이 사이트는 어떻게 만들어졌는가'
description: 'Astro와 GitHub Pages로 세운 구성, 그리고 Gatsby를 버린 이유.'
pubDatetime: 2026-09-05T16:00:00+09:00
kind: snippet
tags: [astro, github-pages, ci]
---

이 사이트의 구성 기록이다. 파이프라인이 실제로 도는지 확인하려고 처음 쓴 글이기도 하다.

## 구성

| 층 | 무엇 |
|---|---|
| 생성기 | Astro 7 |
| 배포 | GitHub Actions → GitHub Pages |
| 폰트 | 시스템 폰트만 |
| 의존성 | `astro`, `@astrojs/sitemap`, `@astrojs/rss` |

## Gatsby를 버렸다

이 저장소의 이전 판은 `gatsby-starter-default`로 만든 블로그였다. 2022년 11월에 만들어 2023년 5월에 멈췄고, 그 사이 커밋이 150건인데 **글은 한 편**이었다.

Gatsby 자체도 지금은 고를 이유가 없다. 2023년 Netlify 인수 뒤 코어 팀이 흩어졌고, 마지막 릴리스 이후 수개월째 후속이 없으며, 강점이던 플러그인 생태계가 대부분 방치됐다. Node를 올릴 때마다 의존성이 깨지는데 아무도 고쳐 주지 않는다.

## 스키마가 빌드를 깨뜨리게 했다

글의 frontmatter를 Zod 스키마로 검사한다. 제목이나 설명이 비면 **빌드가 실패한다.**

```ts
const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});
```

형식을 통일하려는 것이 아니라 **반쪽짜리 글이 조용히 공개되는 것을 막으려는** 것이다. 통과시키는 검사는 검사가 아니다.

## 폰트를 싣지 않았다

한글 웹폰트는 가볍지 않다. 그리고 공개 저장소는 그 자체로 배포라서, 제3자 폰트를 실으면 라이선스 고지 의무가 따라온다. 시스템 폰트만 쓰면 실어 나르는 제3자 자산이 0이다.

## 배포에서 한 번 헤맨 것

Pages의 소스를 브랜치에서 다른 브랜치로 **바꾸는 것만으로는 재빌드가 걸리지 않는다.** 설정은 바뀌었는데 서빙되는 내용은 그대로라 잠깐 원인을 잘못 짚었다. 빌드를 명시적으로 요청해야 했다.

지금은 Actions 워크플로가 `main` 푸시마다 빌드하므로 이 문제가 없다.
