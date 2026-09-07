interface SiteConfig {
  /** Deployed URL of the site, e.g. "https://example.com" */
  url: string;
  /** Blog title shown in header and meta tags */
  title: string;
  /** Short description used in SEO meta and RSS feed */
  description: string;
  /** Default post author name */
  author: string;
  /** Author profile URL (used in structured data) */
  profile?: string;
  /** Fallback OG image filename in /public, e.g. "og.jpg" */
  ogImage?: string;
  /** HTML lang attribute, defaults to "en" */
  lang?: string;
  /** IANA timezone for post dates, e.g. "Asia/Bangkok" */
  timezone?: string;
  /** Text direction */
  dir?: "ltr" | "rtl" | "auto";
  /** Google Search Console verification meta tag value */
  googleVerification?: string;
}

interface PostsConfig {
  /** Posts per page on paginated listing pages */
  perPage?: number;
  /** Posts shown on the index/home page */
  perIndex?: number;
  /**
   * Scheduled posts within this window (ms) of their pubDatetime
   * are shown as published. Defaults to 15 minutes.
   */
  scheduledPostMargin?: number;
}

interface FeaturesConfig {
  /** Enable light/dark mode toggle. Defaults to true. */
  lightAndDarkMode?: boolean;
  /**
   * Generate dynamic OG images per post and provide `/og.png` when the static
   * `public/{site.ogImage}` file is absent. When false, that file is required
   * for the default layout OG image (build fails if missing).
   */
  dynamicOgImage?: boolean;
  /** Show the /archives page and link it in nav. Defaults to true. */
  showArchives?: boolean;
  /** Show back button on post detail pages. Defaults to true. */
  showBackButton?: boolean;
  /** "Edit page" link shown on post detail pages. */
  editPost?:
    | {
        enabled: true;
        /** Base URL for the edit link, e.g. GitHub edit URL */
        url: string;
      }
    | { enabled: false };
  /**
   * Search provider. "pagefind" ships in the base template.
   * Set to false to disable search entirely.
   */
  search?: "pagefind" | false;
  /**
   * 글 아래에 붙는 댓글. GitHub Discussions 를 저장소로 쓰는 giscus 다.
   * 서버도 데이터베이스도 없고, 댓글은 이 저장소의 Discussions 에 쌓인다.
   *
   * ★ 댓글을 쓰려면 방문자가 GitHub 계정으로 로그인해야 한다. 로그인 없는
   * 댓글이 필요해지면 giscus 로는 안 되고 다른 것을 골라야 한다.
   */
  comments?:
    | {
        enabled: true;
        /** `소유자/저장소` */
        repo: `${string}/${string}`;
        /** GitHub GraphQL 의 저장소 노드 ID. giscus.app 이나 API 로 얻는다. */
        repoId: string;
        /** Discussions 카테고리 이름 */
        category: string;
        /** 그 카테고리의 노드 ID */
        categoryId: string;
        /**
         * 글과 토론을 무엇으로 잇는가. `pathname` 이면 한국어판과 영어판이
         * 서로 다른 경로이므로 **댓글도 언어별로 갈린다.**
         */
        mapping: "pathname" | "url" | "title" | "og:title";
      }
    | { enabled: false };
}

interface SocialLink {
  /**
   * Must match an SVG filename in src/assets/icons/socials/.
   * e.g. "github" → src/assets/icons/socials/github.svg
   */
  name: string;
  url: string;
  /**
   * Accessible label for the icon link (aria-label, title attribute).
   * Auto-generated if omitted: "{site.title} on GitHub", "Send an email to {site.title}", etc.
   * Override when the default wording doesn't fit.
   */
  linkTitle?: string;
}

interface ShareLink {
  /**
   * Must match an SVG filename in src/assets/icons/socials/.
   * e.g. "facebook" → src/assets/icons/socials/facebook.svg
   */
  name: string;
  /** Base share URL. The post URL will be appended as a query param. */
  url: string;
  /**
   * Accessible label for the icon link (aria-label, title attribute).
   * Auto-generated if omitted: "Share this post on Facebook", "Share this post via WhatsApp", etc.
   * Override when the default wording doesn't fit.
   */
  linkTitle?: string;
}

interface AstroPaperConfig {
  site: SiteConfig;
  posts?: PostsConfig;
  features?: FeaturesConfig;
  /** Social profile links shown in header/footer */
  socials?: SocialLink[];
  /** Share links shown on post detail pages */
  shareLinks?: ShareLink[];
}

type ResolvedSiteConfig = Required<
  Pick<
    SiteConfig,
    | "url"
    | "title"
    | "description"
    | "author"
    | "lang"
    | "timezone"
    | "dir"
    | "ogImage"
  >
> &
  Pick<SiteConfig, "profile" | "googleVerification">;

export interface ResolvedAstroPaperConfig {
  site: ResolvedSiteConfig;
  posts: Required<PostsConfig>;
  features: Required<FeaturesConfig>;
  socials: SocialLink[];
  shareLinks: ShareLink[];
}

/**
 * Type helper for astro-paper.config.ts.
 * Provides full IntelliSense without any runtime overhead.
 */
export function defineAstroPaperConfig(
  config: AstroPaperConfig
): AstroPaperConfig {
  return config;
}
