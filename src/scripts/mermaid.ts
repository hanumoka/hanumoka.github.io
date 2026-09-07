/**
 * 머메이드 다이어그램을 그린다.
 *
 * ★ 라이브러리를 정적으로 불러오지 않는다. mermaid 는 무겁고, 다이어그램이
 * 없는 글이 대부분이다. `import()` 를 실제로 다이어그램이 있을 때만 부르므로
 * 없는 글에는 그 청크가 내려가지 않는다.
 */

const SELECTOR = "pre.mermaid";

type MermaidModule = typeof import("mermaid");

let loading: Promise<MermaidModule> | null = null;

function mermaidTheme(): "dark" | "default" {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "default";
}

async function render(): Promise<void> {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
  if (nodes.length === 0) return;

  loading ??= import("mermaid");
  const mermaid = (await loading).default;

  for (const node of nodes) {
    // 처음 본 순간의 텍스트가 원본이다. 한 번 그리면 `<pre>` 안이 SVG 로
    // 바뀌므로 그때 읽으면 정의가 없다.
    if (!sources.has(node)) {
      sources.set(node, node.textContent ?? "");
    }
    node.textContent = sources.get(node) ?? "";
    // `data-processed` 가 남아 있으면 mermaid 가 이미 처리한 것으로 보고 건너뛴다.
    node.removeAttribute("data-processed");
  }

  mermaid.initialize({
    startOnLoad: false,
    theme: mermaidTheme(),
    // 다이어그램 정의는 글에서 온다. 스크립트 실행을 허용할 이유가 없다.
    securityLevel: "strict",
  });

  await mermaid.run({ nodes });
}

/**
 * ★ 렌더를 직렬화한다. 이것이 없으면 최초 로드에서 두 번 겹쳐 돈다 —
 * 모듈 실행과 `astro:page-load` 가 거의 동시에 발화하기 때문이다. 겹치면
 * 한쪽이 반쯤 처리된 노드를 집어 **정의는 멀쩡한데 `Syntax error in text` 가
 * 뜬다.** 실제로 그 상태였고, 정의를 `mermaid.parse` 에 직접 넣어 보고서야
 * 문법이 아니라 경합이라는 것이 드러났다.
 */
/**
 * ★ 원본 정의를 따로 들고 있어야 한다. 그리고 나면 `<pre>` 안이 SVG 다.
 *
 * ★ 이 값이 오염되면 **정의는 멀쩡한데 `Syntax error in text` 가 뜬다.**
 * 실제로 테마의 코드 복사 버튼이 `<pre>` 안에 삽입돼 정의 끝에 "Copy" 가
 * 붙었고, 그래서 글 상세의 복사 버튼 선택자를 `pre:not(.mermaid)` 로 좁혔다.
 * 그 선택자를 되돌리면 다이어그램이 다시 깨진다.
 */
const sources = new WeakMap<Element, string>();

let queue: Promise<void> = Promise.resolve();

function schedule(): void {
  queue = queue.then(render).catch(() => {
    /* 한 번 실패해도 다음 요청은 받는다 */
  });
}

new MutationObserver(schedule).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

schedule();
document.addEventListener("astro:page-load", schedule);
