import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://hanumoka.github.io/",
    title: "hanumoka",
    // ★ 화면과 피드에 나가는 설명은 여기가 아니라 `src/i18n/lang/*.ts` 의
    // `siteDescription` 이다. 언어마다 달라야 하기 때문이다. 이 값은 언어를
    // 모르는 자리에서만 쓰이는 마지막 기본값이므로 한국어로 둔다.
    description:
      "백엔드 개발자 hanumoka의 블로그. 모르는 것과 궁금한 것을 정리하고, 개발자로 일하며 쌓이는 기술부채를 인식하고 학습하고 기록합니다.",
    author: "hanumoka",
    profile: "https://github.com/hanumoka",
    ogImage: "default-og.jpg",
    lang: "ko",
    timezone: "Asia/Seoul",
    dir: "ltr",
  },
  posts: {
    perPage: 8,
    perIndex: 5,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    // 글의 정본은 비공개 문서 허브에 있고 이 저장소는 파생물만 갖는다.
    // 공개본을 GitHub에서 직접 고치게 하면 정본과 갈라지므로 끈다.
    editPost: { enabled: false },
    search: "pagefind",
    // 댓글은 GitHub Discussions 에 쌓인다. 아래 두 ID 는 이 저장소의 것이며
    // GitHub GraphQL API 로 확인했다. 저장소를 옮기면 둘 다 다시 받아야 한다.
    comments: {
      enabled: true,
      repo: "hanumoka/hanumoka.github.io",
      repoId: "R_kgDOIYEadg",
      // giscus 가 권하는 대로 아무나 토론을 새로 열 수 없는 카테고리를 쓴다.
      category: "Announcements",
      categoryId: "DIC_kwDOIYEads4CTpNz",
      // 언어판마다 경로가 다르므로 댓글도 언어별로 갈린다. 의도한 것이다.
      mapping: "pathname",
    },
  },
  socials: [
    { name: "github", url: "https://github.com/hanumoka" },
    // 채용 담당자가 이 사이트를 읽고 연락할 수 있는 유일한 경로다.
    // GitHub 링크만 있으면 연락 방법이 사실상 없다.
    { name: "mail", url: "mailto:amagramer@gmail.com" },
  ],
  // 공유 링크는 두지 않는다. 지금 필요하지 않고, 각 버튼이 외부 도메인을 부른다.
  shareLinks: [],
});
