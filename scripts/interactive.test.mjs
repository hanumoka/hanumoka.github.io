import test from "node:test";
import assert from "node:assert/strict";
import {
  retryDelays,
  scenarios,
} from "../src/components/interactive/temporal-model.ts";
import {
  snapshot,
  transition,
  initialState,
  captureKey,
  scenarios as businessScenarios,
} from "../src/components/interactive/business-consistency-model.ts";

const finalBusinessState = scenario =>
  snapshot(scenario, businessScenarios[scenario].events.length);

test("같은 좌석 타임아웃 뒤에 실제 확보는 있을 수도 없을 수도 있다", () => {
  const before = finalBusinessState("hold-before");
  const after = finalBusinessState("hold-after");
  assert.equal(before.seat, "none");
  assert.equal(after.seat, "held");
  assert.equal(before.knownSeat, "unknown");
  assert.equal(after.knownSeat, "unknown");
  assert.equal(before.status, after.status);
});

test("외부 기록은 응답 전까지 호출자의 성공 관찰이 아니다", () => {
  const written = snapshot("success", 2);
  const acknowledged = snapshot("success", 3);
  assert.equal(written.seat, "held");
  assert.equal(written.knownSeat, "unknown");
  assert.equal(acknowledged.knownSeat, "held");
  assert.equal(written.knownSeat, "unknown");
});

test("결제 승인 거절만으로 좌석 확보가 사라지지 않는다", () => {
  const state = finalBusinessState("payment-declined");
  assert.equal(state.seat, "held");
  assert.equal(state.payment, "declined");
  assert.equal(state.decision, "none");
  assert.equal(state.ticket, "none");
  assert.equal(state.status, "failed");
});

test("두 Try 이후 Cancel은 좌석과 승인을 따로 해제하며 청구하지 않는다", () => {
  const during = snapshot("cancel", 9);
  assert.equal(during.seat, "released");
  assert.equal(during.payment, "authorized");
  assert.notEqual(during.status, "cancelled");
  const state = finalBusinessState("cancel");
  assert.equal(state.seat, "released");
  assert.equal(state.payment, "voided");
  assert.equal(state.ticket, "none");
  assert.equal(state.captureKeys.length, 0);
  assert.equal(state.status, "cancelled");
});

test("결제 확정 응답 유실은 Confirm 결정을 보존하고 티켓 발급을 보류한다", () => {
  const lost = finalBusinessState("capture-after");
  assert.equal(lost.seat, "confirmed");
  assert.equal(lost.payment, "captured");
  assert.equal(lost.knownPayment, "unknown");
  assert.equal(lost.decision, "confirm");
  assert.equal(lost.ticket, "none");
  assert.equal(lost.status, "uncertain");
  assert.throws(() => transition(lost, "decide-cancel"));
  assert.throws(() => transition(lost, "ticket-request"));
});

test("같은 작업의 재시도는 요청 두 번에 청구 효과 한 번을 남긴다", () => {
  const beforeRetry = finalBusinessState("capture-after");
  const retry = finalBusinessState("capture-retry");
  assert.equal(retry.captureRequests, 2);
  assert.deepEqual(retry.captureKeys, [captureKey]);
  assert.equal(retry.knownPayment, "captured");
  assert.equal(retry.status, "complete");
  assert.equal(beforeRetry.captureRequests, 1);
  assert.equal(beforeRetry.knownPayment, "unknown");
});

test("Try 확인 전에는 Confirm할 수 없고 Cancel 결정 후 뒤집을 수 없다", () => {
  assert.throws(() => transition(initialState(), "decide-confirm"));
  const prepared = snapshot("success", 6);
  const cancelled = transition(prepared, "decide-cancel");
  assert.throws(() => transition(cancelled, "decide-confirm"));
});

test("모든 경로의 완료에는 좌석·결제·티켓 기록과 그 확인이 필요하다", () => {
  for (const [name, scenario] of Object.entries(businessScenarios)) {
    for (let i = 0; i <= scenario.events.length; i++) {
      const state = snapshot(name, i);
      if (state.status === "complete") {
        assert.equal(state.seat, "confirmed");
        assert.equal(state.payment, "captured");
        assert.equal(state.ticket, "issued");
        assert.equal(state.knownSeat, "confirmed");
        assert.equal(state.knownPayment, "captured");
        assert.equal(state.knownTicket, "issued");
      }
    }
    assert.deepEqual(snapshot(name, 0), initialState());
    assert.deepEqual(snapshot(name, 999), finalBusinessState(name));
  }
});

test("티켓 응답 확인·예매 완료 저장·사용자 수신은 별도 사건이다", () => {
  const events = businessScenarios.success.events;
  const before = snapshot("success", events.indexOf("completion-write"));
  const committed = snapshot("success", events.indexOf("completion-write") + 1);
  const delivered = finalBusinessState("success");
  assert.equal(before.knownTicket, "issued");
  assert.equal(before.bookingStatus, "PROCESSING");
  assert.notEqual(before.status, "complete");
  assert.equal(committed.bookingStatus, "COMPLETED");
  assert.equal(committed.userReceivedCompletion, false);
  assert.equal(delivered.userReceivedCompletion, true);
  assert.equal(finalBusinessState("cancel").bookingStatus, "CANCELLED");
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
