---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Activity의 어느 시간을 제한할까"
key: "temporal-14-activity-timeout-boundaries"
description: "Activity 배정 대기·한 시도·전체 시도의 시간 제한을 나누고 시간 초과 뒤 외부 효과를 확인한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 14
readingMinutes: 7
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

문서 변환이 오래 걸릴 때 “타임아웃을 1분으로 설정한다”는 말만으로는 충분하지 않다. Worker를 기다리는 시간을 제한할 것인지, 한 번의 변환 시도를 제한할 것인지, 재시도까지 합친 전체 시간을 제한할 것인지 정해야 한다. 같은 1분이라도 적용 지점에 따라 실패 원인과 이후 동작이 달라진다.

Temporal의 Activity 시간 제한을 이해하는 가장 좋은 출발점은 한 Activity 실행과 그 안의 여러 시도를 구별하는 것이다. 변환 요청 하나가 첫 시도에서 실패하고 두 번째 시도에서 성공하더라도 업무 관점에서는 같은 Activity 실행일 수 있다.

## 세 가지 시간이 서로 다른 구간을 잰다

Start-to-Close는 Worker가 시작한 한 시도의 최대 실행 시간이다. 변환 API 호출이 멈췄거나 Worker가 완료를 보고하지 못할 때, Service가 해당 시도를 계속 기다리지 않게 한다. 이름의 Start는 Activity 시도의 시작이지 Workflow 시작이 아니다.

Schedule-to-Close는 Activity가 예약된 뒤 최종적으로 끝날 때까지의 전체 시간을 제한한다. Worker를 기다리는 시간, 실행 시간, 재시도 사이 대기 등이 모두 영향을 준다. 외부 의존성이 회복될 때까지 재시도하더라도 전체 업무가 무한정 기다리면 안 되는 경우에 필요하다.

Schedule-to-Start는 Activity Task가 예약되고 Worker가 시작하기까지의 대기 시간이다. 실행 코드가 느린 문제보다 큐 적체, Worker 부족, 잘못된 큐 설정을 생각해야 하는 구간이다. 이 제한은 설계상 재시도 불가능한 시간 초과라는 점도 다른 제한과 구별해야 한다.

| 제한              | 질문                                    | 문서 처리 예                        |
| ----------------- | --------------------------------------- | ----------------------------------- |
| Start-to-Close    | 이번 시도가 얼마나 오래 실행돼도 되는가 | 변환 API 한 번의 호출               |
| Schedule-to-Close | 여러 시도를 합쳐 얼마나 기다릴 것인가   | 일시 장애 후 재시도까지 포함한 변환 |
| Schedule-to-Start | Worker 배정을 얼마나 기다릴 것인가      | 변환 Worker가 없는 큐의 대기        |

Activity에는 Start-to-Close나 Schedule-to-Close 중 적어도 하나가 필요하다. 두 제한을 함께 사용하는 경우에는 각각 어떤 요구사항을 표현하는지 설명할 수 있어야 한다. 값을 복사하는 것보다 시간 구간을 정확히 정의하는 것이 먼저다.

## 재시도가 있으면 총시간이 달라진다

예를 들어 한 시도에 10초를 허용해도 전체가 10초 안에 끝난다는 뜻은 아니다. 재시도 정책이 허용하면 실패 뒤 다시 실행할 수 있고, 시도 사이 대기 시간도 생긴다. Activity에는 기본 Retry Policy가 있으므로 별도 설정이 없다는 이유로 한 번만 실행된다고 가정하지 않는다.

이 기본값을 Workflow 전체에 확대하면 안 된다. Workflow Execution은 기본적으로 재시도하지 않으며, Workflow Task의 재처리도 업무 실행 전체를 다시 시작하는 것과 다르다. 여기서 제한하는 대상은 Activity와 그 시도들이다.

학습 환경에서는 한 시도 5초, 전체 20초처럼 관찰하기 쉬운 짧은 값을 쓸 수 있다. 이 숫자는 실험용이다. 운영에서는 실제 처리 시간 분포, 외부 API의 제한, 업무가 기다릴 수 있는 시간, 장애 시 회복 방식을 함께 고려해야 한다.

잘못된 입력과 일시적인 네트워크 장애도 구별한다. 이 글에서는 시간 구간에 집중하지만, 모든 오류를 오래 재시도하도록 만들면 입력 오류가 처리 지연처럼 보일 수 있다. 반대로 너무 짧은 제한은 정상적으로 진행 중인 작업에 불필요한 재시도를 일으킬 수 있다.

