---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Spring 자동 설정 뒤에도 확인할 것은"
key: "temporal-21-spring-worker-registration"
description: "Spring 자동 검색과 명시 등록의 경계를 확인하고 설정 키·Worker 시작 실패를 진단한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 21
readingMinutes: 6
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

Java 기본 예제로 Worker와 Client의 역할을 이해했다면 Spring Boot 통합을 붙일 수 있다. 의존성과 설정을 통해 Client 생성과 Worker 구성을 줄일 수 있다. 그러나 자동 설정이 실행 계약까지 대신 정의하는 것은 아니다. 어떤 구현을 어느 큐에 등록하고 어떤 Service에 연결할지는 여전히 확인해야 한다.

이 글은 앞에서 만든 가상 문서 처리 예제를 Spring 애플리케이션으로 연결할 때 무엇을 비교할지 설명한다. 특정 프로젝트의 실행 결과나 최적 설정을 소개하는 글은 아니다. 사용할 SDK와 Spring 버전을 먼저 고정하고 해당 버전의 공식 통합 문서를 확인해야 한다.

## 자동 설정으로 사라지는 코드와 남는 책임

공식 통합은 `io.temporal:temporal-spring-boot-starter` 의존성을 사용한다. 연결 설정을 바탕으로 WorkflowClient를 구성하고 Worker를 명시적으로 등록하거나 자동 발견하도록 설정할 수 있다. 기존 Java 시작 코드에서 직접 만들던 객체 일부를 설정으로 옮기는 셈이다.

옮겨도 의미가 바뀌지 않는 항목이 있다. Service 주소와 Namespace, Task Queue, Workflow 구현 타입, Activity 구현은 여전히 필요하다. “애플리케이션이 기동됐다”는 로그만으로 이 연결과 등록이 모두 의도대로 구성됐다고 판단하지 않는다.

명시 등록은 어떤 Worker가 무엇을 실행하는지 설정에서 읽기 쉽다. 자동 발견은 반복 설정을 줄일 수 있지만 패키지 탐색 범위와 애너테이션이 실제 등록 결과에 어떤 영향을 주는지 확인해야 한다. 두 방식을 동시에 섞을 때도 중복 등록이나 예상하지 않은 Worker 구성이 없는지 살펴본다.

## Spring Bean이면 Workflow에 넣어도 될까

Activity에서는 일반적인 서비스 객체를 사용해 DB나 HTTP 호출을 수행할 수 있다. Spring의 의존성 주입으로 이 객체들을 구성하는 것은 자연스럽다. 그러나 같은 방식으로 DB Repository를 Workflow에 주입해 직접 조회하는 것은 별개의 문제다.

Workflow 코드는 재생될 수 있으므로 외부 I/O와 비결정적 상태를 직접 사용하는 제약은 그대로 남는다. Spring이 객체를 주입해 줬다는 사실이 결정성을 보장하지 않는다. 변환 결과 저장은 Activity 안에 두고 Workflow는 그 결과에 따라 다음 단계를 결정한다.

설정값도 주의한다. 실행 중인 Workflow가 Worker 재시작 후 바뀐 환경 설정을 읽어 전혀 다른 Activity 순서를 만들면 과거 이력과 맞지 않을 수 있다. 연결과 자원 설정, 업무 실행 시작 시 고정할 입력, 호환성 분기가 필요한 코드를 구별해야 한다.

## 등록을 하나 빼고 진단한다

대표 실패 실험은 Spring 설정에서 결과 저장 Activity 하나의 등록을 빠뜨리는 것이다. 같은 문서 입력으로 Java 기본판과 Spring판을 비교한다. 기본판이 정상적으로 경로를 수행해도 Spring판에서는 필요한 구현이 실행 대상에 없을 수 있다.

진단할 때는 먼저 어떤 Activity 타입이 요청됐는지 이력과 Worker 로그에서 찾는다. 다음으로 해당 Activity Bean이 만들어졌는지와 Worker에 등록됐는지를 구별한다. Bean이 애플리케이션 컨테이너에 존재해도 특정 Worker의 실행 대상이라는 보장은 없다.

