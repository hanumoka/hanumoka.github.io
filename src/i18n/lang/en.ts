import type { UIStrings } from "../types";

export default {
  nav: {
    tree: "Contents",
    home: "Home",
    posts: "Posts",
    tags: "Tags",
    about: "About",
    archives: "Archives",
    search: "Search",
  },
  post: {
    comments: "Comments",
    publishedAt: "Published at",
    updatedAt: "Updated",
    sharePostIntro: "Share this post:",
    sharePostOn: "Share this post on {{platform}}",
    sharePostViaEmail: "Share this post via email",
    tagLabel: "Tags",
    backToTop: "Back to top",
    goBack: "Go back",
    editPage: "Edit page",
    previousPost: "Previous Post",
    nextPost: "Next Post",
    inSeries: "Series: {{series}}",
    seriesPosition: "part {{index}} of {{total}}",
    currentPost: "you are here",
  },
  pagination: {
    prev: "Prev",
    next: "Next",
    page: "Page",
  },
  home: {
    socialLinks: "Social Links",
    featured: "Featured",
    recentPosts: "Recent Posts",
    allPosts: "All Posts",
  },
  footer: {
    copyright: "Copyright",
    allRightsReserved: "All rights reserved.",
  },
  dateFormat: "D MMM, YYYY",
  siteDescription:
    "A backend developer's blog. Working through what I do not know and what I am curious about, and recording the technical debt that piles up on the job.",
  pages: {
    tagTitle: "Tag",
    tagDesc: "All the articles with the tag",

    tagsTitle: "Tags",
    tagsDesc: "All the tags used in posts.",

    postsTitle: "Posts",
    postsDesc: "All the articles I've posted.",

    archivesTitle: "Archives",
    archivesDesc: "All the articles I've archived.",

    searchTitle: "Search",
    searchDesc: "Search any article ...",

    kindTitle: "Kind",
    kindDesc: "All the articles of the kind",

    alsoBrowseBy: "You can also browse by",

    seriesTitle: "Series",
    seriesDesc: "Posts written as a run.",

    treeTitle: "Contents",
    treeDesc: "Every series and standalone post in one tree.",
    standalonePosts: "Standalone posts",
    treeEmpty: "No posts yet.",
    seriesOneTitle: "Series",
    seriesOneDesc: "Posts in this series",

    kindsTitle: "Kinds",
    kindsDesc: "All the kinds used in posts.",
  },
  kinds: {
    til: "TIL",
    troubleshooting: "Troubleshooting",
    concept: "Concept",
    snippet: "Snippet",
    "agent-issue": "Agent issue",
  },
  a11y: {
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toggleTheme: "Toggle theme",
    switchTo: "Read in {{language}}",
    noTranslationYet:
      "No matching page in this language yet — going to the nearest one",
    searchPlaceholder: "Search posts...",
    noResults: "No results found",
    goToPreviousPage: "Go to previous page",
    goToNextPage: "Go to next page",
  },
  notFound: {
    title: "404 Not Found",
    message: "Page Not Found",
    goHome: "Go back home",
  },
} satisfies UIStrings;
