---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Kubernetes 배포에서 schema Job이 실패하면"
key: "temporal-32-kubernetes-schema-job-failure"
description: "schema Job 실패를 Server 배포 전에 발견하고 데이터 준비와 Pod 상태를 구분한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 32
readingMinutes: 6
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

Kubernetes에서 Pod가 Running이면 Temporal 설치가 끝난 것일까? 실행할 프로세스가 올라왔다는 사실만으로는 DB 준비, API 처리, Worker의 업무 실행까지 확인할 수 없다. 특히 schema 준비 단계가 실패했는데 그 뒤 배포만 진행하면 원인을 여러 Pod의 오류에서 찾게 된다. 이번 초안은 설치 명령보다 실패한 초기화 작업을 어떻게 다룰지에 초점을 둔다.

예제는 허용량 예약, 가상 문서 변환, 결과 저장, 예약 확정이다. Java Worker 이미지와 Temporal Server 이미지는 서로 다르다. Helm chart는 Service 배포를 돕지만 가상 문서 처리 코드까지 자동으로 설치하는 도구는 아니다. 아래 절차는 별도 시험 환경에서 수행할 제안이며 실제 실행 결과는 아직 없다.

## DB 준비와 Server 시작을 구분한다

Temporal은 실행 상태를 저장할 persistence와 검색을 위한 Visibility 구성이 필요하다. 선택한 DB가 존재한다는 것과 Temporal이 요구하는 schema가 준비됐다는 것은 다르다. 연결할 수 있는 빈 PostgreSQL을 만들어 놓고 Server를 시작해도 필요한 테이블과 버전이 맞지 않으면 정상 처리를 기대할 수 없다.

Kubernetes에서는 이 준비를 Job으로 실행할 수 있다. 다만 정확히 어떤 Job이 생성되는지, 언제 실행되는지, Helm hook을 쓰는지는 chart 버전에 따라 확인해야 한다. 이전 chart의 values를 새 chart에 그대로 넣고 “예전에 되던 설정”이라고 판단하면 초기화 작업 자체가 달라진 사실을 놓칠 수 있다.

공식 Helm 저장소는 chart와 DB의 생명주기를 분리하는 구성을 안내한다. 오래된 예제에는 DB나 관측 도구가 함께 설치되는 구성이 있을 수 있다. 따라서 chart가 무엇을 생성하는지 렌더링 결과를 읽고, DB는 누가 준비하고 누가 보존하는지 명시해야 한다.

## 먼저 렌더링 결과를 읽는다

실제 설치 전에 선택한 chart 태그와 values로 생성될 manifest를 확인한다. 이때 중요한 것은 YAML 양보다 역할이다. Server 구성요소, schema 작업, 접속 정보, 서비스 주소, probe, 자원 요청이 어떤 객체로 나타나는지 읽는다.

특히 schema Job과 Server가 같은 DB를 가리키는지 확인한다. Job은 시험 DB에 schema를 만들고 Server는 다른 DB에 붙는다면 Job 성공 표시가 의미를 잃는다. 기본 저장소와 Visibility 저장소 각각에 대해 주소, 데이터베이스 이름, schema 대상이 맞아야 한다. 비밀번호 값은 보고서에 복사하지 않고 Secret 참조의 연결만 검토한다.

이미지 태그도 chart 버전과 별개다. chart만 고정하고 이미지가 떠 있는 태그를 쓰면 다음 설치 결과가 바뀔 수 있다. chart, Server, admin-tools, UI, DB, Java Worker를 각각 기록한다. schema 도구가 사용하는 파일은 목표 Server와 대응해야 한다.

## 실패를 한 가지로 제한한다

첫 실패 시험에서는 schema Job에만 DB 접속 오류를 의도적으로 준다. 예를 들어 존재하지 않는 시험 DB 이름을 사용하되 운영 자격이나 실제 데이터에는 손대지 않는다. 동시에 네트워크 정책과 인증서까지 바꾸면 어떤 오류가 먼저인지 설명하기 어려워진다.

