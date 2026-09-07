# hanumoka.github.io

[https://hanumoka.github.io](https://hanumoka.github.io) — 개인 사이트.

## 스택

| 층 | 무엇 |
|---|---|
| 생성기 | **Astro 7** |
| 테마 | **[AstroPaper](https://github.com/satnaing/astro-paper)** (MIT, Sat Naing) 을 고쳐서 사용 |
| 배포 | GitHub Actions → GitHub Pages |
| 검색 | Pagefind (테마 기본값) |
| 스타일 | Tailwind CSS 4 |

라이선스와 제3자 고지는 [`LICENSE`](LICENSE)와
[`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)에 있다. **공개 저장소는 그 자체로
배포이므로** 실려 나가는 자산의 고지를 그쪽에 모아 둔다.

## 개발

```shell
npm install
npm run dev      # 로컬 서버
npm run build    # dist/ 로 정적 빌드
npm run preview  # 빌드 결과 확인
```

Node 22.12 이상이 필요하다. 테마 원본은 pnpm을 쓰지만 이 저장소는 **npm**을 쓴다 —
배포 Action이 락파일을 보고 패키지 매니저를 판별하므로 `package-lock.json`을
커밋해 둔다.

## 설정

사이트 제목·설명·언어·기능 토글은 **[`astro-paper.config.ts`](astro-paper.config.ts)**
한 곳에서 정한다. `src/config.ts`는 거기에 기본값을 입혀 해석한 결과이므로 직접
고치지 않는다.

★ **`site.lang`을 바꾸면 `astro.config.ts`의 `i18n.locales`도 따라가야 한다.** 그래서
그쪽이 이 값을 파생해 쓰도록 고쳐 두었다 — 두 곳에 적으면 갈라지고, 갈라지면 빌드가
`MissingLocaleError`로 죽는다.

한국어 UI 문자열은 [`src/i18n/lang/ko.ts`](src/i18n/lang/ko.ts)에 있다.
`src/i18n/index.ts`가 `lang/*.ts`를 glob으로 읽으므로 파일을 두는 것만으로 잡힌다.

## 글 쓰기

**글 하나가 폴더 하나다.** 본문은 그 폴더의 `index.md`이고, 그 글에 쓰는
이미지·GIF는 **같은 폴더에 둔다.** 폴더 이름이 그대로 URL이 된다.

```
src/content/posts/ko/2026-09-07-media-test/
  index.md          ← 본문
  contrast.png      ← 이 글에서만 쓰는 이미지
  frames.gif
```

★ **왜 폴더인가.** 이유가 둘이다. ① **글 단위로 관리된다** — 글을 지우면 그
글의 이미지도 같이 사라지고, 어느 이미지가 어느 글 것인지 헷갈릴 일이 없다.
② **VS Code에서 그대로 보인다** — 본문에서 `![](./contrast.png)`로 부르면
편집기가 파일 위치를 기준으로 상대 경로를 풀기 때문에 미리보기에 이미지가
뜬다. 자산을 공용 폴더에 모으면 이 둘이 다 깨진다.

언어는 그 위 단계다 — 한국어는 `posts/ko/`, 영어는 `posts/en/`. **같은 폴더
이름이 같은 글의 두 언어판**이다.


```markdown
---
title: '제목'
description: '목록과 메타 설명에 쓰는 한 문장'
pubDatetime: 2026-09-05T16:00:00+09:00
modDatetime: 2026-09-10T09:00:00+09:00   # 선택
tags: [git, windows]
kind: troubleshooting                    # 선택 — 아래 참조
sourceNote: 'docs/knowledge/…'           # 선택 — 파생 추적
featured: false                          # 선택
draft: false                             # true면 배포 제외
---
```

frontmatter는 Zod 스키마로 검사하며 **어기면 빌드가 실패한다.** 형식 통일이 목적이
아니라 반쪽짜리 글이 조용히 공개되는 것을 막으려는 것이다. 정본은
[`src/content.config.ts`](src/content.config.ts)에 있다.

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

### 테마에 없는 필드 둘을 더했다

| 필드 | 왜 |
|---|---|
| `kind` | 비공개 문서 허브의 지식 노트 `kind` 계약과 대응시킨다. `til` · `troubleshooting` · `concept` · `snippet` · `agent-issue` |
| `sourceNote` | 이 글이 허브의 어느 노트에서 나왔는지 기록한다 |

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
*"Pagefind doesn't support stemming for the language ko."* 그래도 쓸 만한 이유는
**접두 일치**가 조사 문제를 덮기 때문이다. 2026-09-05 실측:

| 질의 | 결과 |
|---|---|
| `검사` | ✅ `검사가` · `검사는` · `검사한다`를 찾음 |
| `배포` | ✅ `배포라서` · `배포에서`를 찾음 |
| `뜨린` | ❌ 어절 중간부터는 못 찾음 |

한계는 복합어 중간 매칭 하나다(`배포`로 `재배포`를 못 찾는다).

## 배포

`main`에 푸시하면 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)이
빌드해서 Pages로 올린다.

★ **Pages 설정의 빌드 소스가 「GitHub Actions」여야 한다.** 브랜치 빌드로 되어 있으면
워크플로가 성공해도 사이트가 바뀌지 않는다.

## 아직 정하지 않은 것

- **글(산문)의 라이선스.** `LICENSE`는 코드에 대한 것이다. 글을 어떤 조건으로 열지는
  아직 정하지 않았다.
