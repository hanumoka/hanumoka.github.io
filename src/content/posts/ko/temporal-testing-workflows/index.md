---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Temporal 테스트: Workflow 규칙과 외부 효과를 나눠 검증하기"
key: "temporal-testing-workflows"
description: "TestWorkflowEnvironment, Activity 대역, 시간 건너뛰기로 검증할 것과 실제 Server·DB에서 확인할 것을 구별한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
readingMinutes: 6
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

예약 성공 뒤 변환이 실패하면 해제를 요청한다는 규칙을 시험할 때 실제 변환 서버가 반드시 필요할까? Workflow의 분기와 외부 시스템의 저장 정확성은 나누어 확인할 수 있다. 이 글은 [첫 Java 실행](/posts/temporal-11-first-java-workflow/)과 [실패 분류](/posts/temporal-failure-classification/) 다음에 읽는 보충 글이다.

Java SDK 1.40.0의 `temporal-testing`을 기준으로 TestWorkflowEnvironment와 Activity 대역을 사용한다. 테스트 서버에서 성공했다는 사실을 PostgreSQL 영속 복원이나 Kubernetes 운영의 증거로 확대하지 않는 것이 범위다.

## 무엇을 검증하는 테스트인가?

| 대상                         | 도구·환경                                | 확인할 결과                           |
| ---------------------------- | ---------------------------------------- | ------------------------------------- |
| Workflow 분기·대기·보상 호출 | TestWorkflowEnvironment + Activity 대역  | 결과·호출 순서·호출 횟수              |
| Activity의 업무 코드         | 단위 테스트 또는 TestActivityEnvironment | 입력 검증·오류 분류·Heartbeat 처리    |
| 실제 DB의 중복 방지·동시성   | 선택한 DB와 병렬 요청                    | 업무 키별 행 수·입력 충돌·트랜잭션    |
| 과거 실행과 새 코드의 호환   | WorkflowReplayer + 기존 History          | 기존 명령과 새 코드의 일치            |
| 프로세스·스토리지·배포 복구  | 개발 서버 또는 격리된 실제 배포          | 재접속·영속 데이터·네트워크·배포 상태 |

대역(mock 또는 fake)은 원하는 성공·실패를 돌려주는 Activity 구현이다. 실제 외부 API를 호출하지 않으므로 “변환 서버가 올바르게 동작한다”는 결론을 낼 수 없다. 대신 실패 위치를 일정하게 만들어 Workflow의 반응을 반복 검증할 수 있다.

## Worker 등록부터 같은 계약을 사용한다

11편의 `DocumentWorkflow`, `DocumentWorkflowImpl`, `DocumentActivities`가 같은 테스트 프로젝트에 있다고 가정한다. 다음 코드는 JUnit 5와 `io.temporal.testing`, `io.temporal.worker`, `io.temporal.client` 타입을 사용하는 최소 테스트다.

```java
@Test
void returnsActivityResult() {
    try (TestWorkflowEnvironment env = TestWorkflowEnvironment.newInstance()) {
        Worker worker = env.newWorker("document-test");
        worker.registerWorkflowImplementationTypes(DocumentWorkflowImpl.class);
        worker.registerActivitiesImplementations(
            (DocumentActivities) id -> "converted:" + id);
        env.start();
        DocumentWorkflow workflow = env.getWorkflowClient().newWorkflowStub(
            DocumentWorkflow.class, WorkflowOptions.newBuilder()
                .setTaskQueue("document-test").build());
        assertEquals("converted:document-1042", workflow.process("document-1042"));
    }
}
```

문자열 결과 하나를 검사하지만 확인하는 경계는 분명하다. Workflow와 Activity가 등록되고, Workflow가 SDK stub으로 요청한 결과를 받는지 본다. `env.close()`까지 실행해 poller와 테스트 서버가 다음 테스트에 남지 않게 한다. 실제 애플리케이션의 TLS 설정이나 DB 연결은 여기서 검증하지 않는다.

