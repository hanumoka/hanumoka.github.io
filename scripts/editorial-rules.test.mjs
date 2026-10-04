import test from "node:test";
import assert from "node:assert/strict";
import { checkSeriesNavigation, checkPublication } from "./editorial-rules.mjs";

const expected = { key: "middle", previous: "first", next: "last" };
const toc =
  '<ol><li><a href="/posts/first/">first</a></li><li><a href="/posts/last/">last</a></li></ol>';
const nav =
  '<nav data-series-navigation><a rel="prev" href="/posts/first/">first</a><a rel="next" href="/posts/last/">last</a></nav>';
test("전체 목차가 남아 있어도 이전·다음 nav 삭제를 검출한다", () => {
  assert.doesNotThrow(() => checkSeriesNavigation(nav + toc, expected));
  assert.throws(() => checkSeriesNavigation(toc, expected));
  assert.throws(() =>
    checkSeriesNavigation(nav.replace('rel="next"', "") + toc, expected)
  );
  assert.throws(() =>
    checkSeriesNavigation(
      nav.replace("/posts/last/", "/posts/wrong/") + toc,
      expected
    )
  );
});
test("연재 양 끝에는 없는 방향의 링크를 허용하지 않는다", () => {
  assert.doesNotThrow(() =>
    checkSeriesNavigation(
      '<nav data-series-navigation><a href="/posts/last/" rel="next">next</a></nav>',
      { key: "first", next: "last" }
    )
  );
  assert.throws(() =>
    checkSeriesNavigation(nav, { key: "first", next: "last" })
  );
});
test("미래 발행과 정식 글의 초안 자기 지칭을 차단한다", () => {
  const post = {
    key: "test",
    draft: true,
    publishedAt: "2026-10-04T00:00:00Z",
    body: "이 글은 학습 초안이며",
  };
  const now = Date.parse("2026-10-05T00:00:00Z");
  assert.doesNotThrow(() => checkPublication(post, now));
  assert.throws(() => checkPublication({ ...post, draft: false }, now));
  assert.throws(() =>
    checkPublication(post, Date.parse("2026-10-03T00:00:00Z"))
  );
});
