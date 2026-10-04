---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "메시지 handler가 끝나기 전에 종료하면"
key: "temporal-19-handler-completion"
description: "메시지 handler의 대기·동시 변경·완료를 Workflow 종료와 함께 관리한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 19
readingMinutes: 6
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

[18편](/posts/temporal-18-signal-query-update/)에서는 승인 의사를 보내는 것만 필요하면 Signal을 선택했다. 이 글은 **호출자가 승인 처리 결과까지 기다려야 하는 경우**라 Update를 사용한다. 요청을 목록에 넣고 바로 반환하면 결과는 처리 완료가 아니라 접수 완료다.

승인 Update를 받은 Workflow가 허용량 예약 Activity를 기다리고 있다고 하자. 그 사이 Workflow의 본문이 종료 조건을 만족해 반환하면 어떻게 될까? 요청을 받았다는 사실만으로 핸들러 안의 모든 작업이 끝났다고 볼 수 없다. 메인 로직과 핸들러의 종료 시점을 함께 설계해야 한다.

Temporal Workflow가 결정적으로 실행된다는 말은 여러 메시지 처리 흐름이 절대로 교차하지 않는다는 뜻이 아니다. Signal과 Update 핸들러는 Activity나 대기를 사용할 수 있고, 기다리는 지점에서 다른 핸들러나 메인 로직이 진행할 수 있다.

## Activity를 기다리는 동안 상태가 바뀔 수 있다

가상 문서 처리의 승인 핸들러가 현재 옵션을 읽고 예약 Activity를 호출한다고 가정한다. Activity를 기다리는 사이 다른 Update가 처리 옵션을 바꿀 수 있다. 첫 핸들러가 돌아와 결과를 저장하면 읽었던 옵션과 현재 상태가 서로 다를 수 있다.

일반 서버의 요청 동시성 문제와 비슷한 질문을 해야 하지만, 해결 수단은 Workflow 실행 환경에 맞춰야 한다. 임의의 Java 스레드를 만들거나 일반 blocking 락을 도입하기보다 SDK가 제공하는 Workflow 대기·동기화 방법을 확인한다. 외부 I/O는 계속 Activity 안에 둔다.

한 가지 설계는 핸들러가 요청을 내부 대기 목록에 추가하고 실제 업무 처리는 메인 로직이 순서대로 맡는 것이다. 반대로 핸들러 안에서 결과까지 기다려 반환하는 방식도 가능하다. 어느 쪽이든 대기 중 누가 상태를 바꿀 수 있는지 설명할 수 있어야 한다.

## 메인 함수의 반환도 상태 전이다

Workflow 본문이 결과를 반환하면 실행은 끝나는 방향으로 진행한다. 아직 Activity를 기다리는 핸들러가 있어도 자동으로 모두 마쳐 준다고 가정하면 안 된다. 공식 Java 문서는 종료 전에 `Workflow.isEveryHandlerFinished`를 기다리는 방식을 안내한다.

```java
// 실행 종료 직전의 핵심 동작을 나타낸 개념 코드
Workflow.await(() -> Workflow.isEveryHandlerFinished());
return finalResult;
```

이 한 줄만 붙이면 모든 문제가 해결되는 것은 아니다. 핸들러가 영원히 만족하지 않는 조건을 기다린다면 Workflow도 끝나지 못한다. 종료 요청 이후 새 메시지를 받을 때의 정책, 진행 중 처리의 기한, 취소된 핸들러의 정리 방식까지 정해야 한다.

Continue-As-New에도 같은 질문이 적용된다. 새 Run으로 넘어가기 전에 현재 핸들러가 완료됐는지 확인해야 한다. Update 핸들러 안에서 Continue-As-New를 직접 호출하는 방식은 지원되는 사용법이 아니므로 메인 Workflow가 전환을 담당하도록 구성한다.

## 늦게 끝나는 승인으로 경쟁을 만든다

대표 실패 실험에서는 승인 Update가 호출하는 가짜 예약 Activity를 지연시킨다. 그동안 메인 로직은 종료 조건을 만족하도록 만든다. 먼저 핸들러 완료를 기다리지 않는 코드에서 Client 결과와 실행 이력을 관찰한다. 다음으로 기다리는 코드를 넣어 비교한다.

