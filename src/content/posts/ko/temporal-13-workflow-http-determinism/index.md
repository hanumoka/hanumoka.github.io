---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "재생되는 코드에서 HTTP를 호출하면 안 되는 이유"
key: "temporal-13-workflow-http-determinism"
description: "문서를 변환하기 전에 허용량을 확인해야 한다고 해 보자."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 13
readingMinutes: 5
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

문서를 변환하기 전에 허용량을 확인해야 한다고 해 보자. Java Workflow 코드에서 HTTP 클라이언트로 허용량 API를 직접 호출하면 구현은 간단해 보인다. 그러나 이 Workflow가 재생될 때 같은 코드가 다시 호출될 수 있다. 그 사이 외부 값이 바뀌면 처음과 다른 결정을 내릴 수 있다.

Temporal의 결정성 제약은 모든 Java 계산을 금지한다는 뜻이 아니다. 같은 이력을 재생할 때 실행을 관리하는 명령이 호환되는 순서로 만들어져야 한다는 뜻이다. 외부 API의 현재 상태는 그 조건을 자동으로 만족하지 않는다.

## 처음에는 허용됐는데 재생에서는 거절될 수 있다

가상 문서 처리에서 Workflow가 허용량 API를 직접 조회하고, 잔여량이 있으면 변환 Activity를 예약했다고 가정한다. 그 뒤 Worker가 종료됐다. 다른 문서 요청이 남은 허용량을 사용한 다음 새 Worker가 같은 코드를 재생하면 HTTP 응답은 “잔여량 없음”일 수 있다.

첫 실행에서는 변환을 예약했지만 새 실행 경로는 거절 결과를 반환하려 한다. Service의 이력에는 이전 결정이 남아 있다. 현재 외부 응답으로 과거의 결정을 다시 판단하면 재생 중 만들어지는 명령과 이력이 맞지 않을 수 있다.

조회만 하는 HTTP 호출도 문제라는 점이 중요하다. 외부 데이터를 바꾸지 않았다고 결정성이 보장되는 것은 아니다. 응답이 달라질 수 있고, 네트워크 지연이나 장애로 Workflow Task 처리 자체를 막을 수도 있다. 쓰기 API라면 여기에 외부 효과의 중복 위험까지 더해진다.

## 외부 결과를 Activity의 결과로 받는다

허용량 확인 또는 예약을 Activity로 옮기면 Workflow는 Service에 기록된 Activity 결과를 사용한다. 정상 실행에서 성공 결과가 기록됐다면 replay는 그 결과를 다시 사용한다. 그 순간 외부 API를 다시 조회해 과거 판단을 바꾸는 방식이 아니다.

```java
Reservation reservation = activities.reserve(request);
ConvertedDocument converted = activities.convert(request);
activities.save(converted);
activities.confirm(reservation.getId());
```

이 코드는 호출 순서를 보여주는 개념 코드다. 실제 실행에는 각 인터페이스와 DTO, 시간 제한, 실패 처리, 보상 정책을 추가해야 한다. Activity로 옮겼다는 사실만으로 예약이 중복되지 않거나 모든 단계가 원자적으로 성공하는 것도 아니다. 이 코드는 재생과 외부 호출의 경계를 정할 뿐이다.

예약 API는 단순 잔여량 조회보다 업무 의도를 잘 나타낼 수 있다. 확인과 사용 사이에 다른 요청이 개입하는 문제를 해당 서비스가 관리하도록 하기 때문이다. 하지만 예약의 원자성·만료·중복 처리 역시 허용량 서비스의 계약이다. Workflow의 결정성과 외부 서비스의 동시성 제어를 같은 기능으로 설명하지 않는다.

## 시간과 무작위 값도 같은 질문으로 본다

현재 시각을 직접 읽어 분기하거나 일반 난수로 Activity 선택을 바꾸면 재생에서 다른 경로를 만들 수 있다. Workflow 코드에서는 해당 SDK가 제공하는 시간·대기·무작위 관련 API를 사용하고, 사용하는 API가 이력 재생과 어떻게 호환되는지 확인한다.

일반적인 Java 컬렉션 처리나 입력 검증처럼 입력과 이력에 의해 결과가 정해지는 계산은 Workflow에 둘 수 있다. 반대로 “이 코드는 간단하니까 괜찮다”는 판단 기준은 적절하지 않다. 한 줄짜리 외부 시각 조회도 분기 결과를 바꿀 수 있다.

외부 설정을 읽는 것도 주의해야 한다. Worker 재시작 때 설정값을 바꾸고 그 값으로 이미 실행 중인 Workflow의 Activity 순서를 바꾸면 과거 실행과 다른 명령을 만들 수 있다. 운영 설정이 필요한 값과 실행 시작 시 고정해야 할 값을 분리해 설계한다.

## 실패를 확인하려면 분기를 실제로 달라지게 한다

작은 실험에서는 가짜 허용량 API가 첫 호출에 허용, 다음 호출에 거절을 반환하도록 한다. 직접 HTTP를 호출한 Workflow의 이력과 재생 결과를 관찰한 뒤 같은 호출을 Activity로 옮긴 구성을 비교한다. 목적은 모든 직접 HTTP 호출이 즉시 동일한 오류를 낸다는 사실을 증명하는 것이 아니다. 재생 시 외부 응답 변화가 과거 실행을 바꿀 수 있음을 확인하는 것이다.

검증 자료에는 API 호출 목록, Workflow 이력, Worker 로그, 사용한 코드 ref를 남긴다. 로그가 늘었다는 사실만으로 비결정성 오류를 단정하지 말고 어떤 명령이 어느 이력과 맞지 않았는지 살펴본다. 기대한 실패가 나타나지 않으면 Worker 캐시 때문에 전체 재생이 일어나지 않았는지도 확인한다.

수정 후에도 외부 API 장애를 넣어 본다. Activity 안의 호출이 실패하는 것과 Workflow 재생이 호환되지 않는 것은 별개의 문제다. 전자는 시간 제한·재시도·업무 실패 처리로 다루고, 후자는 Workflow 코드 변경과 이력의 관계를 검토한다.

**확인 질문:** 읽기 전용 HTTP 호출도 Workflow에 직접 넣으면 위험한 이유는 무엇일까? Activity로 옮긴 뒤에도 애플리케이션이 해결해야 하는 예약 중복 문제는 무엇일까?

## 참고 자료

- [Workflow 결정성 제약](https://docs.temporal.io/workflow-definition)
- [Java Workflow 버전 관리](https://docs.temporal.io/develop/java/workflows/versioning)
- [Java 재생 테스트](https://docs.temporal.io/develop/java/best-practices/testing-suite)
