---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "PostgreSQL에 실행 상태를 남긴다"
key: "temporal-30-postgresql-persistence"
description: "PostgreSQL 기반 영속 환경을 준비하고 재시작 전후 실행과 업무 데이터를 대조한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 30
readingMinutes: 6
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

개발 서버로 첫 Workflow를 실행했다면 다음 질문은 “프로세스를 다시 띄워도 무엇이 남는가”다. 이번 초안에서는 Temporal Service의 실행 상태를 PostgreSQL에 두고, 같은 문서 처리 예제를 연결하는 절차를 살펴본다. 실제 설치 결과를 보고하는 글은 아니다. 선택한 릴리스에서 설정과 예상 결과를 확인하기 위한 실험 설계다.

문서 처리 순서는 허용량 예약, 가상 변환, 결과 저장, 예약 확정이다. 여기에는 두 종류의 데이터가 있다. 예약 원장과 변환 결과는 애플리케이션의 업무 데이터다. Workflow의 이벤트와 실행 상태는 Temporal의 데이터다. 둘을 같은 PostgreSQL 제품으로 운영하더라도 같은 트랜잭션이 되는 것은 아니다.

## 하나의 DB 제품과 두 저장 역할

Temporal의 기본 persistence store는 실행 상태, Event History, 처리할 Task, Namespace 정보 등을 보관한다. Visibility store는 실행 목록을 찾고 속성으로 검색하는 데 사용한다. 두 역할을 이해한 뒤 같은 DB 인스턴스의 별도 데이터베이스로 구성할지, 인스턴스까지 분리할지 결정한다.

학습 환경에서는 PostgreSQL로 두 역할을 관찰하면 추가 검색 엔진을 설치하는 부담을 줄일 수 있다. 하지만 모든 운영 규모에서 같은 배치를 권한다는 뜻은 아니다. 실행 상태 쓰기와 검색 부하는 서로 영향을 줄 수 있으므로 실제 배치는 부하와 운영 요구에 따라 검증해야 한다.

PostgreSQL을 지원한다는 문구만으로 아무 버전이나 고르지 않는다. Temporal Server 릴리스, SQL plugin, schema 경로, Visibility 지원 조건을 함께 확인해야 한다. 문서의 최소 지원 버전과 새 환경에서 선택할 보안 패치 버전도 다르다. 이 글은 특정 버전을 최신이라고 고정하지 않고, 실험에 사용한 조합을 별도 표로 남기는 방식을 택한다.

## 실행 이미지보다 스키마를 먼저 준비한다

개발용 자동 초기화 예제는 편하지만 어떤 작업을 대신 수행했는지 가리기도 한다. 영속 환경에서는 DB 생성, 사용자 권한, 기본 schema 초기화, Visibility schema 초기화, Server 시작을 구분한다. 스키마 도구와 schema 파일은 선택한 Server 릴리스에 맞추어 준비한다.

현재 공식 배포 안내의 출발점은 `samples-server`의 Compose 예제다. 과거 `docker-compose` 저장소나 `auto-setup` 이미지를 사용한 글과 경로가 다를 수 있다. 예제를 가져오더라도 이미지 태그와 volume, schema 처리 방식을 읽고 사용해야 한다. `latest`에 기대면 나중에 같은 명령을 실행해도 같은 실험이 되지 않는다.

기록에는 Server 이미지, admin-tools, PostgreSQL, CLI, UI, Java SDK 버전을 따로 적는다. schema 버전도 기본 저장소와 Visibility 저장소를 나눠 기록한다. SDK 버전 숫자가 Server 버전보다 커야 한다는 규칙은 없다. 별도 제품의 릴리스 번호이며 사용하는 기능의 호환 조건을 확인하는 것이 맞다.

## 최소 확인 절차

첫 영속 실험은 다음 순서로 진행할 수 있다.

