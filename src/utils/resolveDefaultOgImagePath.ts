import type { ResolvedAstroPaperConfig } from "@/types/config";
import { getAssetPath } from "./withBase";
import { getLocaleFileUrl, type Locale } from "./locales";

const publicFiles = import.meta.glob("/public/*", { eager: false });

function existsInPublic(filename: string): boolean {
  return `/public/${filename}` in publicFiles;
}

/**
 * Resolves the absolute OG image path used for pages/posts.
 *
 * Security note: `site.ogImage` must be a single filename under `public/` to avoid
 * path traversal or referencing arbitrary files.
 *
 * Behavior:
 * - When `features.dynamicOgImage` is enabled, prefers `public/{site.ogImage}` when present,
 *   otherwise falls back to the generated `/og.png`.
 * - When disabled, requires `public/{site.ogImage}` to exist.
 *
 * `site.ogImage` 는 선택이다. 비어 있으면 생성된 og.png 를 쓴다. 테마 기본값이던
 * `default-og.jpg` 는 테마의 브랜딩 이미지라 지웠고, 이름만 설정에 남아 있었다.
 */
export function resolveDefaultOgImagePath(
  config: ResolvedAstroPaperConfig,
  locale: Locale
): string {
  const filename = config.site.ogImage;
  if (!filename) {
    if (config.features.dynamicOgImage)
      return getLocaleFileUrl(locale, "og.png");
    throw new Error(
      "site.ogImage 가 비어 있고 features.dynamicOgImage 도 꺼져 있어 공유 이미지를 정할 수 없습니다. 둘 중 하나를 채우세요."
    );
  }
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    throw new Error(
      `site.ogImage must be a single filename in public/ (e.g. "og.jpg"), got "${filename}"`
    );
  }

  if (config.features.dynamicOgImage) {
    return existsInPublic(filename)
      ? getAssetPath(filename)
      : getLocaleFileUrl(locale, "og.png");
  }

  if (!existsInPublic(filename)) {
    throw new Error(
      `missing public/${filename}. Add that file, or set site.ogImage to an existing file under public/, or enable features.dynamicOgImage to fall back to /og.png.`
    );
  }

  return getAssetPath(filename);
}
