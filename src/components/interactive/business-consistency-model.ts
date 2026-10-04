/** 1편의 설명용 모형. 실제 API/DB/Temporal의 동작을 실행하지 않는다. */
export type Scenario =
  | "success"
  | "conversion-failure"
  | "reserve-before"
  | "reserve-after"
  | "confirm-after";
export type Quota = "none" | "reserved" | "confirmed";
export type DocumentState = "none" | "converted" | "stored";
export type Event =
  | "reserve-request"
  | "reserve-write"
  | "reserve-response"
  | "reserve-timeout"
  | "convert-request"
  | "convert-success"
  | "convert-failure"
  | "store-request"
  | "store-write"
  | "store-response"
  | "confirm-request"
  | "confirm-write"
  | "confirm-response"
  | "confirm-timeout";
export type State = {
  quota: Quota;
  document: DocumentState;
  knownQuota: Quota | "unknown";
  knownDocument: DocumentState | "unknown";
  phase: number;
  status: "ready" | "running" | "uncertain" | "failed" | "complete";
  events: Event[];
};

export const initialState = (): State => ({
  quota: "none",
  document: "none",
  knownQuota: "none",
  knownDocument: "none",
  phase: -1,
  status: "ready",
  events: [],
});
const reservation: Event[] = [
  "reserve-request",
  "reserve-write",
  "reserve-response",
];
const throughStorage: Event[] = [
  ...reservation,
  "convert-request",
  "convert-success",
  "store-request",
  "store-write",
  "store-response",
];
export const scenarios: Record<
  Scenario,
  { label: string; events: Event[]; lesson: string }
> = {
  success: {
    label: "정상 완료",
    events: [
      ...throughStorage,
      "confirm-request",
      "confirm-write",
      "confirm-response",
    ],
    lesson:
      "결과 저장과 예약 확정의 응답을 확인했습니다. 이 예제의 완료 조건을 충족합니다.",
  },
  "conversion-failure": {
    label: "변환 중 실패",
    events: [...reservation, "convert-request", "convert-failure"],
    lesson:
      "변환 실패를 알아도 예약 기록은 남습니다. 정리 책임을 구현하지 않은 상태에서 멈췄습니다.",
  },
  "reserve-before": {
    label: "예약 기록 전 요청 유실",
    events: ["reserve-request", "reserve-timeout"],
    lesson:
      "이 모형에서는 예약 요청이 도착하지 않아 기록이 없습니다. 호출자는 응답을 받지 못했으므로 그 사실을 알 수 없습니다.",
  },
  "reserve-after": {
    label: "예약 기록 후 응답 유실",
    events: ["reserve-request", "reserve-write", "reserve-timeout"],
    lesson:
      "호출자의 관찰은 ‘예약 기록 전 요청 유실’과 같습니다. 하지만 이번에는 예약이 남아 있습니다. 타임아웃만으로 둘을 구별할 수 없습니다.",
  },
  "confirm-after": {
    label: "예약 확정 후 응답 유실",
    events: [
      ...throughStorage,
      "confirm-request",
      "confirm-write",
      "confirm-timeout",
    ],
    lesson:
      "결과와 확정 기록은 남아 있지만 호출자는 확정을 확인하지 못했습니다. 새로 처리하기 전에 기존 요청의 결과를 확인할 계약이 필요합니다.",
  },
};
export const eventText: Record<Event, string> = {
  "reserve-request": "호출자가 예약을 요청합니다.",
  "reserve-write":
    "예약 기록이 반영됩니다. 성공 응답은 아직 도착하지 않았습니다.",
  "reserve-response": "예약 성공 응답을 받습니다.",
  "reserve-timeout":
    "예약 응답 대기가 끝납니다. 호출자는 결과를 확인하지 못했습니다.",
  "convert-request": "변환을 요청합니다.",
  "convert-success": "변환 결과가 생기고 성공 응답을 받습니다.",
  "convert-failure":
    "결과 파일을 만들기 전에 변환이 실패합니다. 오류 응답을 받습니다.",
  "store-request": "결과 저장을 요청합니다.",
  "store-write":
    "조회 가능한 결과가 저장됩니다. 성공 응답은 아직 도착하지 않았습니다.",
  "store-response": "저장 성공 응답을 받습니다.",
  "confirm-request": "예약 확정을 요청합니다.",
  "confirm-write": "예약이 확정됩니다. 성공 응답은 아직 도착하지 않았습니다.",
  "confirm-response": "확정 성공 응답을 받습니다. 완료를 알릴 수 있습니다.",
  "confirm-timeout":
    "확정 응답 대기가 끝납니다. 호출자는 결과를 확인하지 못했습니다.",
};

/** 외부 기록 변경과 응답 관찰은 각각 다른 사건으로 반영한다. */
export function transition(previous: State, event: Event): State {
  const state = { ...previous, events: [...previous.events, event] };
  switch (event) {
    case "reserve-request":
      state.phase = 0;
      state.status = "running";
      state.knownQuota = "unknown";
      break;
    case "reserve-write":
      state.quota = "reserved";
      break;
    case "reserve-response":
      state.knownQuota = "reserved";
      break;
    case "reserve-timeout":
      state.status = "uncertain";
      break;
    case "convert-request":
      state.phase = 1;
      state.knownDocument = "unknown";
      break;
    case "convert-success":
      state.document = "converted";
      state.knownDocument = "converted";
      break;
    case "convert-failure":
      state.status = "failed";
      state.knownDocument = "none";
      break;
    case "store-request":
      state.phase = 2;
      state.knownDocument = "unknown";
      break;
    case "store-write":
      state.document = "stored";
      break;
    case "store-response":
      state.knownDocument = "stored";
      break;
    case "confirm-request":
      state.phase = 3;
      state.knownQuota = "unknown";
      break;
    case "confirm-write":
      state.quota = "confirmed";
      break;
    case "confirm-response":
      state.knownQuota = "confirmed";
      state.status = "complete";
      break;
    case "confirm-timeout":
      state.status = "uncertain";
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
export const quotaLabel = {
  none: "기록 없음",
  reserved: "예약됨",
  confirmed: "확정됨",
  unknown: "결과 미확인",
};
export const documentLabel = {
  none: "결과 없음",
  converted: "변환 결과 있음",
  stored: "결과 저장됨",
  unknown: "결과 미확인",
};
export const statusLabel = {
  ready: "시작 전",
  running: "처리 중",
  uncertain: "결과 확인 필요",
  failed: "변환 실패 · 정리 필요",
  complete: "완료 확인",
};
