---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Temporal 실패 분류: 무엇을 재시도하고 어디서 멈출까?"
key: "temporal-failure-classification"
description: "Activity 재시도, Workflow Task 실패, Workflow 실행 실패를 구별하고 영구 오류와 재시도 예산을 정한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
readingMinutes: 6
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

문서 형식이 지원되지 않아 변환할 수 없는데, Activity가 계속 같은 입력을 받는다고 하자. 일시적인 네트워크 오류와 영구적인 입력 오류에 같은 재시도를 적용하면 복구할 수 없는 작업이 계속 자원을 사용한다. 반대로 순간적인 연결 실패를 영구 실패로 분류하면 정상 처리할 요청을 너무 빨리 포기한다.

이 글은 14·15편 다음에 읽는 보충 글이다. Java SDK **1.40.0**을 기준으로 어느 실행 단위가 실패했는지, 누가 다시 시도하는지, 언제 보상 코드로 넘어가는지를 구별한다. 시간 제한 자체의 의미는 [14편](/posts/temporal-14-activity-timeout-boundaries/)을 따른다.

## 실패한 단위부터 찾는다

| 실패 위치                                                        | 기본 동작                                      | 관찰할 것                                |
| ---------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| Activity의 일시 오류                                             | Activity Retry Policy에 따라 다시 시도         | Pending Activities의 Attempt·LastFailure |
| Activity의 비재시도 오류·재시도 예산 소진                        | Workflow 호출에 ActivityFailure 전달           | cause와 업무 원장, 보상 처리             |
| Workflow 코드의 일반 RuntimeException                            | Workflow Task 실패·재시도, 실행은 보통 Running | WorkflowTaskFailed, Worker 오류          |
| Workflow에서 처리되지 않은 ApplicationFailure 등 TemporalFailure | Workflow 실행 실패 가능                        | 실행의 Failed 상태와 원인                |

일반 RuntimeException도 `WorkflowImplementationOptions`의 실패 예외 타입 설정을 바꾸면 실행 실패로 처리할 수 있다. 이 표는 기본 설정이며 Cancel 요청이 이미 처리된 종료 경로는 [17편](/posts/temporal-17-cancel-versus-terminate/)의 별도 규칙을 따른다. 모든 예외에 같은 결론을 적용하지 않는다.

Workflow Task를 반복해도 버그가 저절로 없어지지는 않는다. 그러나 실행을 즉시 실패시키지 않으면 버그를 수정한 Worker를 올려 기존 실행을 이어갈 여지가 있다. 이 장점에는 Running 상태로 오랫동안 멈춘 실행을 발견할 관측 책임도 따른다.

## Activity 기본 재시도는 몇 번일까?

별도 정책이 없으면 Activity는 초기 간격 **1초**, 증가 계수 **2**, 최대 간격 **100초**, 최대 시도 수 **무제한**인 기본 정책을 사용한다. 실제 재시도는 Schedule-to-Close 등 다른 실행 제약으로 끝날 수도 있다. Workflow 실행 자체에는 기본 Retry Policy가 없으며 Workflow Task의 재시도와 다르다. [Retry Policy](https://docs.temporal.io/encyclopedia/retry-policies).

실습에서는 종료 조건을 분명히 한다. 다음 값은 동작을 관찰하기 위한 값이며 운영 권장값이 아니다.

```java
ActivityOptions options = ActivityOptions.newBuilder()
    .setStartToCloseTimeout(Duration.ofSeconds(3))
    .setScheduleToCloseTimeout(Duration.ofSeconds(15))
    .setRetryOptions(RetryOptions.newBuilder()
        .setInitialInterval(Duration.ofSeconds(1))
        .setBackoffCoefficient(2)
        .setMaximumInterval(Duration.ofSeconds(4))
        .setMaximumAttempts(3) // 최초 시도를 포함해 최대 3회
        .setDoNotRetry("InvalidDocument")
        .build())
    .build();
```

최대 시도 수는 총 세 번이며 첫 시도 뒤 추가 세 번이 아니다. 전체 시간 예산이 먼저 끝나면 세 번째 시도까지 도달하지 않을 수도 있다. Activity 코드가 timeout 뒤에도 실행 중일 수 있으므로 이 옵션은 DB 중복 저장 방지를 대신하지 않는다.

## 영구 오류는 명시적으로 표현한다

지원하지 않는 파일 형식처럼 같은 입력으로 성공할 가능성이 없는 경우, Activity에서 비재시도 실패를 반환할 수 있다.

```java
throw ApplicationFailure.newNonRetryableFailure(
    "지원하지 않는 문서 형식", "InvalidDocument");
```

이 실패의 비재시도 표지는 오류 자체의 성질이다. 앞 코드의 `setDoNotRetry`는 호출 측 정책에서 실패 type을 제외하는 방식이다. type은 message 문자열과 다르므로 안정된 분류명을 정한다. `ApplicationFailure`는 `io.temporal.failure`, `RetryOptions`는 `io.temporal.common`에 있다.

“404니까 모두 영구 실패” 같은 규칙도 위험하다. 아직 업로드가 끝나지 않은 원본의 조회 실패와 영구 삭제된 원본은 업무 의미가 다르다. 네트워크 장애, 일시 권한 갱신, 잘못된 입력, 영구 삭제를 구별하고 원본의 수명 계약을 함께 확인한다.

## 세 실패를 따로 시험한다

1. Activity가 처음 두 번 일시 오류를 내고 세 번째 성공하도록 한다. 시도 번호와 결과를 확인한다.
2. 같은 입력에서 `InvalidDocument`를 비재시도로 반환한다. 추가 시도 없이 Workflow에 최종 실패가 전달되는지 확인한다.
3. Workflow 코드에서 일반 `IllegalStateException`을 발생시킨다. Activity 재시도와 달리 Workflow Task가 실패하고 실행이 Running에 남는지 확인한다. 실험을 마치면 테스트 환경을 닫는다.

Java 1.40.0 메모리 테스트에서 취소 뒤 일반 IllegalStateException이 Running에 남는 경로와 예약 Activity의 비재시도 실패 뒤 보상 1회를 별도로 확인했다. 위 세 단계 전체나 실제 운영 Server를 수행했다는 뜻은 아니다. 작은 재현과 실제 서비스의 관측을 구분한다.

최종 실패를 catch하기 전에 무제한 재시도가 계속되면 보상 코드에도 도달하지 않는다. [22편의 보상](/posts/temporal-22-compensation-reservation-failures/)에서는 “언젠가 실패하겠지”라고 기다리지 말고 실패 분류·전체 시간 예산·보상 실패의 후속 처리를 함께 정한다.

## 확인 질문

Activity가 재시도 중인 상태와 Workflow Task가 계속 실패하는 상태를 어디서 구별할까? 영구 오류를 잘못 재시도했을 때와 일시 오류를 너무 빨리 포기했을 때 각각 어떤 업무 손실이 생길까?

## 참고 자료

- [Java 오류 처리](https://docs.temporal.io/develop/java/best-practices/error-handling)
- [Java 1.40.0 Workflow 예외 처리 구현](https://github.com/temporalio/sdk-java/blob/v1.40.0/temporal-sdk/src/main/java/io/temporal/internal/sync/WorkflowExecutionHandler.java)
- [Java 테스트](https://docs.temporal.io/develop/java/best-practices/testing-suite)
