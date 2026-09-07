export interface UIStrings {
  nav: {
    home: string;
    posts: string;
    /** 글·연재 전체 트리 */
    tree: string;
    tags: string;
    about: string;
    archives: string;
    search: string;
  };
  post: {
    /** 글 아래 댓글 구역의 제목. */
    comments: string;
    publishedAt: string;
    updatedAt: string;
    sharePostIntro: string;
    sharePostOn: string;
    sharePostViaEmail: string;
    tagLabel: string;
    backToTop: string;
    goBack: string;
    editPage: string;
    previousPost: string;
    nextPost: string;
    /** 글의 제목 트리(목차) 제목 */
    tableOfContents: string;
    /** 글 안의 연재 상자 제목. {{series}} 는 연재 이름이다. */
    inSeries: string;
    /** "N편 중 M번째". {{index}} 와 {{total}} */
    seriesPosition: string;
    /** 지금 읽고 있는 편임을 스크린리더에 알린다 */
    currentPost: string;
  };
  pagination: {
    prev: string;
    next: string;
    page: string;
  };
  home: {
    socialLinks: string;
    featured: string;
    recentPosts: string;
    allPosts: string;
  };
  footer: {
    copyright: string;
    allRightsReserved: string;
  };
  /**
   * 날짜 표시 형식(dayjs 토큰). 언어마다 다르므로 언어 파일이 정본이다.
   * 하드코딩하면 한국어 사이트에 영어 월 약어가 나온다 — 실제로 그랬다.
   */
  dateFormat: string;
  /**
   * 사이트 한 줄 설명. `astro-paper.config.ts` 의 `site.description` 은 한 벌뿐이라
   * 그대로 쓰면 영어 페이지의 meta description 과 OG 카드가 한국어로 나간다.
   */
  siteDescription: string;
  pages: {
    tagTitle: string;
    tagDesc: string;

    tagsTitle: string;
    tagsDesc: string;

    postsTitle: string;
    postsDesc: string;

    archivesTitle: string;
    archivesDesc: string;

    searchTitle: string;
    searchDesc: string;

    kindTitle: string;
    kindDesc: string;

    kindsTitle: string;
    kindsDesc: string;

    seriesTitle: string;
    seriesDesc: string;

    /** 글·연재 전체를 한 트리로 보는 페이지 */
    treeTitle: string;
    treeDesc: string;
    /** 어느 연재에도 속하지 않는 글 묶음 */
    standalonePosts: string;
    /** 트리에 아무것도 없을 때 */
    treeEmpty: string;
    /** 연재 하나의 페이지 제목 */
    seriesOneTitle: string;
    seriesOneDesc: string;

    /** 분류 축이 셋이라 「A · B 로도 볼 수 있다」 형태로 나열한다. */
    alsoBrowseBy: string;
  };
  /**
   * 글의 종류 이름. 값(`til` 등)은 비공개 문서 허브의 `kind` 계약과 같아야 하므로
   * 영문 그대로 두고, 화면에 보이는 이름만 여기서 옮긴다.
   */
  kinds: {
    til: string;
    troubleshooting: string;
    concept: string;
    snippet: string;
    "agent-issue": string;
  };
  a11y: {
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    toggleTheme: string;
    /** 언어 전환 버튼. {{language}} 는 바뀔 언어 이름이다. */
    switchTo: string;
    /** 이 글의 번역이 아직 없을 때 버튼에 붙는 설명. */
    noTranslationYet: string;
    searchPlaceholder: string;
    noResults: string;
    goToPreviousPage: string;
    goToNextPage: string;
  };
  notFound: {
    title: string;
    message: string;
    goHome: string;
  };
}
