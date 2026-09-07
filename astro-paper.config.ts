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
  },
  socials: [{ name: "github", url: "https://github.com/hanumoka" }],
  // 공유 링크는 두지 않는다. 지금 필요하지 않고, 각 버튼이 외부 도메인을 부른다.
  shareLinks: [],
});
