/**
 * giscus 댓글 위젯을 붙이고, 사이트 테마와 맞춰 준다.
 *
 * ★ 위젯을 서버에서 렌더한 `<script>` 로 두지 않고 여기서 만들어 끼우는 이유는
 * View Transitions 때문이다. `ClientRouter` 로 이동하면 문서가 갈리면서 그때
 * 실행된 스크립트 태그는 다시 돌지 않는다. `astro:page-load` 는 최초 로드와
 * 이동 후 모두 발화하므로 그 자리에서 다시 끼운다.
 */

const GISCUS_ORIGIN = "https://giscus.app";
const CONTAINER_ID = "giscus-container";

function giscusTheme(): string {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark_dimmed"
    : "light";
}

function mount(): void {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return; // 댓글이 없는 페이지

  // 이동 후 같은 자리에 두 번 끼지 않도록 비우고 시작한다.
  container.replaceChildren();

  const data = container.dataset;
  const script = document.createElement("script");
  script.src = `${GISCUS_ORIGIN}/client.js`;
  script.async = true;
  script.crossOrigin = "anonymous";

  const attributes: Record<string, string> = {
    "data-repo": data.repo ?? "",
    "data-repo-id": data.repoId ?? "",
    "data-category": data.category ?? "",
    "data-category-id": data.categoryId ?? "",
    "data-mapping": data.mapping ?? "pathname",
    // 느슨하게 맞추면 제목이 비슷한 다른 글의 토론이 붙는다.
    "data-strict": "1",
    "data-reactions-enabled": "1",
    "data-emit-metadata": "0",
    "data-input-position": "top",
    "data-theme": giscusTheme(),
    "data-lang": data.lang ?? "ko",
    // 화면에 들어올 때 불러온다. 글을 끝까지 읽지 않는 사람에게는 요청이 없다.
    "data-loading": "lazy",
  };

  for (const [key, value] of Object.entries(attributes)) {
    script.setAttribute(key, value);
  }

  container.appendChild(script);
}

/**
 * 위젯은 iframe 안에 있어 사이트 CSS 가 닿지 않는다. 테마가 바뀌면
 * postMessage 로 알려 주는 것이 giscus 가 정한 유일한 경로다.
 */
function syncTheme(): void {
  const frame = document.querySelector<HTMLIFrameElement>(
    "iframe.giscus-frame"
  );
  frame?.contentWindow?.postMessage(
    { giscus: { setConfig: { theme: giscusTheme() } } },
    GISCUS_ORIGIN
  );
}

new MutationObserver(syncTheme).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

mount();
document.addEventListener("astro:page-load", mount);