그다음 Task Queue와 Namespace를 비교한다. 자동 설정 키의 오타나 환경별 override 때문에 Client와 Worker가 다른 위치를 볼 수도 있다. 외부 Service 연결 오류와 등록 오류를 섞지 않아야 한다. 실패를 해결하려고 모든 자동 발견 범위를 넓히면 의도하지 않은 코드까지 등록할 수 있다.

## 테스트도 두 층으로 나눈다

Workflow의 순서와 실패 처리는 Temporal 테스트 환경에서 검증한다. 예약 성공 뒤 변환 실패가 일어나면 어떤 보상이 필요한지 같은 업무 규칙은 Spring 전체를 기동하지 않고도 확인할 수 있다. 이 테스트는 빠르게 실행하고 여러 실패 순서를 비교하기 좋다.

Spring 통합 테스트에서는 실제 Bean과 Worker 설정이 맞게 연결되는지 본다. 등록 이름, 설정 우선순위, Client 주입, 테스트 환경 연결을 검증한다. 모든 테스트에 전체 Spring Context를 사용하면 오류 원인이 업무 로직인지 설정인지 구별하기 어려울 수 있다.

로컬 Service에 연결한 별도 프로세스 실행도 필요하다. 테스트 서버가 제공하는 시간 건너뛰기와 실제 외부 API의 지연은 다르다. 테스트 통과를 운영 배포와 네트워크 정상의 증거로 확대하지 않는다.

## 기본판과 무엇이 같아야 하는가

Spring 통합 후에는 같은 문서 입력에 대해 호출할 Activity 순서와 반환 의미가 유지되는지 비교한다. 이력의 모든 바이트가 같아야 한다는 뜻은 아니다. 예약·변환·저장·확정이라는 업무 계약이 설정 변경 때문에 달라지지 않았는지 본다.

실습 기록에는 의존성 버전, 활성화한 설정, Worker 등록 목록, 정상 경로와 등록 누락 경로의 결과를 남긴다. 문서에 적힌 예시 버전을 무조건 최신으로 간주하지 말고 실제 사용하는 버전과 일치시킨다. 자동 설정을 사용할수록 설정이 만들어 낸 객체와 역할을 말로 설명할 수 있어야 한다.

**확인 질문:** Activity Bean이 존재하는데 실행되지 않는다면 Bean 생성 다음에 무엇을 확인할까? Spring이 주입한 객체라도 Workflow에서 직접 DB를 조회하면 안 되는 이유는 무엇일까?

## 자동 검색의 설정 키와 테스트 서버를 분리한다

Java 1.40.0 기준 `spring.temporal.workers-auto-discovery.packages`는 deprecated다. Workflow 탐색용 `workflow-packages`와 Activity Bean 등록용 `register-activity-beans` 등 해당 버전의 속성을 구별하고 옛 속성과 새 속성을 섞지 않는다. `@WorkflowImpl`·`@ActivityImpl`의 큐 지정과 실제 Bean 생성 여부도 확인한다. [자동 검색 속성](https://github.com/temporalio/sdk-java/blob/v1.40.0/temporal-spring-boot-autoconfigure/src/main/java/io/temporal/spring/boot/autoconfigure/properties/WorkersAutoDiscoveryProperties.java).

`spring.temporal.test-server.enabled=true`는 메모리 테스트 서버를 사용한다. 이 테스트의 통과는 실제 Service의 connection·TLS·API key 설정이 맞다는 증거가 아니다. 순수 SDK판과 Spring판을 비교할 때는 한 번에 하나만 실행하거나 큐를 분리해 다른 Worker가 등록 누락을 가리지 않도록 한다. Activity 타입 이름이 충돌하면 클래스가 서로 달라도 등록에 실패할 수 있으므로 명시적인 이름·접두사와 등록 결과를 확인한다.

## 참고 자료

- [공식 Spring Boot 통합](https://docs.temporal.io/develop/java/integrations/spring-boot-integration)
- [Workflow 결정성](https://docs.temporal.io/workflow-definition)
- [Java 테스트 안내](https://docs.temporal.io/develop/java/best-practices/testing-suite)
