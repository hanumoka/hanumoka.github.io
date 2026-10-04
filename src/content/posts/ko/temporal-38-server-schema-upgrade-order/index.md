---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Server 업그레이드에서 스키마가 먼저인 이유"
key: "temporal-38-server-schema-upgrade-order"
description: "Server·SDK·chart의 독립 버전을 기록하고 schema 선행 업그레이드와 복구 조건을 검토한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 38
readingMinutes: 7
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

Temporal Server 이미지를 새 태그로 바꾸면 업그레이드가 끝날까? 실행 상태가 DB에 남는 시스템에서는 새 프로세스가 기존 데이터를 읽고 갱신할 수 있어야 한다. 그래서 Server 변경은 이미지 교체와 데이터 호환성을 함께 다룬다. 이번 초안은 schema가 필요한 순서와 업그레이드 중 확인할 실행을 설명한다.

예제에는 허용량 예약을 마치고 가상 변환을 기다리는 문서가 있다. 업그레이드 뒤에도 그 실행을 이어 결과를 저장하고 예약을 확정해야 한다. 여기서 제시하는 순서는 공식 절차를 바탕으로 한 시험 설계이며, 특정 릴리스 조합의 무중단 성공을 주장하는 글은 아니다.

## 버전 표에는 한 숫자만 적지 않는다

Server, Java SDK, CLI, UI, Helm chart, PostgreSQL은 서로 다른 소프트웨어다. 같은 숫자로 맞출 필요도 없고 SDK 숫자가 Server보다 크면 안전하다는 규칙도 없다. 사용하는 기능에 필요한 최소 조건과 각 릴리스의 변경 사항을 확인해야 한다.

schema도 기본 persistence와 Visibility를 나눠 기록한다. 둘은 다른 역할을 가지며 릴리스에 따라 필요한 변경이 다를 수 있다. admin-tools나 직접 빌드한 schema 도구가 어느 릴리스의 파일을 사용하는지도 표에 남긴다. “서버를 올렸다”라는 기록만으로는 이후 오류가 코드, chart, 데이터 중 어디에서 생겼는지 알기 어렵다.

실험 표에는 변경 전과 목표 조합을 나란히 적는다. 아직 확인하지 않은 칸은 추정 버전으로 채우지 않고 미확인으로 둔다. 새 기능을 사용한다면 그 기능의 SDK·Server 조건도 별도로 적는다. 기본 API 연결 성공이 모든 기능 호환성을 보장하지는 않는다.

## 왜 schema를 먼저 바꾸는가

새 Server가 요구하는 데이터 구조가 아직 없다면 새 코드가 필요한 읽기와 쓰기를 수행할 수 없다. 공식 업그레이드 안내는 목표 릴리스에 schema 변경이 필요한지 release note를 확인하고, 필요한 schema를 먼저 갱신한 다음 Server를 올리도록 설명한다.

이 절차는 모든 릴리스마다 무조건 schema가 바뀐다는 뜻은 아니다. 필요 여부와 도구, 경로를 목표 릴리스에서 확인해야 한다. schema 파일만 최신 main에서 가져오고 Server는 다른 태그를 사용하는 식으로 섞지 않는다.

또한 minor 버전을 건너뛰는 업그레이드를 일반적으로 보장하지 않는다. 공식 안내는 현재 minor의 최신 patch를 먼저 적용한 뒤 다음 minor로 순서대로 이동하도록 한다. 중간 버전에서 데이터를 읽고 갱신하는 과정이 필요할 수 있기 때문이다. 잠깐 프로세스가 떴다는 사실만 보고 곧바로 다음 버전으로 넘어가지 말고 해당 단계의 확인을 마친다.

## 기존 실행을 시험의 중심에 둔다

새 실행 하나가 성공하는지 확인하는 것은 필요하지만 충분하지 않다. 장기 실행이 있는 시스템에서는 기존 History를 읽고 다음 이벤트를 기록할 수 있어야 한다. 예약 후 대기, 변환 중, 저장 완료 후 확정 대기 같은 서로 다른 상태를 준비하면 확인 범위를 분명히 할 수 있다.

첫 실험에서는 범위를 작게 잡는다. 선택한 두 인접 릴리스와 시험 DB를 사용하고, 애플리케이션 코드는 그대로 둔다. Worker 코드와 Server를 동시에 바꾸면 실패했을 때 원인을 나누기 어렵다.

1. 변경 전 버전표와 schema 상태, 시험 백업을 확보한다.
2. 대표 상태의 가상 문서 실행을 만들고 외부 예약 원장을 기록한다.
3. release note가 요구하는 schema 변경을 적용한다.
4. schema 성공과 버전을 확인한 뒤 Server를 교체한다.
5. 기존 실행을 계속 진행시키고 신규 실행도 하나 시작한다.
6. Event History, 결과 저장, 예약 확정, 오류 지표를 대조한다.

예상 결과는 지원되는 절차와 조합에서 기존 실행이 진행될 수 있다는 것이다. 실제 관찰한 중단 시간이나 오류는 실행 후 기록한다. 이 설계만으로 무중단이나 데이터 무손실을 선언하지 않는다.

