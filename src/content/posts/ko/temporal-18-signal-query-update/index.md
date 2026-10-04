---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Signal·Query·Update 중 무엇을 선택할까"
key: "temporal-18-signal-query-update"
description: "문서 변환 전에 사용자의 승인을 기다리는 Workflow를 만든다고 하자."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 18
readingMinutes: 5
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

문서 변환 전에 사용자의 승인을 기다리는 Workflow를 만든다고 하자. 화면은 현재 상태를 보여줘야 하고, 사용자는 승인하거나 처리 옵션을 바꿀 수 있어야 한다. 모든 요청을 “Workflow에 메시지를 보낸다”로 뭉뚱그리면 응답의 의미가 흐려진다.

Temporal은 Query, Signal, Update를 제공한다. 무엇을 고를지는 메서드 이름보다 호출자가 어떤 보장을 기다리는지에 달려 있다. 상태를 읽기만 하는가, 전달 수락만 알면 되는가, 처리 결과나 거절 이유까지 받아야 하는가를 먼저 묻는다.

## Query는 관찰을 위한 요청이다

Query는 Workflow의 현재 상태를 읽는다. 예제에서는 `WAITING_APPROVAL`, `CONVERTING`, `COMPLETED` 같은 업무 상태나 승인한 옵션을 반환할 수 있다. Query 핸들러는 상태를 바꾸면 안 되고, Activity 실행 같은 blocking 작업도 수행하면 안 된다.

따라서 “조회할 때 승인 기한이 지났으면 취소 처리한다”는 기능을 Query에 넣지 않는다. 조회 횟수나 UI 새로고침이 업무 진행을 바꾸게 되기 때문이다. 기한 처리는 Workflow의 Timer와 본문 로직이 맡고, Query는 그 결과를 읽는다.

Query는 외부 DB의 모든 상태를 자동으로 동기화한 결과도 아니다. Workflow가 알고 있는 상태와 외부 저장소 상태가 어떤 시점에 일치하는지 정의해야 한다. 결과 DB의 상세 문서를 읽어야 한다면 별도 조회 API가 더 자연스러울 수 있다.

## Signal 응답은 처리 완료 확인이 아니다

Signal은 실행 중인 Workflow에 비동기적으로 상태 변경을 전달한다. 사용자의 승인 의사를 전하는 용도로 사용할 수 있다. Java 인터페이스에서는 `@SignalMethod`로 정의하며 반환값을 주는 방식으로 처리 결과를 돌려주지 않는다.

Service가 Signal을 수락한 것과 Worker가 승인 로직을 끝낸 것은 다르다. Worker가 잠시 꺼져 있으면 메시지가 수락됐더라도 업무 진행이 기다릴 수 있다. API가 Signal 전송 후 “문서 처리가 완료됐다”고 응답하면 잘못된 의미를 사용자에게 전달한다.

수락만 확인하면 충분한 API라면 요청 접수 상태와 추적할 Workflow ID를 응답할 수 있다. 이후 Query나 별도 상태 조회로 진행을 확인한다. 이것은 API 설계의 선택이며 Signal 자체가 모든 UX를 정해 주는 것은 아니다.

## Update는 검증과 결과가 필요할 때 검토한다

Update는 Workflow 상태를 바꿀 수 있고 처리 결과를 돌려줄 수 있다. 예를 들어 변환 옵션을 바꾸려는데 이미 변환이 시작됐으면 거절해야 하는 요청에 어울릴 수 있다. 선택적으로 validator를 두어 수락 전에 요청을 거절할 수도 있다.

validator는 상태를 바꾸지 않아야 한다. 검증 중 외부 API를 호출해 오래 기다리는 기능을 넣는 것도 적절하지 않다. 외부 작업이 필요한 검증은 핸들러의 처리 과정에서 어떻게 실패를 보고할지 별도로 설계한다. 수락 전 거절과 수락 뒤 처리 실패는 같은 사건이 아니다.

| 호출자가 원하는 것              | 후보   | 응답에서 주의할 점                  |
| ------------------------------- | ------ | ----------------------------------- |
| 현재 승인 상태 읽기             | Query  | 읽기 요청이 업무 상태를 바꾸지 않음 |
| 승인 의사 전달                  | Signal | 수락이 승인 처리 완료는 아님        |
| 옵션 변경의 결과·거절 이유 받기 | Update | 수락과 완료 중 무엇을 기다릴지 구분 |

Update를 사용한다고 일반 HTTP 호출처럼 무조건 짧게 끝나는 것은 아니다. 핸들러가 Activity를 기다릴 수도 있다. Client의 대기 방식, 요청 timeout, 재호출 시 중복 판단을 함께 결정해야 한다.

## Worker를 끄고 승인 요청을 보내 본다

작은 실패 실험에서는 승인 대기 상태의 Workflow를 만든 뒤 Worker를 끈다. Signal 요청의 응답과 실제 업무 상태 변화 시점을 기록하고 Worker를 다시 시작한 결과를 확인한다. 이어 Update를 사용했을 때 호출자가 어느 단계에서 기다리는지 비교한다.

이 실험은 모든 요청의 API 응답 시간을 성능 비교하려는 것이 아니다. “전달됨”, “수락됨”, “처리됨”이라는 서로 다른 상태를 구별하려는 것이다. 네트워크 장애로 Client가 응답을 못 받았을 때 어떤 식별자로 기존 요청의 결과를 확인할지도 생각한다.

중복 승인도 넣어 본다. 사용자가 버튼을 두 번 누르거나 요청을 재전송했을 때 예약을 두 번 확정하면 안 된다. 메시지의 업무 ID와 Workflow 상태에 따라 이미 처리한 요청을 구분한다. Activity 멱등성이 있어도 사용자에게 어떤 응답을 줄지에 대한 메시지 계약은 남는다.

핸들러 구현을 늘리기 전에 승인 상태의 전이를 적어 보자. 대기 중 승인, 승인 후 재승인, 취소 후 승인, 기한 만료 직전 승인은 각각 어떤 결과가 맞는가? 이 답이 정해져야 세 API 중 하나를 선택한 이유도 분명해진다.

**확인 질문:** Signal 전송이 성공했는데 화면 상태가 바뀌지 않았다면 어떤 단계가 남아 있을까? 옵션 변경을 수락 전에 거절하는 것과 수락 뒤 실패로 돌려주는 것은 왜 다를까?

## 참고 자료

- [Java 메시지 전달](https://docs.temporal.io/develop/java/workflows/message-passing)
- [Java Workflow 취소와 실행 제어](https://docs.temporal.io/develop/java/workflows/cancellation)
- [Java 테스트 환경](https://docs.temporal.io/develop/java/best-practices/testing-suite)
