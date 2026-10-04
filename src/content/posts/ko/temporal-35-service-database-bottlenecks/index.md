---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "병목이 Service나 DB라면 무엇이 달라질까"
key: "temporal-35-service-database-bottlenecks"
description: "Worker 여유와 별개로 발생하는 Service·persistence·Visibility 병목을 나누어 본다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 35
readingMinutes: 7
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

Worker를 늘렸는데 문서 처리 대기가 거의 줄지 않았다면 실행 코드 밖도 살펴봐야 한다. Temporal Service는 실행 상태를 기록하고 작업을 전달하며, DB는 그 상태를 보존한다. 이 경로가 느리면 Java Worker에 여유가 있어도 전체 진행이 늦어질 수 있다. 이번 초안은 Worker 지연과 Service·DB 지연을 구분하는 관측 실험을 다룬다.

예제는 허용량 예약, 가상 변환, 결과 저장, 예약 확정이다. 결과를 저장하는 애플리케이션 DB와 Temporal의 persistence DB는 역할이 다르다. 이하 DB 지연 실험은 Temporal용 시험 저장소를 대상으로 한 제안이며, 실제 환경에서 장애나 성능 개선을 확인한 보고는 아니다.

## 같은 느림에도 기다리는 위치가 다르다

Worker가 가상 변환에 오래 걸리면 Activity 실행 시간이 늘어날 수 있다. 반면 Service가 상태를 기록하는 데 오래 걸리면 Task 생성, 결과 반영, 다음 단계 전달이 지연될 수 있다. 두 경우 모두 사용자에게는 “결과가 늦게 나온다”로 보인다.

따라서 전체 처리 시간과 함께 Service API 지연, 오류, persistence 읽기·쓰기 지연, History 내부 작업 지연, Matching 전달 지연을 나누어 본다. Task가 생성되기 전의 지연과 이미 생성된 Task가 Worker를 기다리는 시간을 혼동하지 않기 위해서다.

지표의 operation label도 도움이 된다. 어떤 API나 내부 작업이 느려졌는지 구분하면 모든 Service를 같은 비율로 확장하는 대신 후보를 좁힐 수 있다. 다만 지표 하나가 곧 원인을 증명하지는 않는다. 동일 시점의 자원 사용과 DB 관측을 함께 대조해야 한다.

## 구성요소마다 맡는 일이 다르다

Frontend는 API 진입점이고 History는 실행 상태와 내부 작업을 관리하며 Matching은 Task Queue 전달을 맡는다. 각 구성요소는 별도로 배치하고 확장할 수 있다. 하지만 한 구성요소를 늘리면 DB 연결이나 다른 구성요소에 보내는 요청도 달라질 수 있으므로 결과를 측정해야 한다.

History 프로세스 수와 History Shard 수는 다르다. 프로세스를 늘리는 것은 정해진 Shard를 나눠 맡을 실행 자원을 늘리는 일이다. 기존 DB와 운영 중인 Service의 Shard 수를 replica처럼 임의로 바꾸는 것이 아니다. 공식 문서의 수치 예제를 그대로 권장값으로 옮기지 않는 이유도 여기 있다.

Matching을 늘린다고 외부 저장소가 빨라지는 것도 아니다. 이미 Worker가 작업을 받아 처리 중이라면 전달 단계의 확장은 관련이 작을 수 있다. 반대로 Task Queue 전달에 문제가 있는데 Activity 실행 코드만 최적화해도 전체 대기는 그대로일 수 있다.

## DB 지연을 하나만 넣는다

실험 전 정상 상태에서 동일한 생성 문서 묶음을 처리한다. Worker 수, slot, CPU 작업량, 예약 API와 결과 저장 API의 지연은 고정한다. 이후 격리된 시험 환경에서 Temporal persistence 연결에 지연 조건 하나만 추가한다. 지연을 주입하는 도구와 범위, 지속 시간도 결과에 포함한다.

1. 정상 구간의 완료 건수와 전체 지연을 기록한다.
2. Service와 DB의 기준 지표를 같은 시간축으로 저장한다.
3. persistence 연결에 제한된 지연을 적용한다.
4. Worker 사용률과 Service의 persistence·History 지표 변화를 관찰한다.
5. 지연을 제거하고 밀린 작업과 오류가 어떻게 줄어드는지 확인한다.
6. 최종 예약과 결과가 업무 조건에 맞는지 대조한다.

