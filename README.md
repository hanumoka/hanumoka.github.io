# hanumoka.github.io

[https://hanumoka.github.io](https://hanumoka.github.io) — 개인 사이트.

## 스택

| 층 | 무엇 |
|---|---|
| 생성기 | **Astro 7** |
| 배포 | GitHub Actions → GitHub Pages |
| 검색 | **Pagefind** — 빌드 때 색인, 브라우저에서 실행. 서버·외부 API 없음 |
| 폰트 | **시스템 폰트만** — 실어 나르는 제3자 자산이 없다 |
| 의존성 | `astro`, `@astrojs/sitemap`, `@astrojs/rss`, `astro-pagefind` |

**Gatsby는 쓰지 않는다.** 이 저장소의 이전 판이 그것이었고, 2023년 Netlify 인수 뒤
코어 팀이 흩어져 지금은 사실상 유지보수가 멈췄다. 플러그인 생태계도 대부분 방치됐다.

## 개발

```shell
npm install
npm run dev      # 로컬 서버
npm run build    # dist/ 로 정적 빌드
npm run preview  # 빌드 결과 확인
```

Node 22.12 이상이 필요하다.

## 글 쓰기

`src/content/posts/`에 마크다운을 둔다. 파일 이름이 그대로 URL이 된다
(`2026-09-05-site-setup.md` → `/posts/2026-09-05-site-setup/`).

```markdown
---
title: '제목'
description: '목록 카드와 메타 설명에 쓰는 한 문장'
pubDate: 2026-09-05
updatedDate: 2026-09-10        # 선택
kind: troubleshooting          # 선택 — til | troubleshooting | concept | snippet | agent-issue
tags: [git, windows]           # 선택
sourceNote: 'docs/knowledge/…' # 선택 — 파생 추적 (아래 참조)
draft: false                   # true면 배포에서 제외
---
```

★ **frontmatter는 Zod 스키마로 검사하며, 어기면 빌드가 실패한다.** 형식을 통일하려는
것이 아니라 반쪽짜리 글이 조용히 공개되는 것을 막으려는 것이다. 스키마 정본은
`src/content.config.ts`에 있다.

## 콘텐츠는 어디서 오는가

**글의 정본은 이 저장소가 아니다.** 별도의 비공개 문서 허브에서 관리하고, 그중 공개할
것만 골라 이곳으로 옮긴다. `sourceNote`가 그 관계를 기록한다.

★ **옮기는 것은 복사가 아니라 재작성이다.** 정본은 자신을 위해 쓰였고 공개본은 남을
위해 쓰이므로 맥락이 다시 붙어야 한다. 그래서 자동 동기화하지 않으며, `sourceNote`는
사람이 출처를 따라갈 수 있게만 한다.

허브 밖에서 새로 쓴 글이면 `sourceNote`를 비운다.

## 분류

`tags`와 `kind`로 두 축을 만든다. 페이지는 글에서 자동으로 생성되므로 따로 관리할
목록이 없다.

| 경로 | 무엇 |
|---|---|
| `/tags/` | 태그 전체와 각 태그의 글 수 |
| `/tags/{태그}/` | 그 태그의 글 |
| `/kinds/{종류}/` | 그 종류의 글 (`til`·`troubleshooting`·`concept`·`snippet`·`agent-issue`) |

`kind` 값은 영문으로 저장하고 화면 표시만 한글로 옮긴다(`src/lib/posts.ts`의
`KIND_LABEL`). 값 자체를 한글로 두면 문서 허브의 계약과 갈라진다.

## 검색 — 한국어 동작 실측

Pagefind는 빌드가 끝난 HTML을 훑어 색인을 만들고 검색은 브라우저에서 돈다.
`data-pagefind-body`가 달린 **글 본문만** 색인한다 — 목록·태그 페이지는 빠진다.

★ **Pagefind는 한국어를 형태소 분석하지 않는다.** 색인 토큰이 어절 그대로다
(`검사가`·`검사는`·`검사한다`가 각각 별개). 그런데도 쓸 만한 이유는 **접두 일치**가
조사 문제를 덮어 주기 때문이다. 2026-09-05 실측:

| 질의 | 결과 |
|---|---|
| `검사` | ✅ `검사가`·`검사는`·`검사한다`를 찾음 |
| `배포` | ✅ `배포라서`·`배포에서`를 찾음 |
| `깨뜨` · `스키` · `라이선` | ✅ 접두 일치 |
| `뜨린` · `키마` | ❌ **어절 중간부터는 못 찾음** |

**한계는 하나다** — 복합어 중간 매칭이 안 된다(`배포`로 `재배포`를 못 찾는다).
사용자가 보통 단어 앞부터 입력하므로 실사용에서는 크게 걸리지 않는다.

## 배포

`main`에 푸시하면 `.github/workflows/deploy.yml`이 빌드해서 Pages로 올린다.
Actions 탭에서 손으로 돌릴 수도 있다.

Pages 설정의 **빌드 소스가 「GitHub Actions」여야 한다.** 브랜치 빌드로 되어 있으면
워크플로가 성공해도 사이트가 바뀌지 않는다.

## 아직 없는 것

- **`LICENSE`.** 지금은 직접 쓴 파일뿐이라 제3자 고지 의무가 없지만, 공개 저장소는
  그 자체로 배포이므로 실제 콘텐츠가 쌓이기 전에 정해야 한다.
- 검색, 댓글, 분석.
