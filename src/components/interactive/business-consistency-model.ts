/** 설명용 직렬 사건 모형. 실제 DB·결제사·Temporal이나 동시성 제어를 구현하지 않는다. */
export type Scenario =
  | "success"
  | "payment-declined"
  | "cancel"
  | "hold-before"
  | "hold-after"
  | "capture-after"
  | "capture-retry";
export type Seat = "none" | "held" | "confirmed" | "released";
export type Payment =
  "none" | "authorized" | "declined" | "captured" | "voided";
export type Ticket = "none" | "issued";
export type Event =
  | "hold-request"
  | "hold-write"
  | "hold-response"
  | "hold-timeout"
  | "authorize-request"
  | "authorize-write"
  | "authorize-response"
  | "authorize-declined"
  | "decide-confirm"
  | "seat-confirm-request"
  | "seat-confirm-write"
  | "seat-confirm-response"
  | "capture-request"
  | "capture-write"
  | "capture-response"
  | "capture-timeout"
  | "decide-cancel"
  | "cancel-request"
  | "seat-release"
  | "authorization-void"
  | "cancel-response"
  | "ticket-request"
  | "ticket-write"
  | "ticket-response"
  | "completion-write"
  | "user-response-received";
export const captureKey = "BK1042/payment/confirm";
export type State = {
  seat: Seat;
  payment: Payment;
  ticket: Ticket;
  knownSeat: Seat | "unknown";
  knownPayment: Payment | "unknown";
  knownTicket: Ticket | "unknown";
  decision: "none" | "confirm" | "cancel";
  bookingStatus: "PROCESSING" | "COMPLETED" | "CANCELLED";
  userReceivedCompletion: boolean;
  captureRequests: number;
  captureKeys: string[];
  phase: number;
  status:
    "ready" | "running" | "uncertain" | "failed" | "cancelled" | "complete";
  events: Event[];
};
export const initialState = (): State => ({
  seat: "none",
  payment: "none",
  ticket: "none",
  knownSeat: "none",
  knownPayment: "none",
  knownTicket: "none",
  decision: "none",
  bookingStatus: "PROCESSING",
  userReceivedCompletion: false,
  captureRequests: 0,
  captureKeys: [],
  phase: -1,
  status: "ready",
  events: [],
});
const hold: Event[] = ["hold-request", "hold-write", "hold-response"];
const prepared: Event[] = [
  ...hold,
  "authorize-request",
  "authorize-write",
  "authorize-response",
];
const confirmedSeat: Event[] = [
  ...prepared,
  "decide-confirm",
  "seat-confirm-request",
  "seat-confirm-write",
  "seat-confirm-response",
];
const capture: Event[] = ["capture-request", "capture-write"];
const issue: Event[] = [
  "ticket-request",
  "ticket-write",
  "ticket-response",
  "completion-write",
  "user-response-received",
];
export const scenarios: Record<
  Scenario,
  { label: string; events: Event[]; lesson: string }
