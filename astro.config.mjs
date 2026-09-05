// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// User site(계정명과 같은 저장소)라 사이트 루트가 `/`다.
// Project site였다면 여기에 `base: '/저장소이름'`이 필요하고,
// 그것을 빠뜨리는 것이 링크·이미지가 통째로 깨지는 가장 흔한 사고다.
export default defineConfig({
  site: 'https://hanumoka.github.io',
  integrations: [sitemap()],
});
