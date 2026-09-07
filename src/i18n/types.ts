export interface UIStrings {
  nav: {
    home: string;
    posts: string;
    tags: string;
    about: string;
    archives: string;
    search: string;
  };
  post: {
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
