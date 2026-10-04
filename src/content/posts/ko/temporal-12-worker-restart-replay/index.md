---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Worker를 재시작하면 왜 이어지는가"
key: "temporal-12-worker-restart-replay"
description: "Worker 재시작에서 History 재생과 Activity 재시도가 어떻게 다른지 비교하고 캐시의 역할을 확인한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 12
readingMinutes: 6
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

Worker가 종료되면 그 프로세스의 메모리도 사라진다. 그런데 Temporal Workflow는 다시 실행한 Worker에서 진행을 이어갈 수 있다. Java 스레드의 실행 위치와 힙 전체를 저장했다가 복원하기 때문은 아니다. Service에 남은 Event History와 Workflow 코드를 사용해 필요한 상태를 다시 구성하기 때문이다.

이 글에서는 문서 변환 Activity가 끝난 뒤 잠시 기다렸다가 결과 저장 Activity를 실행하는 흐름을 생각한다. 목적은 재시작 자체를 성공 사례로 소개하는 것이 아니라, 복구 과정에서 어떤 코드는 다시 실행되고 어떤 외부 효과는 반복되지 않아야 하는지 구별하는 것이다.

## 이력에는 실행을 설명하는 사건이 남는다

Event History에는 Workflow 시작, Activity 예약과 완료, Timer의 시작과 완료처럼 실행에 필요한 사건이 기록된다. Activity가 결과를 보고하면 그 결과를 이후 Workflow 진행에 사용할 수 있다. Worker 메모리에만 결과가 있었다면 프로세스 종료 뒤 다음 단계를 결정할 근거를 잃는다.

새 Worker가 Workflow 상태를 구성할 때는 이력을 바탕으로 Workflow 코드를 재생한다. 코드가 이미 완료된 Activity를 호출하는 지점에 도달하면 해당 이력의 결과를 사용한다. 완료된 Activity의 실제 외부 작업을 replay 때문에 다시 수행하는 것이 아니다.

따라서 “Workflow 코드는 다시 실행될 수 있다”와 “완료된 Activity의 외부 효과가 다시 발생한다”는 서로 다른 문장이다. 이 차이를 놓치면 Workflow 안의 로그가 반복된 사실을 보고 DB 저장도 반복됐다고 판단하거나, 반대로 외부 효과는 절대로 중복되지 않는다고 오해하기 쉽다.

## 중단 위치를 정확하게 정해야 한다

실험 흐름은 변환 Activity → Workflow Timer → 저장 Activity로 둔다. Timer는 Worker를 중단할 시간을 확보하기 위한 장치다. Java에서는 일반 `Thread.sleep` 대신 Workflow가 제공하는 대기 API를 사용한다. 이 대기는 Workflow의 실행 이력과 함께 관리된다.

1. 변환 Activity를 실행하고 완료 이벤트가 이력에 남았는지 확인한다.
2. Timer 대기 중 Worker만 종료한다. Service는 계속 실행한다.
3. 같은 Workflow 구현을 등록한 Worker를 다시 시작한다.
4. 변환 Activity의 실제 호출 횟수와 저장 Activity의 결과를 비교한다.

예상은 이력에 완료가 남은 변환을 다시 수행하지 않고, 남은 흐름이 진행하는 것이다. 이때 호출 횟수는 Workflow 로그만 세지 않는다. Activity 측 호출 기록이나 실습용 외부 저장소의 효과를 함께 확인한다. 프로세스 메모리 카운터는 재시작하면 없어질 수 있으므로 증거의 보존 방식도 정해야 한다.

## 완료 보고 전 중단은 다른 실험이다

변환 API가 실제로 성공했지만 Activity Worker가 Service에 완료를 보고하기 전에 죽었다면 상황이 달라진다. Service는 외부 API 내부에서 성공했다는 사실을 자동으로 알 수 없다. 제한 시간이 지나고 정책에 따라 Activity를 재시도할 수 있다.

이때 외부 변환이 두 번 실행되는 것은 완료된 이력을 replay가 무시해서 생긴 일이 아니다. 성공을 확인할 이력이 아직 없어서 재시도한 것이다. 이 차이가 다음 멱등성 실험의 출발점이다. 외부 효과가 발생한 시각, 완료 보고 시각, Service의 기록 시각을 한 사건으로 합쳐서 설명하면 안 된다.

