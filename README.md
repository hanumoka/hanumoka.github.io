# hanumoka.github.io

[https://hanumoka.github.io](https://hanumoka.github.io) — 개인 사이트.

## 스택

| 층     | 무엇                                                                                      |
| ------ | ----------------------------------------------------------------------------------------- |
| 생성기 | **Astro 7**                                                                               |
| 테마   | **[AstroPaper](https://github.com/satnaing/astro-paper)** (MIT, Sat Naing) 을 고쳐서 사용 |
| 배포   | GitHub Actions → GitHub Pages                                                             |
| 검색   | Pagefind. **정식 글만** 색인한다                                                          |
| 스타일 | Tailwind CSS 4                                                                            |

라이선스와 제3자 고지는 [`LICENSE`](LICENSE)와
[`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)에 있다. **공개 저장소는 그 자체로
배포이므로** 실려 나가는 자산의 고지를 그쪽에 모아 둔다. 고지 목록은 빌드가
`package-lock.json`에서 다시 만든다. 손으로 고치지 않는다.

## 개발

```shell
npm install
npm run dev      # 로컬 서버
npm run build    # 고지 생성 → 형식 검사 → dist/ 빌드 → Pagefind 색인
npm run preview  # 빌드 결과 확인
```

Node 22.12 이상이 필요하다. 배포 워크플로는 [`.nvmrc`](.nvmrc)의 `22.12.0`을
쓴다. 테마 원본은 pnpm을 쓰지만 이 저장소는 **npm**을 쓴다 —
`package-lock.json`을 커밋해 두고, CI는 `npm ci`로 맞춘다.

검색 색인은 `dist/` 안에만 만든다. 소스의 `public/`으로 되돌리지 않는다.
`scripts/index-search.mjs`가 정식 글의 본문만 Pagefind에 전달한다. 정식 글이
없으면 색인을 만들지 않고 검색 화면에 안내한다. 초안을 대신 색인하지 않는다.

## 설정

사이트 제목·설명·언어·기능 토글은 **[`astro-paper.config.ts`](astro-paper.config.ts)**
한 곳에서 정한다. `src/config.ts`는 거기에 기본값을 입혀 해석한 결과이므로 직접
고치지 않는다.

언어·글 종류·최상위 구역의 목록은 **[`src/catalog.ts`](src/catalog.ts)** 한 곳이
정본이다. 라우팅·스키마·헤더가 여기를 본다. `site.lang`은 그 기본 언어와 같아야
한다. 갈라지면 빌드가 `MissingLocaleError`로 죽는다.

한국어 UI 문자열은 [`src/i18n/lang/ko.ts`](src/i18n/lang/ko.ts)에 있다.
`src/i18n/index.ts`가 `lang/*.ts`를 glob으로 읽으므로 파일을 두는 것만으로 잡힌다.

## 메뉴

헤더에 보이는 길은 이것이다.

- **글** `/posts/` — 소유자가 검토하고 실습해 확인한 글
- **초안** `/drafts/` — 아직 확인 전인 글. 특히 AI가 먼저 쓴 글
- **글 구조** `/tree/` — 연재와 낱글
- **태그** `/tags/`
- **소개** `/about/`
- **아카이브** `/archives/`
- **검색** `/search/` — 정식 글만

정적 페이지는 `src/content/pages/{언어}/` 의 파일이 주소가 된다. 이력은
`_resume.md` 의 밑줄을 떼면 `/resume/` 이 생긴다.

종류 `/kinds/`와 연재 `/series/`는 헤더에 없고, 글 구조에서 연다.
연재 주소는 [`src/series.ts`](src/series.ts)의 영문 키다. 옛 한글 주소는
그 키로 넘긴다. 영어는 같은 나무를 `/en/` 아래에 둔다.

## 글 쓰기

**글 하나가 폴더 하나다.** 본문은 그 폴더의 `index.md` 또는 `index.mdx`이고, 그 글에 쓰는
이미지·GIF는 **같은 폴더에 둔다.** 공개 주소는 폴더 이름이 아니라 frontmatter의
`key`다. 지금 글은 키가 폴더 이름과 같아서 주소가 그대로다.

```
src/content/posts/ko/example-post-key/
  index.md          ← 본문
  contrast.png      ← 이 글에서만 쓰는 이미지
  frames.gif
```

★ **왜 폴더인가.** 이유가 둘이다. ① **글 단위로 관리된다** — 글을 지우면 그
글의 이미지도 같이 사라지고, 어느 이미지가 어느 글 것인지 헷갈릴 일이 없다.
② **VS Code에서 그대로 보인다** — 본문에서 `![](./contrast.png)`로 부르면
편집기가 파일 위치를 기준으로 상대 경로를 풀기 때문에 미리보기에 이미지가
뜬다. 자산을 공용 폴더에 모으면 이 둘이 다 깨진다.

언어는 그 위 단계다 — 한국어는 `posts/ko/`, 영어는 `posts/en/`. **같은 `key`가
같은 글의 두 언어판**이다.

```markdown
---
title: "제목"
key: example-post-key # 공개 주소 /posts/{key}/. 한번 공개하면 바꾸지 않는다
description: "목록과 메타 설명에 쓰는 한 문장"
pubDatetime: 2026-09-05T16:00:00+09:00
modDatetime: 2026-09-10T09:00:00+09:00 # 선택
tags: [git, windows]
kind: troubleshooting # 선택 — 아래 참조
series: building-this-site # 선택 — src/series.ts 의 영문 키
sourceNote: "docs/knowledge/…" # 선택 — 파생 추적
featured: false # 선택
draft: true # true면 초안. 공개되지만 /drafts/에 두고 검색·RSS에는 넣지 않는다
---
```

frontmatter는 Zod 스키마로 검사하며 **어기면 빌드가 실패한다.** 형식 통일이 목적이
아니라 반쪽짜리 글이 조용히 공개되는 것을 막으려는 것이다. 정본은
[`src/content.config.ts`](src/content.config.ts)에 있다.

### 초안과 정식

`draft: true`는 비공개가 아니다. GitHub Pages에 그대로 올라간다.

- **정식** (`draft: false`) — `/posts/` 목록. 검색·RSS·사이트맵의 기본 경로
- **초안** (`draft: true`) — `/drafts/` 목록. 글 주소는 같은 `/posts/{key}/`이고,
  본문 위에 초안이라고 적는다. 검색·RSS에는 넣지 않는다

소유자가 검토하고 실습해 확인한 뒤에만 `draft: false`로 바꾼다.

### Temporal 초안 연재와 휴지통

Temporal 초안은 `/drafts/series/temporal/`에서 `seriesOrder` 순으로 읽는다.
글 하단의 이전·다음 이동도 연재 순서를 따른다. 소유자가 한 편씩 검토하고
고도화를 요청하며, 확인을 마친 해당 글만 `draft: false`로 바꾼다.
정식 연재 `/series/temporal/`에는 정식 글만 포함한다.

`readingMinutes`는 본문·핵심 코드의 읽기 예상 시간이다. 설치와 실습 실행 시간은
포함하지 않는다. Temporal 글은 5~10분 읽기를 목표로 하고 실제 검토에서 조정한다.
42편을 한 번에 발행하거나 학습 완료로 취급하지 않는다.

이전 초안은 [휴지통](trash/README.md)에 보관한다. 본문과 자산을 삭제하지 않으며
사이트 빌드·검색·RSS에는 포함하지 않는다. 복구 경로와 원본 해시는
`trash/manifest.json`에 있다. 공개 저장소 파일의 열람 가능 여부는 변하지 않는다.

### 이미지와 GIF

본문에서 **상대 경로**로 부른다. Astro가 WebP로 바꾸고 크기를 줄인다.

```markdown
![대비 측정 결과](./contrast.png)
```

실측(2026-09-07): PNG 6,539 → 3,724 B, GIF 6,172 → **2,390 B**.
★ **애니메이션 GIF도 애니메이션이 살아 있는 WebP가 된다.** 변환에서 죽지 않는다.

`public/`에 두고 절대 경로로 부르면 손대지 않은 원본이 그대로 나가지만,
**글 단위 관리가 깨지므로 쓰지 않는다.** 원본 바이트를 그대로 내보내야 하는
경우에만 예외로 둔다.

### 다이어그램

` ```mermaid ` 코드 펜스로 쓴다. 라이브러리는 **다이어그램이 있는 글에서만**
내려간다.

★ **라벨에 슬래시가 있으면 큰따옴표로 감싼다** — `C["/posts/"]`. 감싸지 않으면
`[/ … /]`가 평행사변형 도형 문법으로 읽혀 `Syntax error in text`가 난다.

### 인터랙티브 글 (MDX)

일반 글은 Markdown으로 쓰고, 조작 가능한 그림이 필요한 글은 **`index.mdx`**로
쓴다. MDX 본문에서 Astro 컴포넌트를 import하면 정적 HTML과 해당 컴포넌트의
작은 스크립트를 함께 배포할 수 있다. GitHub Pages에서도 동작하며, 별도 서버나
React 런타임은 필요하지 않다. 외부 API 조회에는 API의 공개 범위·CORS·인증을
별도로 검토해야 하고, 비밀 키를 브라우저 코드에 넣으면 안 된다.

보관된 예시는
[`temporal-workflow-playground/index.mdx`](trash/posts/ko/temporal-workflow-playground/index.mdx)다.
공통 틀은 [`InteractiveFrame.astro`](src/components/interactive/InteractiveFrame.astro)에
있다. 기존 글의 URL·댓글 키·초안 규칙은 그대로 적용한다.

```mdx
import TemporalFlow from "@/components/interactive/TemporalFlow.astro";

여기에 설명을 쓰고 필요한 위치에 시각화를 넣는다.

<TemporalFlow />
```

- frontmatter에 **`wide: true`**를 넣으면 `data-wide`가 있는 블록만 넓어진다.
  본문은 기존 읽기 폭을 유지한다. `InteractiveFrame`이 이 속성을 제공한다.
- 공통 틀의 **`data-interactive`**는 본문 전용 제목 링크·이미지 확대·코드 복사
  스크립트와 시각화 내부 UI가 충돌하지 않게 한다.
- 글 전용 컴포넌트는 `src/components/interactive/`에 둔다. 스타일은 컴포넌트에
  한정하고, 다크·라이트 색상은 사이트의 CSS 변수를 사용한다.
- 자동 재생을 기본으로 켜지 않는다. 재생·정지·단계 이동과 키보드 조작을
  제공하고 `prefers-reduced-motion`을 존중한다. JavaScript가 꺼져도 설명과
  정적 그림이 남아야 한다.
- Astro의 페이지 전환을 고려해 custom element의 `disconnectedCallback`에서
  타이머와 이벤트 리스너를 정리한다. 화면을 떠났다 돌아와도 정상 동작해야 한다.
- 실제 서비스와 설명용 시뮬레이션을 명시적으로 구분한다. 모델의 계산은
  `npm run test:interactive`로, 배포 결과의 링크와 메타데이터는
  `npm run check:dist`로 확인한다. 모바일 화면과 실제 버튼 조작도 확인한다.

AI로 작성한 예시도 소유자의 내용 검토 전에는 `draft: true`를 유지한다.
이 규칙은 공개 초안의 배포를 막는 규칙이 아니다.

### 추가한 콘텐츠 필드

| 필드         | 왜                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `kind`       | 비공개 문서 허브의 지식 노트 `kind` 계약과 대응시킨다. `til` · `troubleshooting` · `concept` · `snippet` · `agent-issue` |
| `sourceNote` | 이 글이 허브의 어느 노트에서 나왔는지 기록한다                                                                           |
| `wide`       | 인터랙티브 그림만 넓은 폭으로 표시한다. 기본값 `false`                                                                   |

## 콘텐츠는 어디서 오는가

**글의 정본은 이 저장소가 아니다.** 별도의 비공개 문서 허브에서 관리하고, 그중
공개할 것만 골라 이곳으로 옮긴다. `sourceNote`가 그 관계를 기록한다.

★ **옮기는 것은 복사가 아니라 재작성이다.** 정본은 자신을 위해 쓰였고 공개본은 남을
위해 쓰이므로 맥락이 다시 붙어야 한다. 그래서 자동 동기화하지 않는다.

## 한국어 관련으로 손댄 것

- **`word-break: keep-all`** — 테마 기본값은 한글을 단어 중간에서 끊는다.
  `src/styles/global.css` 끝에 있다. 코드와 URL은 예외로 뒀다.
- **`ko.ts`** UI 문자열.
- **`i18n.locales`를 설정에서 파생.**

★ **Pagefind는 한국어를 형태소 분석하지 않는다.** 빌드 로그도 그렇게 말한다 —
_"Pagefind doesn't support stemming for the language ko."_ 그래도 쓸 만한 이유는
**접두 일치**가 조사 문제를 덮기 때문이다. 2026-09-05 실측:

| 질의   | 결과                                       |
| ------ | ------------------------------------------ |
| `검사` | ✅ `검사가` · `검사는` · `검사한다`를 찾음 |
| `배포` | ✅ `배포라서` · `배포에서`를 찾음          |
| `뜨린` | ❌ 어절 중간부터는 못 찾음                 |

한계는 복합어 중간 매칭 하나다(`배포`로 `재배포`를 못 찾는다).

## 배포

`main`에 푸시하면 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)이
`npm ci`로 의존성을 맞춘 뒤, 형식(Prettier)·린트·`astro check`·인터랙티브 모델 검사·생산 빌드·
`dist` 검사를 통과해야만 Pages로 올린다.

★ **Pages 설정의 빌드 소스가 「GitHub Actions」여야 한다.** 브랜치 빌드로 되어 있으면
워크플로가 성공해도 사이트가 바뀌지 않는다.

## 아직 정하지 않은 것

- **글(산문)의 라이선스.** `LICENSE`는 코드에 대한 것이다. 글을 어떤 조건으로 열지는
  아직 정하지 않았다.
