import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://hanumoka.github.io/",
    title: "hanumoka",
    description:
      "백엔드 개발자 hanumoka의 기술 글과 프로젝트 기록. 만들면서 부딪힌 것과 그때 잰 값을 남깁니다.",
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
  },
  socials: [{ name: "github", url: "https://github.com/hanumoka" }],
  // 공유 링크는 두지 않는다. 지금 필요하지 않고, 각 버튼이 외부 도메인을 부른다.
  shareLinks: [],
});
