---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "실행 중인 v1과 새 v2 Worker를 함께 둔다"
key: "temporal-37-pinned-worker-version-rollout"
description: "새 유입과 기존 Pinned 실행을 나누고 구버전 Worker를 너무 일찍 종료하는 실패를 다룬다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 37
readingMinutes: 7
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

문서 처리가 하루 동안 승인을 기다리는 사이 새 버전을 배포해야 한다면 어떻게 할까? 모든 실행이 끝날 때까지 배포를 미룰 수도 없고, 과거 History를 이해하지 못하는 코드로 기존 실행을 넘길 수도 없다. Worker Versioning은 실행을 어떤 Worker 버전에 맡길지 관리하는 방법이다. 이번 초안에서는 Pinned 실행과 새 유입을 구분하는 작은 배포 실험을 제안한다.

가상 예제는 허용량 예약, 문서 변환, 결과 저장, 예약 확정이다. v2에는 저장 전 검증 단계를 추가한다고 가정한다. 여기서 v1과 v2는 애플리케이션 코드 버전의 예제 이름이며 Temporal Server나 SDK 릴리스 번호가 아니다. 아래 절차는 실제 배포 성과가 아니라 선택 릴리스에서 확인해야 할 실험 설계다.

## 이미지 교체와 실행 배정은 다르다

Kubernetes에서 Worker 이미지를 바꾸는 것은 프로세스가 실행할 코드를 바꾸는 일이다. 어느 Workflow가 그 프로세스에 작업을 맡길지는 별도 문제다. 일반 rolling update만으로 기존 실행의 History와 새 코드가 호환된다는 보장은 생기지 않는다.

Worker Versioning에서는 Worker Deployment와 그 안의 Version을 사용해 배포를 구분한다. Pinned 실행은 특정 Deployment Version에 연결되어 그 버전으로 처리되도록 관리한다. 따라서 새 버전으로 신규 실행을 받기 시작해도 이전 버전이 처리해야 할 실행은 남을 수 있다.

Auto-Upgrade 같은 다른 동작을 사용하는 경우에는 이후 Task가 새 버전으로 갈 수 있으므로 코드 호환성을 계속 검토해야 한다. 이 글은 선택지를 한꺼번에 실험하지 않고 Pinned 실행의 수명에 집중한다. 정확한 SDK 옵션과 Server 요구 조건은 현재 선택한 Worker Versioning 문서에서 확인한다.

## 구버전을 언제 내려도 되는가

“새 실행이 모두 v2로 들어온다”는 사실만으로 v1을 종료할 수는 없다. v1에 연결된 실행이 타이머, 승인 메시지, 장기 Activity 완료를 기다릴 수 있다. 지금 CPU 사용이 낮고 처리 중인 Task가 없어도 나중에 다시 작업이 생길 수 있다.

그래서 구버전 종료 판단에는 실행 수명과 배포 상태를 함께 봐야 한다. 버전별로 남은 실행이 있는지, 앞으로 돌아올 작업이 있는지, 선택한 릴리스가 제공하는 drainage 정보가 무엇을 의미하는지 확인한다. 수면 중인 Workflow를 “일이 없는 Worker”와 혼동하지 않는 것이 핵심이다.

예약 후 승인 대기 중인 문서가 좋은 예다. 예약이 남아 있고 승인 Signal을 받으면 변환을 시작해야 한다. 그 실행이 v1에 묶여 있는데 v1 Worker를 모두 내리면 v2가 건강해도 해당 실행은 필요한 버전의 처리를 기다릴 수 있다. 이는 Service가 사라진 문제와 다르다.

## 두 버전을 함께 관찰한다

실험용 버전 식별자는 같은 코드 빌드가 무엇인지 추적할 수 있게 정한다. 같은 식별자를 내용이 다른 이미지에 재사용하면 결과를 해석하기 어렵다. 이미지 digest와 애플리케이션 버전의 대응을 기록하되 공개 글에는 생성 예제의 정보만 사용한다.

1. v1 Worker로 문서 실행을 시작하고 예약 뒤 승인 대기에 둔다.
2. v1 Kubernetes Deployment를 유지하고 **별도의 v2 Deployment**를 만든다. 각각 다른 Temporal Deployment Version을 등록한다. 같은 Deployment의 이미지 교체로 v1 Pod를 모두 종료하지 않는다.
3. 선택한 기능의 절차에 따라 신규 유입을 v2로 보내도록 설정한다.
4. 새 문서가 v2의 검증 단계를 거치는지 확인한다.
5. 기존 문서에 승인을 보내 v1 경로로 진행하는지 확인한다.
6. 각 실행의 배정 버전, History, 외부 결과를 대조한다.