1. PostgreSQL의 데이터 volume과 시험용 접속 정보를 준비한다.
2. 선택 릴리스의 도구로 기본 저장소와 Visibility 저장소 schema를 준비한다.
3. Server가 의도한 두 저장소를 참조하는지 확인하고 시작한다.
4. 시험 Namespace를 등록하고 CLI로 조회한다.
5. Java Worker를 연결한 뒤 문서 처리 실행 하나를 시작한다.
6. 가상 변환 단계에서 대기시킨 상태로 Service를 종료했다가 다시 시작한다.
7. 같은 Workflow ID와 Run ID의 이벤트와 외부 예약 상태를 대조한다.

예상 결과는 DB가 보존되고 설정이 같다면 Service 재시작 뒤 기존 실행 상태를 다시 읽을 수 있다는 것이다. 이것은 결과 저장 Activity가 정확히 한 번만 수행된다는 증명은 아니다. 중단 시점에 완료 응답이 유실됐다면 재시도될 수 있으므로 예약과 저장의 업무 키를 이용한 멱등성 검증은 계속 필요하다.

## 컨테이너가 다시 떴다는 것만 보면 놓치는 실패

대표적인 실수는 재생성을 하면서 DB volume도 함께 지우는 것이다. 화면이 정상으로 열리고 새 Workflow가 실행되더라도 이전 실행 기록이 없다면 영속성 시험에 성공한 것이 아니다. 이번 실험에서는 서비스 재시작과 데이터 초기화 명령을 분리하고, 데이터 제거는 별도 의도적인 작업으로 취급한다.

또 다른 실패는 Server 설정이 새로 만든 빈 DB를 가리키는 경우다. 로그의 연결 성공만 보면 정상처럼 보일 수 있다. 실행 ID로 기존 기록을 조회하고 Namespace 목록, schema 버전, 접속 대상을 함께 확인해야 한다. 단순 연결 가능 여부보다 “내가 보존하려던 실행이 남았는가”가 완료 기준이다.

DB 내부 테이블을 직접 수정해 실행을 고치는 것은 이 실습의 복구 방법이 아니다. Temporal의 상태는 여러 기록과 규칙에 걸쳐 있으므로 임의 SQL 수정으로 일관성을 보장할 수 없다. 설정 문제라면 연결 대상을 바로잡고, schema 문제라면 선택 릴리스의 초기화·업그레이드 절차로 돌아간다.

## 업무 데이터까지 함께 확인한다

Service 복구 후 Workflow가 완료됐다는 사실과 예약 원장이 올바르다는 사실은 별도로 확인한다. 성공한 실행이라면 결과가 존재하고 해당 예약이 확정됐는지 본다. 실패한 실행이라면 해제해야 할 예약이 남지 않았는지 확인한다. Event History는 실행 관리의 근거이고, 외부 원장은 업무 효과의 근거다.

이 비교가 중요한 이유는 두 저장소의 성공 시점이 다르기 때문이다. 결과 저장소가 응답을 보내기 직전에 끊겼다면 Temporal에는 성공이 기록되지 않을 수 있다. 복구된 실행이 저장을 다시 요청하더라도 같은 업무 키의 결과가 하나만 남도록 만든 설계는 그대로 유지해야 한다. persistence를 외부 DB로 바꿨다고 애플리케이션의 중복 처리 책임까지 사라지지는 않는다.

남길 결과물은 버전표, 설정에서 역할을 드러내는 부분, 재시작 전후 실행 ID, Event History, 예약과 결과의 건수다. 비밀번호나 개인 데이터는 필요 없다. 이 정도가 있어야 다른 독자가 같은 조건을 구성하고 결과를 비교할 수 있다.

검증 질문은 “DB 프로세스가 살아 있다는 사실과 실행 데이터가 보존됐다는 사실을 어떤 증거로 구분할까?”다. 이어서 “Visibility가 검색을 담당한다면, 실행 복구를 검색 결과만으로 판단해도 될까?”를 생각해 보자. 두 저장 역할을 구분하면 다음 보안과 운영 실험의 대상도 분명해진다.

## 공식 자료

- [Temporal Service 배포](https://docs.temporal.io/self-hosted-guide/deployment)
- [Persistence의 데이터와 지원 조건](https://docs.temporal.io/temporal-service/persistence)
- [Visibility 저장소 구성](https://docs.temporal.io/self-hosted-guide/visibility)