실습에서는 완료 보고 전 중단을 정확히 만들기 어려울 수 있다. 먼저 외부 저장 성공 직후 의도적으로 예외를 던지는 방법으로 유사한 불확실성을 만들 수 있다. 다만 이를 실제 네트워크 응답 유실과 완전히 동일한 환경이라고 주장하지 말고, 어느 경계를 시험한 것인지 적는다.

## 복구에 사용할 코드도 맞아야 한다

이력이 남았다고 어떤 Workflow 코드로도 복구되는 것은 아니다. 기존 이력은 변환 다음에 Timer를 기다렸는데 새 코드가 그 자리에 다른 Activity를 먼저 예약하면 재생 호환성이 깨질 수 있다. 재시작과 코드 변경을 동시에 하면 원인이 섞이므로 첫 실험에서는 코드를 고정한다.

다음으로 이력을 파일로 저장하고 Java의 WorkflowReplayer로 호환 여부를 확인한다. 정상 코드를 재생한 결과와 Activity 순서를 의도적으로 바꾼 코드의 결과를 비교한다. 새 실행이 성공하는지만 보면 과거 이력과의 호환 문제를 놓칠 수 있다.

이 실험의 완료 조건은 “재시작 후 성공했다” 한 줄이 아니다. 중단 지점에 어떤 이력이 있었는지, 외부 Activity가 몇 번 실행됐는지, 새 Worker가 어떤 코드로 재생했는지 설명할 수 있어야 한다. Service 자체를 재시작하는 실험은 저장소 설정과 이력 보존을 확인한 다음 별도로 수행한다.

**확인 질문:** 변환 Activity가 두 번 호출됐다면 완료 기록 이후 replay였는지, 완료 보고 전 실패 뒤 retry였는지 어떻게 구분할까? 같은 이력이 있어도 새 코드가 진행하지 못하는 이유는 무엇일까?

## 캐시와 실행 식별자를 구별한다

Worker는 replay를 줄이려고 Workflow 상태를 메모리에 캐시하고 후속 Task를 같은 Worker로 보내는 sticky 실행을 사용한다. 이것은 내구 저장소가 아니다. 캐시 축출·프로세스 재시작 뒤에는 History에서 다시 구성한다. Worker가 사라지면 sticky 대기 시간 이후 일반 큐로 돌아갈 수 있어 재시작 직후 즉시 재개만 기대하지 않는다.

Service로 보내는 다음 작업 지시를 **명령(Command)**이라고 부른다. 이미 완료한 Activity의 결과를 History에서 읽는 것과 외부 효과를 다시 실행하는 Activity 재시도는 다르다. 완료 보고 직전 중단의 멱등 저장은 [16편](/posts/temporal-16-idempotent-result-storage/)에서 검증한다.

## 관찰할 이력과 로그를 구별한다

첫 Activity 완료 뒤 `Workflow.sleep`으로 대기하는 동안 Worker 프로세스만 종료한다. Service를 유지하고 `ActivityTaskCompleted`, `TimerStarted`, `TimerFired`와 외부 호출 횟수를 대조한다. Activity 재시도는 매 시도마다 Started 이벤트를 남기지 않으므로 Pending Activities의 Attempt·LastFailure도 확인한다.

`Workflow.getLogger`는 기본적으로 replay 로그를 생략한다. 일반 로그 반복만으로 재생 여부를 판정하지 않는다. 확인용으로 replay 로깅을 켰다면 그 설정도 적는다. 외부 commit 뒤 예외를 던지는 시험과 완료 보고 전 프로세스를 강제로 끝내는 시험은 실패를 감지하는 방식과 재시도 시각이 다르다. 후자는 commit 뒤 정지 지점을 마련해 프로세스를 종료한다. [이벤트 기록](https://docs.temporal.io/references/events), [Java 테스트](https://docs.temporal.io/develop/java/best-practices/testing-suite).

## 참고 자료

- [Workflow 정의와 결정성](https://docs.temporal.io/workflow-definition)
- [Activity 완료와 멱등성](https://docs.temporal.io/activity-definition)
- [Java 이력 재생 테스트](https://docs.temporal.io/develop/java/best-practices/testing-suite)
