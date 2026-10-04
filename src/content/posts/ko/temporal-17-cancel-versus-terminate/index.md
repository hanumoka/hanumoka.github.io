---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Cancel과 Terminate는 정리 결과가 다르다"
key: "temporal-17-cancel-versus-terminate"
description: "사용자가 문서 처리를 취소했다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 17
readingMinutes: 6
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

사용자가 문서 처리를 취소했다. 허용량은 이미 예약됐고 변환 Activity가 실행 중이다. 이때 실행을 목록에서 멈추는 것만으로 업무 취소가 완성되는 것은 아니다. 예약을 해제해야 하는지, 만들어진 임시 결과를 지워야 하는지, 이미 확정한 결과를 유지할지 정해야 한다.

Temporal의 Cancel과 Terminate는 모두 실행을 중단하는 데 관련되지만 정리 기회를 다르게 제공한다. Cancel은 Workflow가 요청을 처리할 수 있는 협력적 방식이다. Terminate는 실행을 강제로 종료하며 Workflow 코드에 정리할 기회를 주지 않는다.

## 취소 요청과 취소 완료를 구별한다

Client가 Cancel을 요청하면 Service에 취소 요청이 기록되고 Workflow가 이를 처리할 수 있도록 진행한다. 취소 API 응답이 왔다고 예약 해제까지 끝났다는 뜻은 아니다. Worker가 요청을 처리해야 하고, 정리 Activity가 실패하면 추가 대응도 필요하다.

Workflow에서는 취소 가능한 작업을 Cancellation Scope로 묶을 수 있다. 취소가 전달되면 해당 범위의 Activity·Timer 등으로 전파된다. 다만 외부 HTTP 서버나 별도 변환 프로세스까지 자동으로 강제 종료되는 것은 아니다. 외부 작업을 중단하는 실제 API와 애플리케이션 코드가 있어야 한다.

원격 Activity가 취소를 전달받으려면 Heartbeat가 필요하다. 오래 걸리는 호출이 끝날 때까지 아무 보고도 하지 않는다면 사용자의 취소 요청을 적시에 감지하지 못할 수 있다. Workflow의 상태, Activity의 상태, 외부 변환의 상태를 각각 확인해야 한다.

## 정리 작업은 취소된 범위 밖에서 실행할 수 있다

이미 취소된 범위 안에서 예약 해제 Activity를 새로 실행하려 하면 정리 작업도 취소 영향을 받을 수 있다. Java SDK는 취소와 분리된 Cancellation Scope에서 정리하는 방법을 제공한다. 이 기능은 “취소 중에도 반드시 무한정 성공시킨다”는 보장이 아니라 정리 작업을 실행할 수 있는 제어 수단이다.

```java
// 예약이 확보된 뒤 Timer를 기다리다가 취소되는 경로만 설명한다.
try {
    Workflow.sleep(Duration.ofMinutes(10));
} catch (CanceledFailure canceled) {
    Workflow.newDetachedCancellationScope(() -> {
        activities.releaseReservation(operationId);
    }).run();
    throw canceled;
}
```

위 코드는 Timer 대기 중 전달되는 CanceledFailure만 처리한다. Activity 호출을 기다리던 경로에서는 ActivityFailure의 원인이 CanceledFailure인지도 확인해야 하므로 그대로 대체해서 쓰면 안 된다. 실제 코드는 선택한 SDK의 취소 예외 전달 방식과 Activity 취소 옵션을 확인해 별도로 작성한다. 예약이 실제 존재하는지, 이미 확정됐는지에 따라 `releaseReservation`의 결과도 달라져야 한다.

정리가 끝난 뒤 취소 예외를 삼켜 정상 반환하면 실행이 Completed로 보일 수 있다. “정리를 했으니 성공으로 끝낸다”와 “업무 취소로 끝낸다”는 다른 정책이다. 운영 화면과 사용자 응답에 어떤 상태가 맞는지 결정하고 그 상태를 의도적으로 표현한다.

## Terminate 뒤에는 보상이 자동으로 실행되지 않는다

대표 실패 실험은 동일한 예약 완료 상태에서 한 실행에는 Cancel, 다른 실행에는 Terminate를 적용하는 것이다. 예상은 Cancel에서 구현한 정리 경로를 수행할 수 있지만, Terminate에서는 Workflow의 정리 코드가 실행되지 않는다는 것이다.

여기서 주의할 점은 Terminate가 외부 작업의 물리적인 종료를 뜻하지 않는다는 것이다. Service의 Workflow 실행은 종료돼도 이미 시작된 외부 API 작업이 계속 진행할 수 있다. 예약과 임시 결과가 남는지 외부 상태를 직접 확인해야 한다.

따라서 운영자가 Terminate를 사용할 때는 남은 외부 작업을 어떻게 찾아 정리할지 알고 있어야 한다. 가상 예제에서는 operation ID로 예약 원장과 결과 저장소를 조회해 상태를 확인할 수 있다. 실행 이력이 닫혔다는 이유만으로 결과 행을 임의 삭제하는 것은 업무 일관성을 검토한 복구가 아니다.

## 취소도 실패할 수 있는 업무다

예약 해제 API가 장애인 경우를 생각해 보자. 사용자 취소 요청은 유효하지만 해제는 아직 완료되지 않았다. 이 상황을 단순히 “취소 성공”으로 처리하면 허용량이 계속 묶여 있어도 사용자는 알 수 없다. 취소 요청됨, 정리 진행 중, 정리 실패처럼 필요한 상태를 계약에 반영할 수 있다.

실습 자료에는 요청 시각, Workflow가 감지한 시각, 해제 Activity 결과, 최종 예약 상태를 남긴다. 실패하면 먼저 취소가 전달되지 않았는지, 전달됐지만 외부 해제가 실패했는지 나눈다. 두 문제는 Heartbeat 설정과 외부 서비스 장애라는 서로 다른 원인을 가질 수 있다.

취소를 정상 흐름의 예외적인 덧붙임으로만 보면 정리 로직이 빠지기 쉽다. 예약·확정·취소 각각의 상태 전이를 먼저 적고, 사용자가 어느 지점에서 취소해도 어떤 상태가 남을지 설명하는 것이 코드보다 앞선 작업이다.

**확인 질문:** Terminate된 Workflow에서 예약이 남았다면 어떤 근거로 해제 여부를 결정할까? 취소 예외를 잡고 정상 값을 반환하면 사용자가 기대한 상태와 어떻게 달라질까?

## 참고 자료

- [Java Workflow 취소와 종료](https://docs.temporal.io/develop/java/workflows/cancellation)
- [Java 오류 처리와 취소 예외](https://docs.temporal.io/develop/java/best-practices/error-handling)
- [Activity Heartbeat](https://docs.temporal.io/develop/java/activities/timeouts)