## schema 실패를 무시하면 생기는 문제

대표 실패는 schema Job이 오류를 냈는데 배포 파이프라인이 Server 이미지 교체를 계속하는 상황이다. 새 Server가 반복 재시작하면 겉으로는 이미지 문제처럼 보이지만 최초 원인은 DB 권한이나 schema 적용 실패일 수 있다.

시험에서는 안전한 별도 DB에 잘못된 접속 권한을 주어 schema 단계가 실패하도록 만들 수 있다. 바람직한 예상 결과는 다음 단계가 멈추고 원인이 명확하게 남는 것이다. 실제 배포 도구가 그렇게 동작하는지는 직접 확인해야 한다. 자동으로 막지 못한다면 schema 완료와 버전 확인을 다음 단계의 조건으로 만든다.

실패 후에는 일부 변경이 반영됐는지도 확인한다. 작업이 오류로 끝났다는 사실을 “아무것도 바뀌지 않았다”로 읽지 않는다. 도구와 DB의 상태를 확인하고 해당 릴리스의 복구 또는 재실행 절차를 적용한다. 기존 DB를 지우고 새로 만드는 방법은 실행 상태를 보존하는 업그레이드 복구가 아니다.

## 이미지 rollback은 데이터 rollback이 아니다

Helm release나 컨테이너 이미지를 이전 버전으로 돌려도 이미 적용한 schema와 기록된 데이터가 자동으로 이전 모습이 되지는 않는다. 이전 Server가 변경된 데이터를 읽을 수 있는지는 별도 호환성 질문이다. 무조건적인 rollback 명령을 복구 계획으로 적어서는 안 된다.

복구 계획에는 어떤 실패에서 이전 코드로 돌아갈 수 있는지, 언제 백업 복원이 필요한지, 복원하면 그 이후 외부 예약과 저장 결과를 어떻게 대조할지 들어가야 한다. 이 판단은 목표 릴리스와 DB에 따라 달라진다. 다음 글에서 백업을 별도 환경에 복원하는 이유도 이 때문이다.

Worker 배포와 Server 업그레이드는 책임도 분리한다. Server를 올렸다고 비결정적 Workflow 코드가 고쳐지지 않고, replay 테스트가 통과했다고 DB schema 적용이 검증되지 않는다. 두 검증을 연결하되 서로 대신하게 만들지 않는다.

검증 질문은 “SDK 숫자가 Server보다 크면 호환된다는 판단은 왜 성립하지 않을까?”다. 또 “새 Server 시작에 실패해 이전 이미지를 올렸다면 데이터까지 되돌렸다고 말할 수 있을까?”를 생각해 보자. 버전표와 실제 복구 시험이 있어야 답을 근거 있게 할 수 있다.

## chart 변경이 Server 버전도 바꿀 수 있다

Helm chart의 버전을 크게 올리면 기본 appVersion과 Server·admin-tools 이미지가 함께 바뀔 수 있다. 렌더링 결과에서 현재·목표 Server minor와 schema 도구를 대조한다. 공식 지침대로 minor 버전을 순서대로 올리고 각 단계의 metadata 갱신과 진척을 확인한다. chart 업그레이드 성공을 임의 minor 건너뛰기 지원으로 해석하지 않는다.

schema를 먼저 올린 뒤 이전 바이너리로 관찰하는 절차와 새 바이너리 배포를 나눈다. 이미지 rollback이 schema downgrade를 뜻하지 않으며 부분 DB 변경은 Helm rollback만으로 취소되지 않는다. GitOps 부분 동기화에서 schema hook이 제외되면 같은 선행 보장이 사라진다. [Server 업그레이드](https://docs.temporal.io/self-hosted-guide/upgrade-server), [Helm chart](https://github.com/temporalio/helm-charts).

## 초기 설치 명령과 업그레이드 명령을 섞지 않는다

사용 중인 persistence·Visibility DB에는 목표 릴리스의 `temporal-sql-tool update-schema`를 각각 적용한다. 새 DB의 `create-database`·`setup-schema -v 0.0` 절차를 반복하거나 `--overwrite`로 오류를 없애지 않는다. PostgreSQL은 Server 1.32.0의 플러그인 `postgres12` 또는 `postgres12_pgx`와 `schema/postgresql/v12` 경로를 기준으로 도구·설정·파일을 함께 확인한다. SQL 도구와 DB 사이 연결 권한·백업·복원 가능성은 실행 전에 별도로 준비한다. [새 환경과의 차이는 30편](/posts/temporal-30-postgresql-persistence/), [고정 버전 SQL 도구](https://github.com/temporalio/temporal/blob/v1.32.0/tools/sql/main.go).

## 공식 자료

- [Server 업그레이드 순서](https://docs.temporal.io/self-hosted-guide/upgrade-server)
- [배포와 chart·이미지 호환성](https://docs.temporal.io/self-hosted-guide/deployment)
- [Server release notes](https://github.com/temporalio/temporal/releases)
- [SDK와 Server의 독립 릴리스](https://docs.temporal.io/temporal-service/temporal-server)