시험 순서는 다음과 같다.

1. 정상 manifest에서 DB와 schema 대상의 관계를 확인한다.
2. 격리된 환경에서 schema Job의 접속 대상 하나만 잘못 지정한다.
3. Job의 종료 상태와 로그에서 최초 실패 이유를 확인한다.
4. 배포 절차가 다음 Server 단계의 진행을 막는지 확인한다.
5. 설정을 바로잡고 선택 chart가 안내하는 방식으로 Job을 다시 실행한다.
6. schema 버전과 Service API를 확인한 뒤 문서 처리 실행을 시작한다.

예상하는 바람직한 결과는 schema 실패가 배포 실패로 드러나고 새 실행을 받기 전에 멈추는 것이다. 실제 chart나 배포 도구가 이를 자동으로 보장하는지는 확인 대상이다. 보장하지 않는다면 파이프라인에 명시적인 완료 확인과 진행 조건이 필요하다.

## 반복 재시도는 원인 해결과 다르다

Job이 실패하면 무조건 삭제하고 재실행하는 대응은 피한다. 권한이 없거나 DB 이름이 틀렸다면 같은 요청을 반복해도 해결되지 않는다. 더 나쁜 경우에는 초기화 작업과 업그레이드 작업을 혼동해 이미 쓰는 DB에 새 설치 절차를 적용할 수 있다.

로그에서는 실패한 DB, 작업 종류, schema 경로, 도구 버전, 권한 오류를 확인한다. 단 비밀 값이 포함된 접속 문자열을 공개 초안에 옮기지 않는다. 실행 기록에는 값 대신 오류 분류와 수정한 설정의 역할을 적으면 충분하다.

스키마 변경이 어디까지 반영됐는지도 중요하다. 실패했다고 이전 상태로 모두 돌아갔다고 가정하지 말고, 도구와 DB가 보고하는 schema 상태를 확인한다. 재실행 가능 여부와 필요한 복구는 선택 릴리스의 절차를 따른다. 일반적인 Pod 재시작 경험만으로 DB 변경의 되돌리기를 판단해서는 안 된다.

## probe와 업무 확인을 연결한다

Server Pod가 준비 상태가 된 다음에는 API 호출을 확인한다. 그다음 Java Worker가 올바른 Namespace와 Task Queue를 기다리는지 본다. 마지막으로 실제 가상 문서를 처리해 결과 저장과 예약 확정을 확인한다. 각 단계는 서로 다른 질문에 답한다.

probe는 트래픽을 받아도 되는지 판단하는 데 도움이 된다. 하지만 결과 저장소의 쓰기 권한이나 예약 API의 업무 규칙까지 자동 검사하지는 않는다. 따라서 “모든 Pod 준비 완료”와 “예제 업무 완료”를 따로 남겨야 한다.

초기 설치와 기존 실행이 있는 업그레이드도 구분한다. 새 시험 DB에서 실패를 다룰 수 있게 됐다고 운영 DB schema 변경이 안전하다고 결론 내릴 수 없다. 실행 중인 Workflow를 유지하는 업그레이드는 이후 글에서 별도 검증한다.

검증 질문은 “schema Job이 성공했는데 Server가 schema 오류를 낸다면 가장 먼저 무엇을 대조할까?”다. 이어서 “Job 실패 뒤 Helm 명령만 되돌리면 DB도 이전 schema로 돌아갈까?”를 생각해 보자. 배포 객체의 상태와 데이터 변경을 나눠 설명할 수 있어야 운영 절차가 구체적이 된다.

## 공식 자료

- [Temporal Helm chart](https://github.com/temporalio/helm-charts)
- [Chart 변경과 마이그레이션](https://github.com/temporalio/helm-charts/blob/main/UPGRADING.md)
- [Server와 schema 업그레이드](https://docs.temporal.io/self-hosted-guide/upgrade-server)
