---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Workflow와 Activity Worker를 분리한다"
key: "temporal-20-separate-workflow-activity-workers"
description: "처음 만든 Java 예제에서는 하나의 Worker 프로세스가 Workflow와 Activity를 모두 실행했다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 20
readingMinutes: 5
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

처음 만든 Java 예제에서는 하나의 Worker 프로세스가 Workflow와 Activity를 모두 실행했다. 그런데 문서 변환이 CPU와 메모리를 많이 사용하고, 전체 순서를 결정하는 코드는 상대적으로 가볍다면 두 역할의 배포와 확장 요구가 달라질 수 있다. 이때 Workflow Worker와 Activity Worker를 분리하는 구성을 검토할 수 있다.

분리는 Temporal을 쓰기 위한 필수 조건이 아니다. 어떤 작업을 독립적으로 배포하고 확장해야 하는지에 대한 애플리케이션 설계다. 프로세스를 나누면 장애 영향과 자원 사용을 구별하기 쉬워지는 대신 큐 설정·등록·계약·배포를 더 관리해야 한다.

## 구현체 대신 호출 계약을 공유한다

Workflow가 Activity를 호출할 때 필요한 것은 구현 클래스가 아니라 인터페이스와 전달할 데이터의 의미다. 문서 변환 Activity의 실제 구현은 별도 Worker에만 있어도 된다. Workflow 코드는 Activity stub을 통해 작업을 요청한다.

두 프로세스는 Activity 타입 이름, 입력과 출력의 직렬화 형식, 실패 의미를 맞춰야 한다. Java 인터페이스를 같은 라이브러리로 공유하면 편리할 수 있지만 그것만으로 모든 호환성이 자동 보장되는 것은 아니다. DTO 필드 변경이나 의미 변경도 기존 실행에 영향을 줄 수 있다.

예를 들어 `documentId`가 원본 문서 식별자였는데 새 Worker에서 최신 수정본을 가리키는 값으로 해석하면 타입은 같아도 업무 계약은 달라진다. 배포 단위를 분리할수록 호출 계약의 의미를 문서와 테스트로 분명히 해야 한다.

## Activity 목적지를 명시한다

Workflow를 받는 Task Queue와 변환 Activity를 받는 Task Queue를 다르게 설정할 수 있다. Workflow Worker는 순서를 결정하는 코드를 등록하고, 변환 Worker는 변환 Activity를 등록한다. Activity 옵션에서 목적지를 지정하면 Service를 통해 해당 작업을 기다리는 Worker와 연결된다.

이 구조에서 Workflow Worker가 변환 Worker의 HTTP 주소를 직접 알아야 하는 것은 아니다. 두 Worker가 Service와 통신하며 작업을 가져간다. 그러나 변환 Activity가 외부 변환 API나 저장소를 호출한다면 그 네트워크 연결은 별도로 필요하다.

Task Queue를 나눈다고 인증·인가와 네트워크 격리까지 생기지는 않는다. 큐는 작업 배정과 구성을 위한 구분이며, 보안 경계는 자격증명과 권한, 네트워크 정책을 따로 검토해야 한다. “전용 큐”라는 이름만으로 다른 주체의 접근이 차단됐다고 쓰면 안 된다.

## 한쪽 Worker만 중단해 본다

대표 실패 실험은 변환 Activity Worker만 끄는 것이다. Workflow Worker와 Service는 유지한 채 문서 처리를 시작한다. 예상은 Workflow가 변환을 요청할 수 있지만 해당 작업은 처리할 Worker를 기다린다는 것이다. 변환 Worker를 다시 켰을 때 어떤 시도와 이력으로 진행하는지 확인한다.

다음으로 큐 이름을 의도적으로 다르게 설정한다. 코드와 네트워크가 정상이어도 Worker가 다른 큐를 보고 있다면 작업을 받지 못한다. 이 경우 로그에 예외가 거의 없을 수 있다. Worker가 정상적으로 실행 중이라는 사실과 올바른 작업을 받고 있다는 사실은 다르다.

진단은 Namespace, Activity 목적 큐, Worker의 polling 큐, 등록된 Activity 타입 순서로 한다. Client에서 요청한 Workflow 큐만 확인하고 Activity 큐를 놓치지 않는다. 작업이 여러 단계라면 단계별 목적지를 표로 두면 어떤 Worker가 필요한지 설명하기 쉽다.

## 같은 큐에 Worker를 더 붙이면

동일한 Activity 구현을 가진 Worker를 같은 큐에 추가하면 여러 프로세스가 작업을 처리할 수 있다. 그러나 하나의 Activity 실행을 여러 Worker가 나누어 계산해 준다는 뜻은 아니다. 작업을 얼마나 잘게 나눌지와 각 작업의 외부 효과는 애플리케이션 설계에 남는다.

Worker마다 동시 실행 수를 제한했다고 전체 외부 API 호출 수가 같은 상한으로 제한되는 것도 아니다. 프로세스가 늘면 합계가 달라질 수 있다. 허용량 서비스가 감당할 수 있는 전역 상한을 지켜야 한다면 여러 Worker 전체의 요청을 어떻게 조정할지 별도로 생각해야 한다.

확장 실험에서는 Worker 수만 바꾸고 같은 가상 부하를 넣는다. 처리량뿐 아니라 외부 API 오류, 큐 대기 시간, Activity 시도 수를 함께 본다. “두 개로 늘렸으니 두 배 빨라졌다”는 결과를 미리 가정하지 않는다. 실제 병목이 DB나 외부 변환 API에 있으면 결과가 다를 수 있다.

분리 실습이 끝나면 프로세스별 등록 타입, 큐, 필요한 외부 연결을 정리한다. 두 Worker의 배포 버전이 잠시 다를 때도 동작하는지 확인하는 것은 다음 계약·버전 관리 과제로 남긴다. 정상 실행 하나는 분리 가능성을 확인할 뿐 안전한 무중단 배포의 증거는 아니다.

**확인 질문:** Worker 프로세스가 정상인데 Activity가 시작되지 않으면 어떤 설정을 비교할까? Worker별 동시성 제한이 외부 서비스 전체의 상한과 다른 이유는 무엇일까?

## 참고 자료

- [Java SDK 개발 안내](https://docs.temporal.io/develop/java)
- [Activity 등록과 실행](https://docs.temporal.io/activity-definition)
- [Worker 성능과 작업 처리](https://docs.temporal.io/develop/worker-performance)
