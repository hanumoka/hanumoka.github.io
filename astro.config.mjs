// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import pagefind from 'astro-pagefind';

// User site(계정명과 같은 저장소)라 사이트 루트가 `/`다.
// Project site였다면 여기에 `base: '/저장소이름'`이 필요하고,
// 그것을 빠뜨리는 것이 링크·이미지가 통째로 깨지는 가장 흔한 사고다.
export default defineConfig({
  site: 'https://hanumoka.github.io',
  integrations: [
    sitemap(),
    // 빌드가 끝난 HTML을 훑어 색인을 만든다. 서버도 외부 API도 쓰지 않고
    // 검색은 브라우저에서 돈다. 색인 대상은 `data-pagefind-body`가 달린 곳뿐이다.
    pagefind(),
  ],
});
