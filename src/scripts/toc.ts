/**
 * 목차에서 **지금 보고 있는 절**을 표시한다.
 *
 * ★ 스크롤 위치를 재지 않고 IntersectionObserver 를 쓴다. 스크롤 이벤트로
 * 매번 계산하면 긴 글에서 눈에 띄게 버벅인다.
 *
 * ★ 관찰 영역을 화면 위쪽 좁은 띠로 좁힌다(`rootMargin`). 그러지 않으면
 * 화면에 걸친 제목이 여럿일 때 어느 것이 «지금»인지 정해지지 않는다.
 */
const ACTIVE = "aria-current";

function setup(): void {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]")
  );
  if (links.length === 0) return;

  const bySlug = new Map<string, HTMLAnchorElement[]>();
  for (const link of links) {
    const slug = link.dataset.tocLink;
    if (!slug) continue;
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), link]);
  }

  const targets = [...bySlug.keys()]
    .map(slug => document.getElementById(slug))
    .filter((element): element is HTMLElement => element !== null);
  if (targets.length === 0) return;

  const visible = new Set<string>();

  const mark = () => {
    // 화면 안에 여럿이면 문서 순서상 가장 앞선 것을 «지금»으로 본다.
    const current = targets.find(target => visible.has(target.id))?.id;
    for (const [slug, slugLinks] of bySlug) {
      for (const link of slugLinks) {
        if (slug === current) link.setAttribute(ACTIVE, "true");
        else link.removeAttribute(ACTIVE);
      }
    }
  };

  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      }
      mark();
    },
    { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
  );

  for (const target of targets) observer.observe(target);

  document.addEventListener("astro:before-swap", () => observer.disconnect(), {
    once: true,
  });
}

setup();
document.addEventListener("astro:page-load", setup);

// ★ 이 파일을 모듈로 만든다. import/export 가 하나도 없으면 전역 스크립트로
// 취급되어 `theme.ts` 의 같은 이름 함수와 충돌한다(실제로 빌드가 막혔다).
export {};
