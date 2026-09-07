import { fontData, experimental_getFontFileURL } from "astro:assets";
import { getFontPathByWeight } from "@/utils/getFontPathByWeight";

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

const OG_WEIGHTS = [400, 700] as const;

const OG_FAMILIES = [
  { name: "Google Sans Code", cssVariable: "--font-google-sans-code" },
  { name: "Noto Sans KR", cssVariable: "--font-noto-sans-kr-og" },
] as const;

/**
 * OG 이미지(satori)에 넘길 폰트를 모은다.
 *
 * ★ 한글이 왜 따로 필요한가. 본문 폰트인 Google Sans Code 는 라틴 전용이라
 *   한글 글리프가 하나도 없다(cmap 확인: `A` 있음 / `가`·`한`·`ㄱ` 없음).
 *   이 함수를 붙이기 전까지 OG 이미지의 한글 제목은 전부 두부(□)로 나갔다.
 *
 * ★ 왜 `--font-noto-sans-kr` 가 아니라 `--font-noto-sans-kr-og` 인가. 둘이다.
 *   ① satori 는 woff2 를 읽지 못한다. ② 브라우저용 한글 폰트는 unicode-range
 *   로 120조각 나 있어 조각 하나에 제목의 글자가 다 들어 있지 않다.
 *   그래서 OG 전용 항목은 통짜 ttf 를 받는다.
 *
 * ★ 그 6MB 짜리 ttf 를 방문자가 내려받지 않는 이유는 `<Font>` 컴포넌트를
 *   그 변수에 걸지 않기 때문이다. @font-face 가 나가지 않으므로 CSS 어디에서도
 *   참조되지 않는다. **거꾸로, 이 변수에 `<Font>` 를 거는 순간 그 파일이
 *   조각난 woff2 를 제치고 내려받아진다** — unicode-range 가 없어 모든 문자에
 *   매치되기 때문이다.
 */
export async function getOgFonts(url: URL): Promise<OgFont[]> {
  const fonts: OgFont[] = [];

  for (const family of OG_FAMILIES) {
    const data = fontData[family.cssVariable];
    if (data === undefined) {
      throw new Error(`Cannot find font data for ${family.cssVariable}.`);
    }

    for (const weight of OG_WEIGHTS) {
      const path = getFontPathByWeight(data, weight);
      if (path === undefined) {
        throw new Error(`Cannot find the ${family.name} ${weight} font path.`);
      }
      const buffer = await fetch(experimental_getFontFileURL(path, url)).then(
        res => res.arrayBuffer()
      );

      fonts.push({ name: family.name, data: buffer, weight, style: "normal" });
    }
  }

  return fonts;
}
