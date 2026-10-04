---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "첫 Java Workflow를 실행한다"
key: "temporal-11-first-java-workflow"
description: "첫 실습의 목적은 실제 문서 변환 기능을 만드는 것이 아니다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 11
readingMinutes: 7
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

첫 실습의 목적은 실제 문서 변환 기능을 만드는 것이 아니다. Java 코드의 어느 부분이 실행 순서를 정하고 어느 부분이 실제 작업을 하는지 확인하는 것이다. 먼저 문서 ID를 받아 고정된 결과를 돌려주는 Activity 하나로 시작한다. 허용량 예약·저장·확정은 이후 글에서 붙인다.

이 글의 코드는 구조를 설명하는 부분 코드다. 실행하려면 선택한 Java SDK 버전의 의존성, Worker 시작 코드, Client 연결 설정이 필요하다. 다음 결과들은 관찰할 항목이며 실제로 실행해 얻은 성과를 뜻하지 않는다.

## 인터페이스가 호출 계약이 된다

Java SDK에서는 Workflow 인터페이스에 진입점을 정의한다. 이 예제의 입력은 문서 ID이고 출력은 변환 결과를 나타내는 문자열이다. 실제 시스템에서는 입력 DTO를 사용하면 필드를 추가할 때 메서드 인자를 계속 늘리지 않아도 된다. 첫 실습에서는 역할을 보려고 단순한 타입을 쓴다.

```java
@WorkflowInterface
public interface DocumentWorkflow {
    @WorkflowMethod
    String process(String documentId);
}

@ActivityInterface
public interface DocumentActivities {
    String convert(String documentId);
}
```

Workflow 구현은 Activity 구현체를 직접 생성하지 않는다. SDK가 제공하는 Activity stub을 만들어 호출한다. 이 stub 호출은 일반 Java 메서드처럼 보이지만, 외부 작업을 예약하고 그 결과를 기다리는 Temporal 동작으로 연결된다.

```java
public class DocumentWorkflowImpl implements DocumentWorkflow {
    private final DocumentActivities activities =
        Workflow.newActivityStub(
            DocumentActivities.class,
            ActivityOptions.newBuilder()
                .setStartToCloseTimeout(Duration.ofSeconds(30))
                .build());

    @Override
    public String process(String documentId) {
        return activities.convert(documentId);
    }
}
```

30초는 이 예제에서 한 Activity 시도의 실행 시간을 제한하기 위한 설명용 값이다. 운영 권장값이 아니며 실행 환경의 실제 처리 시간을 측정한 것도 아니다. Start-to-Close를 “30초 안에 Worker가 시작해야 한다”는 의미로 읽지 않는다. 배정을 기다리는 시간은 다른 제한이 담당한다.

## 구현을 작성하는 것과 등록하는 것은 다르다

Activity 구현은 평범한 Java 객체로 시작할 수 있다. `convert`가 문서 ID를 포함한 고정 문자열을 반환하게 한다. 아직 HTTP나 DB를 연결하지 않아도 Workflow와 Activity 사이의 호출 관계를 확인할 수 있다.

Worker에서는 Workflow 구현 타입과 Activity 구현 객체를 등록해야 한다. 인터페이스와 구현 파일이 프로젝트 안에 있다는 사실만으로 실행 대상이 되는 것은 아니다. Worker가 사용할 Task Queue도 Client의 시작 옵션과 일치해야 한다.

실행 순서는 로컬 Service 시작, Worker 시작, Client에서 Workflow 시작 요청이다. 결과가 반환되면 UI에서 동일한 Workflow ID를 찾아 Activity가 예약되고 완료된 기록을 확인한다. 콘솔에 원하는 문자열이 나왔다는 사실과 실행 이력에서 그 경로를 설명할 수 있다는 사실을 구별하자.

## 첫 테스트에서 확인할 것은 한 가지면 된다

Java SDK의 TestWorkflowEnvironment를 사용하면 테스트용 Service와 Worker를 함께 구성할 수 있다. 여기에 Workflow 구현과 고정 결과를 반환하는 Activity를 등록하고, Workflow를 호출해 예상 결과를 검사한다. 첫 테스트는 “문서 ID가 전달되고 Activity 결과가 Workflow 결과가 된다”는 계약에 집중한다.

일반 단위 테스트처럼 Workflow 구현 객체를 직접 만들고 메서드만 호출하는 방식은 SDK가 제공하는 실행 환경을 대신하지 못한다. Activity stub과 Workflow API는 실행 맥락을 필요로 한다. 순수한 문자열 처리 함수라면 별도 단위 테스트로 검증하고, Workflow 순서는 Temporal 테스트 환경에서 검증하는 편이 역할을 분명하게 만든다.

테스트가 통과해도 로컬 Service 연결과 실제 Worker 실행까지 검증한 것은 아니다. 테스트 환경 결과와 실제 프로세스 실행 결과를 각각 남긴다. JUnit 하나는 빠른 회귀 확인을, 로컬 실행은 연결·등록·큐 설정 확인을 담당한다.

## 등록 하나를 빼면 어디서 멈출까

대표 실패는 Activity 등록 누락이다. Workflow와 Client 설정을 그대로 두고 Worker에서 Activity 구현 등록만 제거한 구성을 비교한다. 예상은 Workflow의 Activity 요청이 정상적인 업무 완료로 이어지지 않는다는 것이다. 구체 오류와 재시도 동작은 선택한 SDK와 Worker 구성의 로그·이력으로 확인한다.

문자열 반환이 없다는 이유로 Client timeout부터 늘리는 것은 원인 해결이 아니다. Worker 로그에서 어떤 Activity 타입을 처리하려 했는지, 해당 타입을 등록했는지, 올바른 큐에 작업을 보냈는지 확인한다. 한 번에 여러 설정을 바꾸지 않아야 어떤 변경이 문제를 해결했는지 알 수 있다.

첫 실행이 끝나면 코드 ref, 의존성 버전, 실행 명령, Workflow ID, 결과와 테스트 결과를 기록한다. 성공 화면 하나보다 이 자료가 재현에 더 도움이 된다. 이후 예약이나 DB 저장을 붙일 때도 최소 예제가 여전히 통과하는지 비교할 수 있다.

**확인 질문:** Workflow 코드에서 Activity 구현 객체를 직접 호출하면 어떤 실행 관리가 빠질까? 테스트 환경에서 통과했는데 로컬 실행만 멈춘다면 어떤 설정부터 확인할까?

## 참고 자료

- [Java 첫 애플리케이션](https://learn.temporal.io/getting_started/java/hello_world_in_java/)
- [Java Activity 시간 제한](https://docs.temporal.io/develop/java/activities/timeouts)
- [Java 테스트 환경](https://docs.temporal.io/develop/java/best-practices/testing-suite)
