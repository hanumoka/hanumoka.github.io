type MdNode = {
  type: string;
  lang?: string | null;
  value?: string;
  children?: MdNode[];
};

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, character => ESCAPES[character] ?? character);
}

function transform(node: MdNode): void {
  const children = node.children;
  if (!children) return;

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (!child) continue;

    if (child.type === "code" && child.lang === "mermaid") {
      // ★ 정의를 속성에 담아 보려 했으나 안 된다. 이 파이프라인은 여기서 낸
      // 원시 HTML 을 다시 파싱해 직렬화하는데, 그 과정에서 **여러 줄 속성값이
      // 통째로 비워진다**(실측: `data-mermaid=""`). `&#10;` 로 한 줄로 만들어도
      // 같았다. 그래서 정의는 요소의 텍스트로만 둔다.
      children[index] = {
        type: "html",
        value: `<pre class="mermaid">${escapeHtml(child.value ?? "")}</pre>`,
      };
      continue;
    }

    transform(child);
  }
}

/**
 * ```mermaid 코드 펜스를 `<pre class="mermaid">` 로 바꾼다.
 *
 * ★ remark 단계에서 바꾸는 이유는 Shiki 때문이다. 그냥 두면 Shiki 가 먼저
 * 잡아 **문법 강조된 코드 블록**으로 만들어 버리고, 그 뒤에는 다이어그램으로
 * 되돌릴 방법이 없다. 실제로 붙이기 전 상태가 그랬다.
 */
export function remarkMermaid() {
  return (tree: MdNode) => transform(tree);
}
