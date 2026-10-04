---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "보상을 등록했는데 예약이 남는 이유"
key: "temporal-22-compensation-reservation-failures"
description: "응답 유실 전에 보상을 등록하고 실제 실행하며, 늦은 예약과 보상 실패까지 계약으로 다룬다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 22
readingMinutes: 7
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

문서 처리에서 허용량을 예약한 뒤 변환이 실패하면 예약을 해제하기로 했다고 하자. 코드는 예약 Activity가 반환된 다음 보상을 등록한다. 정상 경로에서는 자연스러워 보이지만 예약은 성공하고 응답만 유실되면 문제가 생긴다. 호출이 실패로 끝나 보상 등록 줄에 도달하지 못했는데 외부 예약은 남아 있을 수 있다.

보상은 실패한 코드를 거꾸로 실행하는 자동 기능이 아니다. 이미 발생했을 수 있는 외부 효과를 업무 규칙에 맞게 처리하는 별도 작업이다. 어떤 효과가 생겼는지 확실하지 않은 상황까지 설계해야 한다.

## 성공 응답 뒤 등록하는 순서의 빈틈

허용량 서비스가 예약을 DB에 commit한 직후 네트워크 연결이 끊겼다고 생각해 보자. Temporal은 성공 결과를 받지 못했으므로 Activity를 재시도하거나 최종 실패로 판단할 수 있다. Workflow에는 예약 ID가 반환되지 않았지만 서비스에는 실제 예약이 있을 수 있다.

“예외가 났으니 예약은 없을 것”이라는 가정이 잘못된 것이다. 이 경우 보상 등록을 성공 응답 뒤에만 두면 해제해야 할 대상을 놓친다. 외부 성공과 호출자 관점의 성공은 분산 시스템에서 분리될 수 있다.

공식 Temporal 보상 설명은 수행 전에 보상을 등록하고, 해당 효과가 실제로 없으면 보상이 아무 변경 없이 끝나도록 설계하는 예를 제시한다. 이것은 무조건 취소 API를 먼저 실행한다는 뜻이 아니다. 나중에 실패했을 때 수행할 작업을 미리 등록한다는 의미다.

## 외부 호출 전부터 아는 식별자가 필요하다

응답이 오지 않아도 예약을 찾으려면 호출 전에 알고 있는 operation ID가 유용하다. 예약 서비스가 같은 operation ID의 요청에 같은 예약을 반환하고, 해제도 이 ID로 처리할 수 있는 계약을 제공한다고 가정한다.

```java
// Workflow 메서드의 입력 operationId는 요청마다 고정한다.
// reservations는 reserve(String), releaseIfReserved(String)를 가진 Activity stub이다.
Saga saga = new Saga(new Saga.Options.Builder()
    .setContinueWithError(true).build());
saga.addCompensation(reservations::releaseIfReserved, operationId);
try {
    reservations.reserve(operationId);
} catch (RuntimeException failure) {
    Workflow.newDetachedCancellationScope(saga::compensate).run();
    throw failure;
}
```

이 골격은 예약의 최종 실패에 보상을 실행하는 경로만 보여 준다. Java SDK 1.40.0 메모리 테스트 서버에서 컴파일하고 예약 기록 후 실패 → 해제 1회를 확인했다. `Saga`는 `io.temporal.workflow.Saga`이며, 보상 등록만으로 실행되지 않는다. catch에서 `compensate()`를 호출해야 한다. 이 코드만으로 안전한 Saga가 완성되지는 않는다. `releaseIfReserved`는 예약이 없는 경우, 이미 해제된 경우, 이미 확정된 경우를 구별해야 한다. 확정된 예약을 무조건 해제하면 정상 처리된 문서의 사용량까지 되돌릴 수 있다. 예약 서비스가 허용하는 상태 전이부터 정해야 한다.

operation ID는 문서 ID와 반드시 같을 필요가 없다. 같은 문서를 다른 버전으로 다시 변환할 수 있다면 각각 독립적인 처리 요청을 구별할 식별자가 필요하다. 단, 동일 요청의 재시도에서는 값이 유지돼야 한다. 입력에서 받거나 Workflow 안에서 `Workflow.randomUUID()`로 만들고 Activity에 전달한다. `UUID.randomUUID()`를 Workflow에서 사용하면 replay 때 값이 달라질 수 있으며 Activity 인자 비교로 반드시 감지되는 것도 아니다.

## 보상은 과거 DB 상태를 복원하지 않는다

예약 해제는 현재 상태를 확인하고 적용하는 새로운 업무 변경이다. 예약 이후 다른 요청이 허용량을 사용했을 수도 있으므로 DB 전체를 이전 시점으로 되돌리는 방식과 다르다. Saga가 여러 서비스에 걸친 ACID 격리를 자동으로 제공한다고 설명하면 안 된다.

