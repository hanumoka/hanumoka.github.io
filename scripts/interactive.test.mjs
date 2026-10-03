import test from "node:test";
import assert from "node:assert/strict";
import {
  retryDelays,
  scenarios,
} from "../src/components/interactive/temporal-model.ts";

test("재시도 대기는 최초 실행을 제외하고 상한에 도달하면 유지된다", () => {
  assert.deepEqual(retryDelays(1, 2, 10, 8), [1, 2, 4, 8, 10, 10, 10]);
  assert.deepEqual(retryDelays(3, 1, 10, 4), [3, 3, 3]);
  assert.deepEqual(retryDelays(1, 1.5, 10, 4), [1, 1.5, 2.25]);
  assert.deepEqual(retryDelays(1, 2, 10, 1), []);
});

test("계산기 기본 예시의 총 대기는 15초다", () => {
  const delays = retryDelays(1, 2, 10, 5);
  assert.equal(
    delays.reduce((sum, delay) => sum + delay, 0),
    15
  );
});

test("재시도 시나리오는 워크플로 시작으로 돌아가지 않고 두 번째 시도로 완료된다", () => {
  const retry = scenarios.retry;
  const failure = retry.findIndex(step => step.status === "재시도 대기");
  assert.ok(failure > 0);
  assert.equal(retry.filter(step => step.edge === "start").length, 1);
  assert.equal(retry[failure + 1].attempt, 2);
  assert.equal(retry[failure + 1].edge, "activity");
  assert.equal(retry.at(-1).status, "완료");
  assert.equal(retry.at(-1).attempt, 2);
  assert.equal(scenarios.success.at(-1).attempt, 1);
  assert.ok(scenarios.success.every(step => step.status !== "재시도 대기"));
});