기대하는 검증은 승인 요청 결과가 사라지거나 외부 예약만 남는 상황을 이해하는 것이다. SDK 버전과 코드에 따라 경고나 오류가 어떻게 나타나는지는 실제 실행으로 확인해야 한다. 이 글은 특정 오류 문구가 반드시 나온다고 주장하지 않는다.

실험 기록에는 Update를 보낸 시각, 예약 Activity 시작과 완료, 메인 로직 종료 시각, Client가 받은 결과를 남긴다. 한 줄의 “완료” 로그만 보면 어느 처리의 완료인지 알기 어렵다. 같은 문서 ID 외에도 요청별 식별자를 기록하면 순서를 대조하기 쉽다.

## 처리 순서보다 업무 조건을 먼저 정의한다

승인 이후 옵션 변경을 금지할 것인지, 승인 요청을 취소할 수 있는지 먼저 결정한다. 조건이 정해지면 핸들러가 상태를 읽고 바꾸는 지점을 줄일 수 있다. 예를 들어 대기 상태에서만 옵션 변경을 허용하고, 승인 수락 시 상태를 변경한 뒤 예약을 진행하도록 할 수 있다.

하지만 상태를 먼저 바꾼 뒤 예약이 실패하면 어떤 상태로 돌아갈지도 필요하다. 단순히 순서를 바꾸는 것만으로 업무 일관성이 완성되지는 않는다. 실패를 사용자에게 전달하고 다시 승인할 수 있는지, 이미 생긴 예약을 조회해야 하는지 정한다.

핸들러가 초기화 전에 들어오는 경우도 고려한다. Java SDK는 입력을 받는 초기화를 위한 기능을 제공하므로 사용하는 버전의 `@WorkflowInit` 규칙을 확인할 수 있다. 생성자에서 외부 호출이나 blocking 작업을 해 초기화를 늦추는 설계는 피한다.

동시성 검증은 운 좋게 한 번 순서가 맞은 결과로 끝내지 않는다. 테스트에서 Activity 완료 시점을 제어하고 승인·옵션 변경·종료 요청 순서를 바꿔 본다. 어떤 순서에서도 지켜야 할 조건을 기준으로 검증하면 로그의 우연한 순서에 덜 의존한다.

**확인 질문:** 핸들러 완료를 기다리는 코드를 넣었는데 영원히 종료하지 않는다면 어떤 조건을 확인할까? 승인 처리 중 옵션 변경을 허용할지 결정하지 않은 채 락부터 넣으면 무엇이 남을까?

## 종료 정책과 공유 상태 제어를 구별한다

기본 `WARN_AND_ABANDON`은 Workflow 종료 때 미완료 handler를 경고하고 포기한다. `ABANDON`은 경고를 끌 뿐 완료를 기다리지 않는다. 메인 로직에서 `Workflow.await(() -> Workflow.isEveryHandlerFinished())`로 필요한 handler 완료를 기다린다. 이 await는 조건이 참이 될 때까지 Workflow 진행을 멈추는 API다.

공유 상태는 `Workflow.newWorkflowLock()` 또는 `Workflow.await` 조건으로 제어한다. 일반 Java thread·lock과 혼용하지 않는다. `@WorkflowInit`은 Java 1.40.0에서 Experimental이며 메인 메서드보다 먼저 handler가 실행될 수 있는 상태 초기화에 쓰인다. Continue-As-New는 현재 Run을 닫고 입력을 넘겨 새 Run을 시작하는 동작이며 [24편](/posts/temporal-24-continue-as-new-state/)에서 이어 다룬다.

## 참고 자료

- [Java 핸들러 동시성과 종료 대기](https://docs.temporal.io/develop/java/workflows/message-passing)
- [Java Continue-As-New](https://docs.temporal.io/develop/java/workflows/continue-as-new)
- [Java 테스트 환경](https://docs.temporal.io/develop/java/best-practices/testing-suite)
