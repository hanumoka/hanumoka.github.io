import test from "node:test";
import assert from "node:assert/strict";
import {
  retryDelays,
  scenarios,
} from "../src/components/interactive/temporal-model.ts";
import {
  snapshot,
  scenarios as businessScenarios,
} from "../src/components/interactive/business-consistency-model.ts";

const finalBusinessState = scenario =>
  snapshot(scenario, businessScenarios[scenario].events.length);

test("같은 예약 타임아웃 관찰 뒤에 실제 기록은 있을 수도 없을 수도 있다", () => {
  const before = finalBusinessState("reserve-before");
  const after = finalBusinessState("reserve-after");
  assert.equal(before.quota, "none");
  assert.equal(after.quota, "reserved");
  assert.equal(before.knownQuota, "unknown");
  assert.equal(after.knownQuota, "unknown");
  assert.equal(before.status, after.status);
});

test("외부 예약 반영은 호출자의 성공 관찰을 자동으로 만들지 않는다", () => {
  const written = snapshot("success", 2);
  const acknowledged = snapshot("success", 3);
  assert.equal(written.quota, "reserved");
  assert.equal(written.knownQuota, "unknown");
  assert.equal(acknowledged.knownQuota, "reserved");
  assert.equal(written.knownQuota, "unknown", "이전 상태를 변경하지 않는다");
});

test("변환 실패 뒤 정리하지 않은 예약은 남아 있으며 완료로 표시되지 않는다", () => {
  const state = finalBusinessState("conversion-failure");
  assert.equal(state.quota, "reserved");
  assert.equal(state.document, "none");
  assert.equal(state.status, "failed");
  assert.equal(state.knownQuota, "reserved");
});

test("확정 응답 유실은 외부 완료 기록과 호출자의 완료 확인을 분리한다", () => {
  const lost = finalBusinessState("confirm-after");
  const success = finalBusinessState("success");
  assert.equal(lost.quota, success.quota);
  assert.equal(lost.document, success.document);
  assert.equal(lost.knownQuota, "unknown");
  assert.equal(lost.knownDocument, "stored");
  assert.equal(lost.status, "uncertain");
  assert.equal(success.status, "complete");
});

test("모든 경로에서 완료 확인에는 저장 결과와 확정 응답이 필요하다", () => {
  for (const [name, scenario] of Object.entries(businessScenarios)) {
    for (let i = 0; i <= scenario.events.length; i++) {
      const state = snapshot(name, i);
      if (state.status === "complete") {
        assert.equal(state.document, "stored");
        assert.equal(state.quota, "confirmed");
        assert.equal(state.knownQuota, "confirmed");
        assert.equal(state.knownDocument, "stored");
      }
    }
    assert.equal(snapshot(name, 0).events.length, 0);
    assert.equal(snapshot(name, 0).quota, "none");
  }
});

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