예상 관찰은 DB 지연이 Service의 처리 지연으로 이어질 수 있다는 것이다. 어떤 지표가 먼저 반응하고 어느 정도 영향을 받는지는 실제 측정 대상이다. 네트워크 지연과 DB 내부 lock 경합, 저장장치 지연은 같은 실패가 아니므로 이 한 실험으로 모든 DB 병목을 설명했다고 주장하지 않는다.

## Worker를 더 늘렸더니 부담만 커지는 실패

대표 실패는 DB가 제한인 상황에서 Worker 수를 계속 늘리는 대응이다. 더 많은 Worker가 결과를 보고하고 새 단계를 요구하면 Service와 DB가 처리할 요청도 늘 수 있다. 처리량이 늘지 않고 연결 대기나 오류만 증가한다면 확장 대상을 잘못 선택했을 가능성이 있다.

이 판단에도 비교 기준이 필요하다. 같은 입력과 시간 구간에서 Worker 증가 전후의 유효 완료 건수, Service 오류율, DB 지연을 비교한다. 실패한 요청의 재시도가 일시적으로 요청량을 더 늘렸는지도 확인한다. 눈에 보이는 Pod CPU만으로 여유를 판단하면 DB 같은 공유 자원의 제한을 놓칠 수 있다.

DB 설정을 바꾸기 전에는 연결 수와 실제 사용, 쿼리 지연, 저장공간, I/O, lock 같은 DB 자체의 관측도 필요하다. 특정 connection pool 크기나 메모리 값을 근거 없이 추천할 수는 없다. DB 벤더 문서와 선택 Server 릴리스의 권장 구성을 함께 검토한 뒤 하나씩 바꾼다.

## 검색 부하와 실행 상태 쓰기도 분리한다

Visibility는 실행 목록과 검색을 위한 저장소다. 기본 persistence와 같은 PostgreSQL 인스턴스에 있다면 많은 검색이 다른 작업과 자원을 공유할 수 있다. 그렇다고 검색이 느린 모든 상황을 실행 복구 장애로 해석해서도 안 된다. 실행 ID를 통한 확인과 목록 검색이 보여 주는 현상을 구분한다.

이 글의 첫 실험에서는 Visibility 부하를 고정한다. 나중에 검색 부하를 별도 실험으로 늘려 영향이 있는지 본다. 테스트 조건을 분리해야 기본 저장소 문제인지 검색 부하의 영향인지 설명할 수 있다. 두 역할을 다른 인스턴스로 나누는 판단 역시 관측과 운영 비용을 근거로 해야 한다.

복구 뒤에는 지표가 정상화됐다는 것만 보지 않는다. 중단 기간에 시작한 실행 중 누락되거나 계속 대기하는 것이 있는지, 예약 확정이 끝나지 않은 문서가 있는지 본다. 인프라가 정상으로 돌아온 시점과 업무가 모두 따라잡은 시점은 다를 수 있다.

검증 질문은 “Worker의 CPU가 낮다는 사실이 Worker 수를 늘려야 한다는 근거가 될까?”다. 또 “검색 목록이 늦게 보이는 현상과 실행 상태 기록이 느린 현상을 어떤 증거로 나눌까?”를 생각해 보자. 병목을 나눠 설명할 수 있어야 확장도 이유 있는 변경이 된다.

## 어떤 지표가 가설을 지지하는가?

`persistence_latency`와 DB 지표가 함께 상승하면 DB 경로를 조사한다. DB에 여유가 있는데 `ResourceExhausted`가 생기면 RPS·QPS·연결 제한을 확인한다. `lock_latency`와 `service_latency_userlatency`는 Shard·Workflow 경합의 단서다. 이 신호들은 가설을 좁히며 단일 지표로 원인을 확정하지 않는다.

Shard 수는 최초 기동 뒤 고정이다. History replica를 늘려도 한 Workflow의 직렬 처리 조건이 없어지는 것은 아니다. Visibility는 목록 조회뿐 아니라 실행 상태의 비동기 쓰기도 담당하므로 `visibility_persistence_latency`와 기본 저장소 경로를 구별한다. [Service 지표](https://docs.temporal.io/references/service-metrics).

DB 장애 전환은 이 부하 실험의 성공만으로 검증되지 않는다. 별도의 격리 환경에서 주 DB 연결 차단·대기·복구 후 History와 외부 원장을 대조해야 하며, 실제 failover는 아직 미실험이다.

## 공식 자료

- [Temporal Service 구성](https://docs.temporal.io/temporal-service/temporal-server)
- [Service metrics reference](https://docs.temporal.io/references/service-metrics)
- [자체 운영 부하 시험](https://docs.temporal.io/self-hosted-guide/production-checklist)
- [Persistence와 Visibility](https://docs.temporal.io/temporal-service/persistence)