예상 결과는 신규 실행과 기존 Pinned 실행이 서로 다른 Worker 버전에서 처리되는 것이다. 단순 로그에 v1과 v2가 찍혔다는 것보다 Service가 보고하는 배정 정보와 실제 이벤트를 함께 남기는 편이 정확하다. Activity Worker를 별도 운영한다면 그 계약과 배정 방식도 확인해야 한다.

## v1을 너무 일찍 종료하는 실패

대표 실패는 v2의 신규 실행이 성공하자마자 v1을 모두 종료하는 것이다. 시험 환경에서 승인 대기 중인 v1 실행을 남기고 이 상황을 만든 다음 승인을 보낸다. Service health와 v2 Worker health가 정상이어도 기존 실행이 진전하지 않는지 관찰한다.

이때 필요한 대응은 곧바로 실행을 취소하거나 재생성하는 것이 아니다. 먼저 어떤 버전에 배정됐고 해당 버전의 Worker가 살아 있는지 확인한다. 실험에서는 동일한 v1 코드를 다시 올려 기존 실행이 진행할 수 있는지 본다. 이를 통해 구버전 이미지와 설정을 복구 가능한 형태로 보존해야 할 이유를 이해할 수 있다.

다만 v1을 다시 띄우면 모든 상황이 해결된다는 보장도 없다. 외부 API가 이미 폐기됐거나 데이터 계약이 달라졌다면 이전 코드도 실행할 수 없을 수 있다. Worker Versioning은 외부 시스템의 과거 계약을 자동 보관하지 않는다. 장기 실행을 허용하는 기간과 외부 호환성 유지 기간을 함께 설계해야 한다.

## 되돌리기도 실행별로 생각한다

v2에 문제가 있어 신규 유입을 v1으로 돌리는 것과 이미 v2에 연결된 실행을 처리하는 것은 다른 문제다. 신규 유입 방향만 바꿔도 v2가 만들었던 외부 결과나 History가 사라지지는 않는다. 영향을 받은 실행을 조회하고 v2 수정 버전, 명시적 이전, 수동 처리 중 무엇이 필요한지 검토해야 한다.

기존 실행을 강제로 다른 버전에 보내는 기능이 있더라도 이를 호환성 검사를 생략하는 방법으로 쓰면 안 된다. 대상 코드가 해당 History를 이해하는지와 업무 결과가 유지되는지 먼저 확인한다. 이전 글의 replay 테스트가 여기서도 판단 근거가 된다.

Worker Versioning은 과거 실험 API와 현재 API가 섞여 있는 자료가 많다. 검색한 코드가 어떤 세대의 API인지 확인하고 선택 Server·SDK의 문서를 기준으로 구현해야 한다. 버전 번호의 크기만 비교하거나 오래된 명령을 섞으면 배포 설계와 다른 동작을 만들 수 있다.

검증 질문은 “신규 실행이 모두 v2로 가는데 v1을 계속 유지해야 하는 이유는 무엇일까?”다. 또 “유입을 v1으로 되돌렸다면 이미 v2가 처리한 실행도 자동으로 되돌아갈까?”를 생각해 보자. 실행의 수명을 배포보다 길게 보는 관점이 이 기능의 핵심이다.

## 이전 Worker가 남는 배포와 Run 전환

이 글의 Pinned Worker Versioning에는 v1과 v2가 공존하는 rainbow 배포가 필요하다. Temporal의 같은 Worker Deployment 이름 안에서 서로 다른 Build ID를 사용하고, Kubernetes에서는 별도 Deployment 리소스로 두 버전을 유지한다. 두 제품에서 쓰는 Deployment라는 이름을 구별한다. 일반 rolling update로 한 Kubernetes Deployment의 이미지만 교체하면 구버전 Pod가 사라져 기존 실행이 기다릴 수 있다. “배포 중 두 버전이 잠깐 공존한다”와 “이전 실행이 끝날 때까지 v1을 유지한다”는 다르다. [Worker Versioning 배포 조건](https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning).

Pinned 실행은 기본적으로 Continue-As-New 체인에서도 원래 버전을 유지한다. 새 Run에서 자동으로 최신 코드로 바뀐다고 가정하지 않는다. 2026-10-04 확인한 Upgrade on Continue-As-New는 Public Preview이며 SDK·Server 지원과 명시적 옵션을 확인해야 한다. 기존 Run에서 진행 중인 handler·Activity를 정리하고 넘길 상태를 정한 뒤 전환한다. [상태 이전은 24편](/posts/temporal-24-continue-as-new-state/)과 함께 확인한다.

## 공식 자료

- [Worker Versioning](https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning)
- [Worker 배포](https://docs.temporal.io/production-deployment/worker-deployments)
- [Java Workflow versioning](https://docs.temporal.io/develop/java/workflows/versioning)
