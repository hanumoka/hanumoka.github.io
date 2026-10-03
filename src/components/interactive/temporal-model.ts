export type Scenario = "success" | "retry";
export type FlowStep = {
  label: string;
  title: string;
  description: string;
  edge: string;
  nodes: string[];
  event: string;
  attempt: number;
  status: string;
};

const start: FlowStep[] = [
  {
    label: "시작",
    title: "클라이언트가 실행을 요청합니다",
    description:
      "워크플로 시작 요청을 받은 Temporal 서비스가 실행을 생성합니다. 서비스는 진행 정보를 보관하고, 워커가 가져갈 태스크를 준비합니다.",
    edge: "start",
    nodes: ["client", "service", "history"],
    event: "워크플로 실행 생성",
    attempt: 0,
    status: "실행 중",
  },
  {
    label: "워크플로",
    title: "워크플로 워커가 다음 일을 정합니다",
    description:
      "워크플로 태스크 큐를 폴링하던 워커가 태스크를 받습니다. 워크플로 코드는 순서를 정하고, 액티비티 실행 명령을 서비스에 전달합니다.",
    edge: "workflow",
    nodes: ["service", "workflow"],
    event: "워크플로 태스크 처리",
    attempt: 0,
    status: "실행 중",
  },
  {
    label: "예약",
    title: "서비스가 액티비티를 예약합니다",
    description:
      "액티비티 실행 명령을 받은 서비스가 ActivityTaskScheduled를 히스토리에 남기고 액티비티 태스크 큐에 작업을 넣습니다.",
    edge: "schedule",
    nodes: ["workflow", "service", "history"],
    event: "액티비티 태스크 예약",
    attempt: 0,
    status: "실행 중",
  },
  {
    label: "실행",
    title: "액티비티 워커가 실제 작업을 합니다",
    description:
      "액티비티 워커가 태스크를 가져와 HTTP 요청이나 파일 변환 같은 외부 작업을 수행합니다. 이 예시에서는 이미지 변환 작업을 가정합니다.",
    edge: "activity",
    nodes: ["service", "activity"],
    event: "이미지 변환 시도 1",
    attempt: 1,
    status: "실행 중",
  },
];
const complete: FlowStep = {
  label: "결과 기록",
  title: "완료 결과가 히스토리에 남습니다",
  description:
    "액티비티 워커가 성공을 보고하면 서비스가 완료 결과를 기록합니다. 워크플로 워커는 다음 워크플로 태스크에서 이 결과를 받습니다.",
  edge: "result",
  nodes: ["activity", "service", "history"],
  event: "액티비티 완료 결과 기록",
  attempt: 1,
  status: "실행 중",
};
const finish: FlowStep = {
  label: "완료",
  title: "워크플로가 결과를 받아 완료됩니다",
  description:
    "워크플로 워커가 결과를 처리하고 완료 명령을 보냅니다. 이 예시에서는 추가 작업 없이 실행을 마칩니다. 실제 업무에서는 다음 액티비티로 이어질 수 있습니다.",
  edge: "workflow",
  nodes: ["service", "workflow", "history"],
  event: "워크플로 실행 완료",
  attempt: 1,
  status: "완료",
};

export const scenarios: Record<Scenario, FlowStep[]> = {
  success: [...start, complete, finish],
  retry: [
    ...start,
    {
      label: "실패",
      title: "재시도 가능한 오류가 발생합니다",
      description:
        "첫 번째 이미지 변환이 일시적인 오류로 실패합니다. 서비스는 재시도 정책에 따라 다음 시도를 예약합니다. 이 실패만으로 워크플로 전체가 다시 시작되지는 않습니다.",
      edge: "result",
      nodes: ["activity", "service"],
      event: "일시적 오류 보고 · 재시도 대기",
      attempt: 1,
      status: "재시도 대기",
    },
    {
      label: "재시도",
      title: "대기 후 같은 액티비티를 다시 시도합니다",
      description:
        "백오프 시간이 지나면 새 액티비티 태스크가 큐에 들어갑니다. 가용한 액티비티 워커가 다시 수행합니다. 외부 작업의 중복 가능성에 대비해 멱등성을 설계해야 합니다.",
      edge: "activity",
      nodes: ["service", "activity"],
      event: "이미지 변환 시도 2",
      attempt: 2,
      status: "재시도 중",
    },
    { ...complete, attempt: 2 },
    { ...finish, attempt: 2 },
  ],
};

/** 최초 실행을 포함한 시도 수. 각 실패 뒤 대기만 계산하고 실행 시간은 제외한다. */
export function retryDelays(
  initial: number,
  coefficient: number,
  maximum: number,
  attempts: number
): number[] {
  return Array.from({ length: Math.max(0, attempts - 1) }, (_, index) =>
    Math.min(initial * coefficient ** index, maximum)
  );
}
