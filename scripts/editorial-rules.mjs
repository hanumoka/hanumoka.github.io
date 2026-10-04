import assert from "node:assert/strict";
import { parse } from "parse5";

export function checkSeriesNavigation(html, { previous, next, key }) {
  const links = { prev: [], next: [] };
  function visit(node, inSeriesNav = false) {
    const attrs = Object.fromEntries(
      (node.attrs ?? []).map(a => [a.name, a.value])
    );
    const inside =
      inSeriesNav ||
      (node.tagName === "nav" && "data-series-navigation" in attrs);
    if (inside && node.tagName === "a") {
      for (const rel of (attrs.rel ?? "").split(/\s+/)) {
        if (rel in links) links[rel].push(attrs.href);
      }
    }
    for (const child of node.childNodes ?? []) visit(child, inside);
  }
  visit(parse(html));
  for (const [rel, expected] of [
    ["prev", previous],
    ["next", next],
  ]) {
    assert.deepEqual(
      links[rel],
      expected ? [`/posts/${expected}/`] : [],
      `${key}: ${rel} 연재 이동 링크 불일치`
    );
  }
}

export function checkPublication(
  { key, draft, publishedAt, body },
  now = Date.now()
) {
  const timestamp = Date.parse(publishedAt);
  assert(Number.isFinite(timestamp), `${key}: 발행 시각 형식 오류`);
  assert(timestamp <= now, `${key}: 미래 발행 시각은 지원하지 않습니다`);
  if (!draft) {
    assert(
      !/이 글은 학습 초안이며|아직 실행하지 않은 학습 초안/u.test(body),
      `${key}: 정식 글에 초안 자기 지칭이 남았습니다`
    );
  }
}