## 시간 초과가 외부 작업을 되돌리지는 않는다

가장 중요한 실패 사례는 변환 API가 12초에 성공하는데 Start-to-Close를 10초로 둔 경우다. Temporal은 시도의 시간 초과를 판단할 수 있지만 외부 API 프로세스를 자동으로 강제 종료하지는 않는다. 첫 호출이 계속 실행되는 동안 다음 시도가 시작될 가능성도 검토해야 한다.

따라서 “타임아웃됐으니 변환 결과가 없다”거나 “DB 저장도 실패했을 것이다”라고 추론하면 안 된다. 외부 요청 자체의 timeout과 취소 지원, 중복 요청 처리, 결과 조회 계약을 함께 확인해야 한다. Temporal의 시간 제한은 외부 DB rollback 명령이 아니다.

실험에서는 외부 mock이 요청 시각과 완료 시각을 기록하게 하고, Temporal 측 시도 번호와 timeout 시각을 대조한다. 동일 문서의 결과가 두 개 생길 수 있는지 확인하되 실제 결제나 비용이 드는 작업은 사용할 필요가 없다. 가상 변환과 실습용 DB면 충분하다.

## 한 번에 하나의 구간만 늦춘다

시간 제어 실험은 세 번으로 나눈다. 먼저 Worker를 정상 가동하고 Activity 내부만 지연시킨다. 다음에는 실행은 짧게 두고 실패와 재시도 간격으로 전체 시간을 늘린다. 마지막에는 Worker를 끄거나 다른 큐를 보게 해 배정 대기를 만든다.

각 실험에서 예약, 시작, 실패, 다음 시도, 최종 종료 시각을 기록한다. 시간이 예상과 다르면 먼저 어떤 제한이 발동했는지 확인하고, 이후 값을 조정한다. 결과가 늦다고 모든 timeout을 늘리면 큐 설정 오류와 외부 API 지연을 구별하기 어려워진다.

**확인 질문:** 한 시도 제한이 10초인데 실행이 30초 넘게 보이는 것은 언제 가능한가? 시간 초과 이벤트만으로 외부 변환이 실행되지 않았다고 말할 수 있을까?

## 시간 제한과 재시도 종료 조건을 함께 적는다

Java ActivityOptions는 Start-to-Close 또는 Schedule-to-Close 중 적어도 하나가 필요하다. Schedule-to-Start 초과는 실행 Worker를 기다리다 실패한 것이므로 일반 Activity 재시도로 같은 큐에서 해결할 조건이 아니다. Start-to-Close는 한 시도, Schedule-to-Close는 대기·재시도를 포함한 전체 예산이다.

timeout은 Worker의 Activity 스레드를 강제로 interrupt하거나 외부 요청을 취소하는 기능이 아니다. 이전 시도가 계속 실행되는 동안 다음 시도가 시작할 수 있다. [실패 분류](/posts/temporal-failure-classification/)에서 유한한 실험 재시도와 비재시도 오류를 설정하고, [16편](/posts/temporal-16-idempotent-result-storage/)에서 늦은 commit의 중복 효과를 확인한다.

## 시도 수와 관측 위치를 함께 고정한다

Activity Execution은 하나의 논리적 호출이며 그 안에 여러 Activity Task Execution, 즉 실행 시도가 생길 수 있다. 기본 재시도는 초기 1초·2배 증가·최대 간격 100초·시도 수 무제한이다. 실패 분류와 제한된 실습 설정은 [실패 분류 초안](/posts/temporal-failure-classification/)을 따른다.

배정 대기 시험에서는 Workflow Worker를 유지하고 Activity Worker만 중단한다. Pending Activities와 시도별 로그, `TimeoutFailure`의 timeout 종류를 비교한다. Schedule-To-Start 제한은 같은 큐 재시도로 해결되지 않는 배정 지연을 시험하기 위한 설정이며 일반 운영의 기본 처방은 아니다. 다음 편은 네 번째 제한인 Heartbeat Timeout을 다룬다.

## 참고 자료

- [Java Activity 시간 제한](https://docs.temporal.io/develop/java/activities/timeouts)
- [Temporal Retry Policy](https://docs.temporal.io/encyclopedia/retry-policies)
- [Workflow 시간 제한과 기본 재시도](https://docs.temporal.io/develop/java/workflows/timeouts)
- [Activity 실행과 멱등성](https://docs.temporal.io/activity-definition)
