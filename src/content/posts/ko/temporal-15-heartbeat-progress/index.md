---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Heartbeat가 와도 작업이 멈춰 있을 수 있다"
key: "temporal-15-heartbeat-progress"
description: "Heartbeat의 생존·진행 보고와 취소 전달을 구별하고 정체를 감지할 조건을 정한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 15
readingMinutes: 7
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

오래 걸리는 문서 변환 Activity가 주기적으로 Heartbeat를 보낸다고 하자. Worker가 Service와 통신하고 있다는 사실은 알 수 있다. 그러나 실제 문서 변환이 진전되고 있다는 사실까지 자동으로 증명하지는 않는다. 변환 호출은 멈춰 있는데 별도 반복 코드가 계속 Heartbeat를 보낼 수도 있기 때문이다.

Heartbeat는 장기 Activity의 상태를 알리고 진행 정보를 남기는 도구다. 어떤 진행을 관찰해 어떤 값을 보낼지는 Activity 구현이 결정한다. “Heartbeat가 정상이다”를 “업무가 정상 진행 중이다”로 곧바로 바꾸어 읽지 않는 것이 이번 글의 핵심이다.

## 살아 있음과 진전됨은 다르다

문서를 열 조각으로 나누어 가상 변환하는 Activity를 생각해 보자. 한 조각의 처리가 끝날 때 다음 처리 위치를 Heartbeat details로 보내면, 다음 시도에서 마지막 수신 위치를 읽을 수 있다. 그 위치를 사용해 이어서 처리하는 코드는 애플리케이션이 작성해야 한다.

반면 변환 진행과 무관한 타이머가 일정 간격으로 “alive”만 보낸다면 의미가 다르다. Worker 프로세스가 응답할 수 있다는 사실은 나타내지만 특정 문서의 변환이 끝나가고 있는지는 알 수 없다. 이 방식이 항상 잘못인 것은 아니지만, 무엇을 감시하는지 명확해야 한다.

details에 진행률을 넣더라도 외부 저장과 Heartbeat 전송이 하나의 트랜잭션은 아니다. 세 번째 조각 저장은 성공했지만 다음 위치 보고가 실패했다면 재시도에서 세 번째 조각을 다시 다룰 수 있다. 진행 위치를 복구하는 기능과 중복 효과를 막는 기능은 함께 설계해야 한다.

## 발신 호출과 서버 수신을 구별한다

Java Activity에서는 `Activity.getExecutionContext().heartbeat(details)`로 진행 정보를 보낼 수 있다. 그러나 SDK는 발신을 조절할 수 있다. 코드에서 메서드를 호출한 시각마다 Service에 새 정보가 즉시 기록된다고 가정하면 안 된다.

```java
// 핵심 동작만 나타낸 개념 코드
for (int part = resumeAt; part < totalParts; part++) {
    convertAndStorePart(documentId, part);
    Activity.getExecutionContext().heartbeat(part + 1);
}
```

실행하려면 진행 위치의 의미, details 직렬화 타입, 이전 위치를 읽는 코드, 조각 저장의 멱등성을 정해야 한다. `part + 1`이 “다음 처리할 조각”인지 “마지막 완료 조각”인지도 계약이다. 두 의미를 혼용하면 재시도에서 한 조각을 건너뛰거나 중복 처리한다.

Heartbeat Timeout은 Service가 마지막 Heartbeat를 받은 뒤 기다리는 시간을 제한한다. 제한 안에 새 Heartbeat를 받지 못하면 실패로 판단하고 정책에 따라 재시도할 수 있다. 실제 발견 시간은 설정값뿐 아니라 마지막 수신 시점과 SDK 발신 동작에도 영향을 받는다.

## 진행을 멈추고 Heartbeat만 계속 보내 본다

대표 실패 실험에서는 가짜 변환을 일정 지점에서 멈추고 Heartbeat는 계속 보내게 한다. 예상은 Heartbeat Timeout만으로 이 상태를 곧바로 변환 정지라고 판단하지 못할 수 있다는 것이다. Activity의 전체 실행 시간 제한을 함께 둔 결과와 비교한다.

이 실험은 Heartbeat를 없애자는 뜻이 아니다. 프로세스 장애 감지, 처리 진전 확인, 전체 업무 기한이 서로 다른 질문임을 확인하는 것이다. 진행률이 오랫동안 변하지 않을 때의 별도 정책을 둘 수도 있고, 외부 API 자체의 timeout을 둘 수도 있다. 단순 반복 발신만으로 모든 정체를 감지할 수 있다고 약속하지 않는다.

두 번째 비교로 Heartbeat를 완전히 멈춰 본다. Worker를 종료했을 때와, 프로세스는 살아 있지만 보고하지 않을 때 Service가 관찰하는 정보가 어떻게 비슷하거나 다른지 살펴본다. 시도별 시작 시각과 마지막 수신 정보, timeout 원인을 함께 기록한다.

