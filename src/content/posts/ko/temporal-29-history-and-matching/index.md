---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Service의 History와 Matching은 무엇을 맡는가"
key: "temporal-29-history-and-matching"
description: "History·Matching·SDK Worker의 책임과 History Shard를 실행 흐름으로 구분한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 29
readingMinutes: 6
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

문서 처리 Worker가 꺼졌다가 다시 떠도 실행을 이어 갈 수 있다는 설명에는 중요한 전제가 있다. Worker 밖에 실행 상태를 보관하고, 다시 실행할 작업을 전달하는 시스템이 있어야 한다. Temporal Service가 그 역할을 맡는다. 이번 글은 Service 내부의 History와 Matching이 무엇을 나누어 맡는지 살펴보는 초안이다. 아래 관찰 절차는 아직 실행하지 않은 실험 제안이다.

예제의 순서는 허용량 예약, 가상 문서 변환, 결과 저장, 예약 확정이다. Java Worker는 이 업무 코드를 실행한다. 반면 Temporal Server를 설치한다고 가상 변환 코드가 Server 안에서 실행되는 것은 아니다. 이 구분이 흐려지면 Worker가 없어서 멈춘 실행에 History 서버를 더 추가하는 잘못된 대응을 하게 된다.

## 시작 요청과 코드 실행은 다른 단계다

Client가 Workflow 시작을 요청하면 요청은 Frontend로 들어온다. Frontend는 API 요청의 검증, 인가, 제한, 내부 전달을 담당한다. 이름 때문에 웹 화면을 떠올리기 쉽지만 여기서 Frontend는 UI가 아니라 Service의 API 진입점이다. UI도 이 진입점을 이용하는 별도 구성요소다.

History는 Workflow 실행 상태와 이벤트 기록을 관리한다. 예약 Activity를 실행하기로 했다는 결정, 예약이 완료됐다는 결과, 대기 타이머 같은 상태 변화가 처리된다. 새로 수행할 Workflow Task나 Activity Task가 생기면 Matching을 통한 전달이 필요해진다. Matching은 Task Queue에서 작업과 작업을 요청하는 Worker를 연결한다. Worker는 오래 유지되는 요청으로 작업을 기다리고, 받은 작업을 실행한 뒤 결과를 Service에 보낸다.

따라서 다음처럼 읽으면 된다.

1. Client가 문서 처리 실행을 요청한다.
2. Service가 실행을 기록하고 진행에 필요한 Task를 준비한다.
3. Matching을 통해 해당 Task를 기다리는 Worker에 전달한다.
4. Worker가 코드를 실행하고 다음 결정이나 Activity 결과를 보낸다.
5. Service가 이를 기록하고 다음 작업이나 대기를 관리한다.

이 순서는 역할을 이해하기 위한 설명이다. 모든 요청이 매번 같은 내부 호출을 거친다는 네트워크 명세는 아니다. 캐시, 즉시 전달 최적화, Server 버전에 따라 실제 통신은 달라질 수 있다. 먼저 누가 업무 코드를 실행하고 누가 실행 상태를 보관하는지를 구분하는 것이 목적이다.

## History Shard는 서버 프로세스가 아니다

History가 관리하는 실행들은 Shard라는 단위로 나뉜다. Shard는 History의 상태 관리와 영속 작업을 분담하는 단위이며, 하나의 History 프로세스가 여러 Shard를 맡을 수 있다. 반대로 같은 Shard의 상태를 여러 프로세스가 제멋대로 동시에 갱신하도록 두지는 않는다. 프로세스가 바뀌면 소유권 조정이 일어나지만 실행의 영속 기록은 DB에 남는다.

여기서 설정 파일의 `numHistoryShards`와 Kubernetes의 History replica 수를 구분해야 한다. replica는 실행 중인 프로세스 수다. Shard 수는 Service를 구성할 때 정하는 분할 수이며, 이미 DB와 함께 운영 중인 Service에서 replica처럼 임의로 늘리는 값이 아니다. 공식 문서는 Shard 수를 바꾸려면 새 Service와 이관을 검토해야 한다고 설명한다.

Shard를 많이 잡으면 무조건 좋은 것도 아니다. 관리할 단위가 늘어나므로 자원 비용이 따른다. 반대로 너무 작은 구성은 이후 처리량 확장의 제약이 될 수 있다. 다른 회사의 숫자를 복사하기보다 예상 실행 수, 이벤트 발생량, DB 처리량을 바탕으로 시험해야 한다. 이번 예제에서는 숫자 추천보다 설정이 갖는 수명과 변경 비용을 이해하는 것으로 충분하다.

## Server의 Worker Service는 어떤 Worker인가

Server 구성에는 Worker Service라는 이름도 나온다. 이것은 개발자가 작성한 문서 처리 Java Worker와 다르다. Server 내부의 백그라운드 Workflow를 실행하기 위한 구성요소다. 운영 화면과 배포 파일에서 둘을 모두 Worker라고 줄여 부르면 “어느 프로세스를 재시작했는가”부터 혼란스러워진다.

실험 기록에는 `문서 처리 SDK Worker`와 `Server 내부 Worker Service`처럼 구분해서 적자. Workflow Task와 Activity Task를 같은 Java 프로세스에서 처리하는지, 따로 처리하는지도 표시하면 좋다. 업무 코드 배포와 Service 배포가 다른 작업이라는 사실이 배치도에 드러나야 한다.

## Worker를 멈추고 무엇이 남는지 확인한다

실험은 정상 실행 하나를 먼저 만든 뒤 수행한다. 허용량 예약이 끝나고 가상 변환을 기다리도록 만든 다음 SDK Worker만 중단한다. Client, Service, DB는 그대로 둔다. 이때 확인할 대상은 UI의 실행 상태, Event History의 마지막 이벤트, Task Queue를 기다리는 Worker의 유무다.

예상되는 관찰은 “Service가 살아 있지만 업무 진행이 기다린다”는 것이다. 실행이 대기 중이라고 해서 Matching이 가상 변환을 대신 수행하지 않는다. Worker를 다시 시작하면 작업이 전달되고 진행이 재개될 수 있다. 다만 Activity 실행 중 강제 종료했다면 Timeout과 재시도 설정에 따라 다음 시도가 시작되므로 즉시 이어질 것이라고 단정하지 않는다.

실패 예제로 Worker가 잘못된 Task Queue를 기다리게 만들어 보자. 정상 상태인 Frontend에 연결되더라도 필요한 작업을 가져가지 못할 수 있다. 이 상황에서 History replica를 늘려도 계약이 다른 큐를 기다리는 문제는 해결되지 않는다. Client가 시작한 실행의 Queue와 Worker가 실제 등록한 Queue를 먼저 대조해야 한다.

이 글의 검증 질문은 두 가지다. “Worker가 한 대도 없는데 시작 요청은 기록될 수 있는가?” 그리고 “History replica를 늘리는 것과 Shard 수를 바꾸는 것은 왜 같은 조작이 아닌가?” 두 질문을 설명할 수 있다면 다음 글에서 DB를 분리해도 실행 구조를 놓치지 않을 것이다.

## 공식 자료

- [Temporal Server 구성과 History Shard](https://docs.temporal.io/temporal-service/temporal-server)
- [Task와 Worker의 실행 관계](https://docs.temporal.io/tasks)
- [자체 운영 준비와 확장 검증](https://docs.temporal.io/self-hosted-guide/production-checklist)