> = {
  success: {
    label: "정상 예매 완료",
    events: [...confirmedSeat, ...capture, "capture-response", ...issue],
    lesson:
      "좌석 확정·결제 확정·티켓 발급을 모두 확인했습니다. 이제 예매 완료를 알릴 수 있습니다.",
  },
  "payment-declined": {
    label: "결제 승인 거절 · 정리 전",
    events: [...hold, "authorize-request", "authorize-declined"],
    lesson:
      "명확한 거절 응답을 받았습니다. 좌석은 아직 임시 확보 상태입니다. Cancel로 해제하고 그 결과를 확인할 책임이 남습니다.",
  },
  cancel: {
    label: "두 Try 성공 후 사용자 취소",
    events: [
      ...prepared,
      "decide-cancel",
      "cancel-request",
      "seat-release",
      "authorization-void",
      "cancel-response",
    ],
    lesson:
      "Confirm 결정 전에 Cancel을 선택했습니다. 좌석 해제와 결제 승인 취소를 각각 확인했습니다. 이미 청구한 돈의 환불과는 다릅니다.",
  },
  "hold-before": {
    label: "좌석 확보 전 요청 유실",
    events: ["hold-request", "hold-timeout"],
    lesson:
      "요청이 도착하지 않아 이 모형에는 확보 기록이 없습니다. 하지만 예매 진행 서비스는 응답을 못 받았으므로 그 사실을 알 수 없습니다.",
  },
  "hold-after": {
    label: "좌석 확보 후 응답 유실",
    events: ["hold-request", "hold-write", "hold-timeout"],
    lesson:
      "좌석 DB에는 임시 확보가 저장됐지만, 예매 진행 서비스는 응답을 받지 못해 결과를 모릅니다. Cancel을 선택하더라도 기존·늦은 Try를 처리할 계약과 해제 결과 확인이 필요합니다.",
  },
  "capture-after": {
    label: "결제 확정 후 응답 유실",
    events: [...confirmedSeat, ...capture, "capture-timeout"],
    lesson:
      "좌석과 결제는 확정됐지만 예매 진행 서비스는 결제 결과를 모릅니다. 티켓은 아직 없습니다. Confirm 결정을 뒤집지 않고 같은 작업의 결과를 확인해야 합니다.",
  },
  "capture-retry": {
    label: "같은 멱등키로 결제 확정 재시도",
    events: [
      ...confirmedSeat,
      ...capture,
      "capture-timeout",
      ...capture,
      "capture-response",
      ...issue,
    ],
    lesson:
      "결제 확정을 두 번 요청했지만 같은 키의 결과를 재사용해 청구는 한 번입니다. 결과를 확인한 뒤 같은 예매의 티켓을 발급합니다.",
  },
};
export const eventText: Record<Event, string> = {
  "hold-request": "BK1042가 A12 좌석의 임시 확보(Try)를 요청합니다.",
  "hold-write": "좌석 저장소에 임시 확보가 반영됩니다. 응답은 아직 없습니다.",
  "hold-response": "예매 진행 서비스가 좌석 확보 성공을 확인합니다.",
  "hold-timeout":
    "좌석 응답 대기가 끝납니다. 예매 진행 서비스는 확보 결과를 모릅니다.",
  "authorize-request":
    "결제 승인(Try)을 요청합니다. 아직 청구를 확정하지 않습니다.",
  "authorize-write": "결제 시스템에 승인과 한도 확보가 기록됩니다.",
  "authorize-response":
    "예매 진행 서비스가 결제 승인 성공을 확인합니다. 두 Try가 준비됐습니다.",
  "authorize-declined":
    "결제 시스템이 명확한 승인 거절을 응답합니다. 좌석 확보는 남습니다.",
  "decide-confirm":
    "예매 진행 서비스가 Confirm 결정을 기록합니다. 이후의 타임아웃으로 Cancel로 바꾸지 않습니다.",
  "seat-confirm-request":
    "확보한 좌석을 BK1042의 확정 좌석으로 바꾸도록 요청합니다.",
  "seat-confirm-write": "좌석 확정이 저장됩니다. 결제 확정은 아직 남았습니다.",
  "seat-confirm-response": "예매 진행 서비스가 좌석 확정을 확인합니다.",
  "capture-request": `결제 확정(capture)을 요청합니다. 키: ${captureKey}`,
  "capture-write":
    "결제 시스템이 키를 확인합니다. 최초 요청이면 청구하고, 중복이면 저장된 결과를 사용합니다.",
  "capture-response": "예매 진행 서비스가 결제 확정 결과를 확인합니다.",
  "capture-timeout":
    "결제 확정 응답이 유실됩니다. 결과는 미확인이지만 Confirm 결정은 유지됩니다.",
  "decide-cancel":
    "사용자 취소 요청에 따라 Confirm 전에 Cancel 결정을 기록합니다.",
  "cancel-request": "좌석 확보 해제와 결제 승인 취소를 요청합니다.",
  "seat-release":
    "좌석의 임시 확보가 해제됩니다. 결제 승인 취소는 아직 남았습니다.",
  "authorization-void": "결제 승인이 취소되어 확보한 한도가 해제됩니다.",
  "cancel-response":
    "두 취소 결과를 확인하고 예매 DB에 CANCELLED를 저장합니다.",
  "ticket-request": "확정된 예매 BK1042의 티켓 발급을 요청합니다.",
  "ticket-write": "조회 가능한 티켓이 저장됩니다. 응답은 아직 없습니다.",
  "completion-write":
    "예매 진행 서비스가 예매 DB에 COMPLETED를 저장합니다. 사용자는 아직 응답을 받지 못했습니다.",
  "user-response-received": "사용자가 예매 완료 응답을 받습니다.",
  "ticket-response":
    "티켓 발급을 확인합니다. 예매 DB의 완료 기록은 아직입니다.",
};
function requireState(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}
/** 키의 원자적 저장·동시성·만료는 후속 실습 대상이다. */
export function transition(previous: State, event: Event): State {
  const state = {
    ...previous,
    captureKeys: [...previous.captureKeys],
    events: [...previous.events, event],
  };
  switch (event) {
    case "hold-request":
      state.phase = 0;
      state.status = "running";
      state.knownSeat = "unknown";
      break;
    case "hold-write":
      state.seat = "held";
      break;
    case "hold-response":
      state.knownSeat = "held";
      break;
    case "hold-timeout":
      state.status = "uncertain";
      break;
    case "authorize-request":
      state.phase = 1;
      state.knownPayment = "unknown";
      break;
    case "authorize-write":
      state.payment = "authorized";
      break;
    case "authorize-response":
      state.knownPayment = "authorized";
      break;
    case "authorize-declined":
      state.payment = "declined";
      state.knownPayment = "declined";
      state.status = "failed";
      break;
    case "decide-confirm":
      requireState(
        state.decision === "none" &&
          state.knownSeat === "held" &&
          state.knownPayment === "authorized",
        "양쪽 Try 성공 확인과 미결정 상태가 필요합니다."
      );
      state.decision = "confirm";
      state.phase = 2;
      break;
    case "seat-confirm-request":
      requireState(state.decision === "confirm", "Confirm 결정이 필요합니다.");
      state.knownSeat = "unknown";
      break;
    case "seat-confirm-write":
      requireState(
        state.decision === "confirm" && state.seat === "held",
        "유효한 좌석 확보와 Confirm 결정이 필요합니다."
      );
      state.seat = "confirmed";
      break;
    case "seat-confirm-response":
      state.knownSeat = "confirmed";
      break;
    case "capture-request":
      requireState(state.decision === "confirm", "Confirm 결정이 필요합니다.");
      state.captureRequests++;
      state.knownPayment = "unknown";
      state.status = "running";
      break;
    case "capture-write":
      requireState(
        state.decision === "confirm" &&
          (state.payment === "authorized" || state.payment === "captured"),
        "유효한 승인 또는 기존 확정 결과가 필요합니다."
      );
      if (!state.captureKeys.includes(captureKey))
        state.captureKeys.push(captureKey);
      state.payment = "captured";
      break;
    case "capture-response":
      state.knownPayment = "captured";
      break;
    case "capture-timeout":
      state.status = "uncertain";
      break;
    case "decide-cancel":
      requireState(
        state.decision === "none",
        "Confirm과 Cancel 결정을 뒤집을 수 없습니다."
      );
      state.decision = "cancel";
      break;
    case "cancel-request":
      requireState(state.decision === "cancel", "Cancel 결정이 필요합니다.");
      state.knownSeat = "unknown";
      state.knownPayment = "unknown";
      break;
    case "seat-release":
      requireState(
        state.decision === "cancel" && state.seat === "held",
        "이 경로는 임시 확보만 해제합니다."
      );
      state.seat = "released";
      break;
    case "authorization-void":
      requireState(
        state.decision === "cancel" && state.payment === "authorized",
        "이 경로는 미청구 승인만 취소합니다."
      );
      state.payment = "voided";
      break;
    case "cancel-response":
      requireState(
        state.seat === "released" && state.payment === "voided",
        "두 자원의 취소 결과가 필요합니다."
      );
      state.knownSeat = "released";
      state.knownPayment = "voided";
      state.bookingStatus = "CANCELLED";
      state.status = "cancelled";
      break;
    case "ticket-request":
      requireState(
        state.knownSeat === "confirmed" && state.knownPayment === "captured",
        "좌석·결제 확정 확인이 필요합니다."
      );
      state.phase = 3;
      state.knownTicket = "unknown";
      break;
    case "ticket-write":
      state.ticket = "issued";
      break;
    case "ticket-response":
      requireState(
        state.seat === "confirmed" &&
          state.payment === "captured" &&
          state.ticket === "issued" &&
          state.knownSeat === "confirmed" &&
          state.knownPayment === "captured",
        "완료 조건이 충족되지 않았습니다."
      );
      state.knownTicket = "issued";
      break;
    case "completion-write":
      requireState(
        state.knownSeat === "confirmed" &&
          state.knownPayment === "captured" &&
          state.knownTicket === "issued",
        "세 참여자의 성공 확인이 필요합니다."
      );
      state.bookingStatus = "COMPLETED";
      state.status = "complete";
      break;
    case "user-response-received":
      requireState(
        state.bookingStatus === "COMPLETED",
        "예매 완료 저장이 필요합니다."
      );
      state.userReceivedCompletion = true;
      break;
  }
  return state;
}
export function snapshot(scenario: Scenario, step: number): State {
  const count = Math.max(
    0,
    Math.min(scenarios[scenario].events.length, Math.trunc(step))
  );
  return scenarios[scenario].events
    .slice(0, count)
    .reduce(transition, initialState());
}
export const seatLabel = {
  none: "확보 없음",
  held: "임시 확보",
  confirmed: "좌석 확정",
  released: "확보 해제",
  unknown: "결과 미확인",
};
export const paymentLabel = {
  none: "미요청",
  authorized: "승인 · 미청구",
  declined: "승인 거절",
  captured: "청구 확정",
  voided: "승인 취소",
  unknown: "결과 미확인",
};
export const ticketLabel = {
  none: "미발급",
  issued: "발급 · 조회 가능",
  unknown: "결과 미확인",
};
export const decisionLabel = {
  none: "미결정",
  confirm: "Confirm · 확정 진행",
  cancel: "Cancel · 취소 진행",
};
export const statusLabel = {
  ready: "시작 전",
  running: "처리 중",
  uncertain: "결과 확인 필요",
  failed: "승인 거절 · 확보 해제 필요",
  cancelled: "취소 완료 확인",
  complete: "예매 완료 확인",
};