## 취소 전달도 Heartbeat에 연결된다

원격 Activity는 Heartbeat를 통해 취소 요청을 전달받는다. Workflow 취소를 요청했다고 실행 중인 외부 변환이 즉시 중단되는 것은 아니다. Activity가 취소를 감지하고 외부 작업을 중단하거나 정리할 수 있어야 한다.

SDK 발신 조절은 취소 감지 시점에도 영향을 줄 수 있다. 따라서 “2초마다 heartbeat 함수를 호출하니 취소도 항상 2초 이내에 끝난다”는 식의 보장을 쓰지 않는다. 실제 SDK 설정과 외부 호출이 취소를 받아들일 수 있는 지점을 함께 확인해야 한다.

실습에서는 취소 요청 후 Activity가 감지한 시각, 외부 mock이 중단된 시각, 예약 해제가 끝난 시각을 분리해 남긴다. 이 세 시각이 다른 이유를 설명할 수 있어야 취소를 단일 API 호출로만 이해하지 않게 된다.

Heartbeat를 사용할 때는 먼저 보낼 상태의 의미를 정하고, 다음 시도에서 읽었을 때 안전하게 다시 실행할 범위를 정한다. 마지막으로 Worker 종료와 진행 정지, 취소를 각각 시험한다. 하나의 “정상” 표시로 세 상황을 모두 대신하지 않는다.

**확인 질문:** 진행률이 바뀌지 않는 Heartbeat가 계속 오면 어떤 제한이나 관측이 더 필요할까? 마지막 Heartbeat details가 실제 저장보다 뒤처져도 안전하려면 무엇이 필요할까?

## 설정 변경과 발신 코드의 순서도 시험한다

Heartbeat Timeout은 첫 보고 전에는 시도 시작 시각부터 잰다. 첫 조각 처리 시간이 제한보다 길면 정상 작업도 실패할 수 있다. 진행마다 보고할지 별도 주기로 생존을 보고할지 정하고, 계속 살아 있지만 진척이 없는 상태는 별도 진행 시각이나 Start-to-Close로 제한한다.

Heartbeat Timeout을 먼저 켜고 아직 보고하지 않는 구버전 Worker가 작업을 받으면 반복 timeout이 생길 수 있다. 가상 배포에서는 발신 코드 배포·등록 확인 뒤 제한을 적용하는 순서와 반대 순서를 비교한다. Heartbeat로 취소를 받은 Activity는 정리 뒤 관련 취소 예외를 전파해야 한다. Java 1.40.0의 실험적 cancellation token은 별도 지원 조건이 있으므로 본문 heartbeat 실습과 구분한다.

## 다시 시작할 위치와 실제 전송 주기를 확인한다

Activity 시작 때 `context.getHeartbeatDetails(Integer.class).orElse(0)`으로 이전 시도가 보고한 처리 위치를 읽을 수 있다. 현재 메서드의 지역 변수는 복구되지 않는다. 업무 효과와 진행 위치 기록 사이 중단도 가능하므로 조각별 멱등 처리가 필요하다.

Java SDK 1.40.0은 heartbeat 전송을 조절한다. 기본 상한 60초와 timeout의 80% 중 작은 값을 사용하며 heartbeat timeout이 없을 때의 기본 throttle은 30초다. `heartbeat()` 호출 횟수와 Service 수신 횟수를 같게 세지 않는다. context는 Activity 실행 스레드에서 얻고, 별도 타이머를 쓴다면 취소 통지와 실제 진행 details를 작업 스레드에 연결해야 한다. 취소 관련 `ActivityCompletionException`을 catch해 자원을 정리했다면 다시 던져 SDK에 알린다.

취소 후 정리 순서까지 보려면 기본 `TRY_CANCEL`과 `WAIT_CANCELLATION_COMPLETED`를 구별한다. 후자도 Activity의 협력 취소와 기한이 필요하다. 이 글은 Local Activity가 아닌 일반 Activity의 heartbeat 경로를 다룬다. [SDK 1.40 WorkerOptions](https://github.com/temporalio/sdk-java/blob/v1.40.0/temporal-sdk/src/main/java/io/temporal/worker/WorkerOptions.java), [ActivityExecutionContext](https://github.com/temporalio/sdk-java/blob/v1.40.0/temporal-sdk/src/main/java/io/temporal/activity/ActivityExecutionContext.java).

## 참고 자료

- [Java Activity Heartbeat와 시간 제한](https://docs.temporal.io/develop/java/activities/timeouts)
- [Java Activity 취소](https://docs.temporal.io/develop/java/workflows/cancellation)
- [Activity 멱등성](https://docs.temporal.io/activity-definition)
