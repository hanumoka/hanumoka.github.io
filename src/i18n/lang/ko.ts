import type { UIStrings } from "../types";

/**
 * 한국어 UI 문자열.
 *
 * `src/i18n/index.ts`가 `./lang/*.ts`를 glob으로 읽으므로 이 파일을 두는 것만으로
 * 잡힌다. 어느 것을 쓸지는 `astro-paper.config.ts`의 `site.lang`이 정한다.
 */
export default {
  nav: {
    tree: "글 구조",
    home: "홈",
    posts: "글",
    tags: "태그",
    about: "소개",
    archives: "아카이브",
    search: "검색",
  },
  post: {
    comments: "댓글",
    publishedAt: "작성",
    updatedAt: "수정",
    sharePostIntro: "이 글 공유하기:",
    sharePostOn: "{{platform}}에 공유",
    sharePostViaEmail: "메일로 공유",
    tagLabel: "태그",
    backToTop: "맨 위로",
    goBack: "뒤로",
    editPage: "이 문서 고치기",
    previousPost: "이전 글",
    nextPost: "다음 글",
    inSeries: "연재 「{{series}}」",
    seriesPosition: "{{total}}편 중 {{index}}번째",
    currentPost: "지금 읽는 글",
  },
  pagination: {
    prev: "이전",
    next: "다음",
    page: "페이지",
  },
  home: {
    socialLinks: "링크",
    featured: "골라 둔 글",
    recentPosts: "최근 글",
    allPosts: "글 전체",
  },
  footer: {
    copyright: "저작권",
    allRightsReserved: "모든 권리 보유.",
  },
  // dayjs 는 로케일을 따로 넣지 않으면 월을 영어 약어로 낸다.
  // 숫자만 쓰면 그 문제가 없고, 글 파일 이름(YYYY-MM-DD)과도 형식이 맞는다.
  dateFormat: "YYYY년 M월 D일",
  siteDescription:
    "백엔드 개발자 hanumoka의 블로그. 모르는 것과 궁금한 것을 정리하고, 개발자로 일하며 쌓이는 기술부채를 인식하고 학습하고 기록합니다.",
  pages: {
    tagTitle: "태그",
    tagDesc: "이 태그가 달린 글",

    tagsTitle: "태그",
    tagsDesc: "글에 쓰인 태그 전체입니다.",

    postsTitle: "글",
    postsDesc: "지금까지 쓴 글 전체입니다.",

    archivesTitle: "아카이브",
    archivesDesc: "날짜별로 모아 둔 글입니다.",

    searchTitle: "검색",
    searchDesc: "글을 검색합니다",

    kindTitle: "종류",
    kindDesc: "이 종류의 글",

    kindsTitle: "종류",
    kindsDesc: "글의 종류 전체입니다.",

    seriesTitle: "연재",
    seriesDesc: "이어서 쓴 글 묶음입니다.",

    treeTitle: "글 구조",
    treeDesc: "연재와 낱글을 한눈에 봅니다.",
    standalonePosts: "낱글",
    treeEmpty: "아직 글이 없습니다.",
    seriesOneTitle: "연재",
    seriesOneDesc: "이 연재의 글",

    alsoBrowseBy: "이렇게도 볼 수 있습니다 —",
  },
  kinds: {
    til: "배운 것",
    troubleshooting: "장애 대응",
    concept: "개념",
    snippet: "스니펫",
    "agent-issue": "AI 도구 이슈",
  },
  a11y: {
    skipToContent: "본문으로 건너뛰기",
    openMenu: "메뉴 열기",
    closeMenu: "메뉴 닫기",
    toggleTheme: "밝기 전환",
    switchTo: "{{language}}로 보기",
    noTranslationYet: "맞는 번역 페이지가 아직 없어 가까운 페이지로 갑니다",
    searchPlaceholder: "글 검색...",
    noResults: "결과가 없습니다",
    goToPreviousPage: "이전 페이지로",
    goToNextPage: "다음 페이지로",
  },
  notFound: {
    title: "404 Not Found",
    message: "그런 페이지는 없습니다",
    goHome: "홈으로",
  },
} satisfies UIStrings;