문서 결과 저장 이후 확정만 실패한 경우도 따로 생각해야 한다. 결과를 삭제할 것인지, 확정을 재시도할 것인지, 결과를 비공개 상태로 남길 것인지 정책에 따라 다르다. 한 가지 catch 블록에서 모든 실패를 같은 취소로 처리하면 이미 발생한 효과와 맞지 않을 수 있다.

실패 지점별로 예약 상태와 결과 상태를 표로 적어 보면 빠진 조건이 드러난다. 예약 성공·변환 실패, 저장 성공·확정 응답 유실, 보상 자체 실패를 구별한다. 코드보다 먼저 각 상태에서 사용자에게 무엇을 보여줄지 정한다.

## 응답 유실과 보상 실패를 따로 넣는다

대표 실험에서는 예약 mock이 저장은 한 뒤 성공 응답 대신 오류를 반환하도록 한다. 응답 뒤 보상 등록 방식과 사전 등록·조건부 해제 방식을 비교한다. 예상은 후자가 이미 존재할 수 있는 예약을 찾아 처리할 수 있다는 것이다. 실제 결과는 원장 상태와 Activity 이력으로 확인한다.

다음 비교에서는 해제 API 자체를 실패시킨다. 보상 함수를 등록했다는 사실과 보상 효과가 완료됐다는 사실은 다르다. 재시도 정책을 소진한 후 어떤 예약이 남았는지 찾을 수 있어야 한다. 보상 실패를 로그만 남기고 전체 성공으로 반환하면 복구 대상이 숨겨질 수 있다.

취소 시에도 보상이 필요하다면 취소된 범위와 분리해 정리할 수 있는지 검토한다. 그러나 Terminate된 Workflow는 정리 코드를 실행할 기회가 없으므로 같은 보상 경로가 자동으로 작동할 것이라 기대하지 않는다.

이 글의 완료 기준은 “Saga helper를 썼다”가 아니다. 응답이 없을 때도 처리 대상을 찾을 수 있고, 조건부 보상이 반복돼도 안전하며, 끝내 정리하지 못한 대상을 식별할 수 있는지다. 업무 일관성은 함수 등록 목록보다 최종 외부 상태로 검증한다.

**확인 질문:** 예약 ID를 응답으로만 받을 수 있다면 응답 유실 뒤 어떻게 예약을 찾을까? 이미 확정된 예약에 해제 요청이 왔을 때 어떤 결과가 맞을까?

## 보상이 먼저 끝난 뒤 늦은 예약이 오면?

예약 없음에 대한 해제가 단순 no-op이면 다음 경쟁이 가능하다. 예약 요청 지연 → Activity timeout → 보상에서 예약 없음 확인 → 늦은 요청의 예약 commit. 이 순서는 설계상 가능한 실패이며 이 글의 메모리 테스트가 동시성을 검증한 것은 아니다.

참여자는 `operationId`별 취소 표시를 보존하고, 그 뒤 같은 ID의 예약을 거절해야 한다. 예약 생성과 취소 표시 확인은 같은 로컬 트랜잭션에서 경쟁을 제어한다. 멱등성은 같은 동작의 반복을 막고 이 계약은 **다른 동작인 예약과 취소의 역전**을 다룬다.

보상 Activity에도 유한한 timeout·재시도 조건이 필요하다. Saga의 기본 순차 보상은 하나가 실패하면 뒤 보상을 건너뛸 수 있다. `continueWithError`·병렬 보상 옵션은 실행 순서와 오류 처리 의미가 다르다. 보상 실패를 일반 RuntimeException으로만 넘겨 Workflow Task가 반복 실패하는 상태를 숨기지 말고, 외부 원장에 정리 필요 상태와 복구 담당 경로를 남긴다. Terminate·실행 timeout에서는 이 catch가 실행되지 않는다.

응답 유실 실험은 첫 실패를 retry로 복구하는 경우와 최종 실패로 보상까지 가는 경우를 구별한다. Activity 기본 재시도는 무제한이므로 실험에는 최대 시도 수 또는 Schedule-to-Close를 명시한다. [실패 분류 보충 글](/posts/temporal-failure-classification/)을 먼저 확인한다.

## 참고 자료

- [Temporal 보상 등록 순서](https://temporal.io/blog/compensating-actions-part-of-a-complete-breakfast-with-sagas)
- [Activity 멱등성과 응답 유실](https://docs.temporal.io/activity-definition)
- [Java 취소 처리](https://docs.temporal.io/develop/java/workflows/cancellation)