## 시간 건너뛰기가 줄여 주는 대기는 무엇인가?

Workflow에 하루짜리 Timer가 있다고 하루를 기다릴 필요는 없다. 테스트 환경은 조건이 맞으면 가상 시간을 진행시켜 Timer를 빠르게 만료시킬 수 있다. 그러나 Activity 안의 `Thread.sleep`, HTTP 응답 대기, 외부 DB 지연을 같은 방식으로 가속하지는 않는다. Activity 실행이 끝나지 않으면 자동 시간 진행을 막을 수도 있다.

따라서 “하루 뒤 예약 만료를 결정하는가?”는 가상 Timer로 시험하고, “HTTP 호출이 실제 3초 뒤 timeout되는가?”는 별도 통합 시험으로 분리한다. 긴 대기를 대역으로 줄였다는 사실을 실험 결과에 적는다.

## 정상 결과보다 실패 조건을 하나씩 바꾼다

1. Activity 대역이 정상 결과를 반환하도록 하고 기준 테스트를 통과시킨다.
2. 예약 대역이 원장에 기록한 다음 비재시도 실패를 던지게 한다. 22편의 사전 보상 등록과 catch의 `compensate()`가 해제를 호출하는지 확인한다.
3. 해제 대역도 실패하게 한다. 업무가 성공으로 잘못 끝나지 않는지, 정리 필요 대상을 식별할 근거가 있는지 확인한다.
4. Timer 대기 중 Cancel을 요청한다. Workflow 상태뿐 아니라 외부 원장의 예약·해제 결과도 검사한다.

반복 테스트에는 안정된 업무 ID를 쓰되 테스트 환경 사이에서는 데이터를 분리한다. 최대 시도 수나 전체 시간 제한이 없으면 실패 대역이 끝없이 재시도되어 테스트 자체가 끝나지 않을 수 있다. 임의의 긴 sleep보다 Query·latch·결과 future처럼 목표 상태를 확인할 방법을 사용한다.

이번 교차검토에서는 Java 1.40.0 메모리 서버로 취소 후 반환, 일반 예외, 예약 실패 뒤 보상 호출, ID 재사용을 재현했다. DB 잠금·늦은 예약의 동시 경쟁, 실제 Cloud의 권한과 장애 복구는 그 결과에 포함되지 않는다.

## 개발 서버에서도 확인해야 하는 이유

메모리 테스트 서버는 빠른 업무 로직 검증 도구이며 실제 Server의 모든 기능과 경합을 동일하게 구현한다는 보장이 없다. 특히 Child 시작·부모 종료 경쟁, Worker Versioning, 보안·배포 기능은 대상 버전의 개발 서버나 실제 환경에서 재확인한다. 테스트 서버 통과와 개발 서버 실패가 다르면 코드 오류를 단정하기 전에 지원 범위와 이벤트를 대조한다.

재시작 시험에는 파일 DB 등 영속 설정이 필요하다. 테스트 환경을 닫고 새 환경을 만드는 것은 기존 DB에서 실행을 복원하는 시험이 아니다. replay 테스트도 외부 API를 다시 호출하는 시험과 다르다. 이 차이는 [36편](/posts/temporal-36-replay-compatible-workflow-changes/)에서 이어서 확인한다.

## 확인 질문

Activity 대역으로 보상 호출을 확인했는데 실제 DB에 예약이 남을 수 있는 이유는 무엇일까? 시간 건너뛰기가 Workflow Timer를 빠르게 처리해도 외부 HTTP 지연을 대신 검증하지 못하는 이유는 무엇일까?

## 참고 자료

- [Java 테스트 환경과 시간 건너뛰기](https://docs.temporal.io/develop/java/best-practices/testing-suite)
- [Temporal Java 공식 예제](https://github.com/temporalio/samples-java)
