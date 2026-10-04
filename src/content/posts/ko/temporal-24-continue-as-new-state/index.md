---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Continue-As-New로 무엇을 넘겨야 할까"
key: "temporal-24-continue-as-new-state"
description: "문서 처리 요청을 계속 받아 같은 Workflow에서 반복 처리하면 이력이 커질 수 있다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 24
readingMinutes: 5
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

문서 처리 요청을 계속 받아 같은 Workflow에서 반복 처리하면 이력이 커질 수 있다. 오래 실행되는 관리용 Workflow가 승인 메시지와 Activity 결과를 계속 쌓는 상황을 생각해 보자. Continue-As-New는 현재 Run을 끝내고 같은 Workflow ID의 새 Run으로 이어가는 방법이다.

핵심은 새 Run에 새 이력이 생긴다는 점이다. 지금 프로세스에 있는 필드가 모두 자동 복사되는 기능은 아니다. 이어서 진행하는 데 필요한 상태를 입력으로 넘기는 계약을 설계해야 한다. 이 글은 그 계약에서 무엇을 빠뜨리기 쉬운지 살펴본다.

## Workflow ID는 같지만 Run은 달라진다

Workflow ID는 업무 실행을 식별하는 데 사용하고 Run ID는 구체적인 실행을 구별한다. Continue-As-New 이후에는 Workflow ID를 유지하면서 Run ID와 Event History가 바뀐다. 따라서 이전 Run의 이력 길이만 보고 전체 업무의 생애를 판단하면 일부를 놓칠 수 있다.

예제에서는 문서 처리 대기 목록을 관리하는 Workflow가 일정 수의 요청을 처리한 뒤 새 Run으로 이어진다고 하자. 이미 완료한 문서 전체의 본문을 넘기는 대신, 다음 처리 위치와 남은 요청, 필요한 정책 버전을 입력으로 정의할 수 있다.

이것은 큰 이력을 큰 입력 하나로 바꾸라는 뜻이 아니다. 새 Run에서 정말 필요한 상태를 줄이는 설계다. 완료된 결과의 상세 내용은 별도 저장소에 두고, Workflow에는 이후 의사결정에 필요한 식별자와 상태만 둘 수 있다.

## 어떤 정보가 다음 결정을 바꾸는가

먼저 새 Run이 시작할 때 첫 번째로 할 질문을 적어 본다. 다음 문서는 무엇인지, 이미 승인됐는지, 예약이 진행 중인지, 같은 메시지를 처리한 적이 있는지 알아야 할 수 있다. 이 질문에 필요한 정보가 전달 계약의 후보가 된다.

가상 입력을 다음처럼 생각할 수 있다. 이는 직렬화 DTO를 완성한 코드가 아니라 필드 의미를 정하기 위한 예다.

```text
nextPosition: 다음에 처리할 위치
pendingRequests: 아직 처리하지 않은 요청
policyVersion: 이번 처리에 적용할 규칙 버전
deduplicationState: 필요한 범위의 메시지 중복 판단 정보
```

필드를 늘리기 전에 각 값의 보존 기간과 상한을 정해야 한다. 메시지 ID를 영원히 메모리에 모아 계속 넘기면 입력도 계속 커진다. 중복 판단을 어느 기간·업무 범위에서 보장할지 정하고 필요하면 외부 저장소의 역할을 검토한다.

## 상태 한 가지를 빼고 결과를 본다

대표 실패 실험은 처리 위치를 넘기지 않고 새 Run을 시작하는 것이다. 앞의 문서를 다시 처리하거나 남은 문서를 건너뛰는지 관찰한다. 결과 저장이 멱등하더라도 쓸데없는 변환 호출이나 허용량 확인이 반복될 수 있으므로 최종 행 수만 보면 부족하다.

다음으로 승인 상태를 누락해 본다. 이전 Run에서 승인받은 문서가 새 Run에서는 다시 대기하거나 반대로 기본값 때문에 무승인 처리될 수 있다. 어떤 기본값이 안전한지와 빠진 입력을 오류로 처리할지를 계약에서 결정한다.

시험을 위해 실제 한계까지 수만 개의 이벤트를 만들 필요는 없다. 반복 수를 작게 제한해 Continue-As-New를 관찰하도록 만들 수 있다. 실습용 전환 조건과 실제 운영에서 SDK·Service의 이력 크기 신호를 고려할 조건은 구분해 기록한다.

## 핸들러가 아직 일하는 중이면 기다린다

Signal이나 Update 핸들러가 Activity를 기다리는 동안 새 Run으로 넘어가면 미완료 처리가 문제가 될 수 있다. 전환은 메인 Workflow 로직에서 담당하고, 필요한 핸들러가 끝났는지 확인한다. Update 핸들러 안에서 직접 Continue-As-New를 수행하는 식으로 만들지 않는다.

새 요청을 언제까지 현재 Run에서 받고 언제 다음 Run에서 처리할지도 검토한다. 메시지 도착 시점의 모든 경우를 운에 맡기지 말고, 대기 목록과 처리 완료 조건을 코드에 명시한다. 요청의 업무 ID를 유지하면 새 Run에서도 중복을 판단하는 데 도움이 된다.

장기 Activity가 끝나기 전에 전환하고 싶다는 요구가 있다면 왜 그 Activity가 현재 실행에 남아 있어야 하는지도 돌아본다. Continue-As-New는 진행 중인 임의 작업의 메모리를 통째로 이동하는 기능이 아니다. 실행 수명과 작업 경계가 맞는지 먼저 점검한다.

## 전환을 배포 수단과 혼동하지 않는다

새 Run이 생긴다는 사실이 모든 새 코드와 자동 호환된다는 뜻은 아니다. 전달 DTO가 바뀌거나 처리 규칙의 의미가 달라지면 새 Run 입력을 어떻게 해석할지 필요하다. Worker Versioning과 결합하는 방법은 별도 배포 설계에서 다룬다.

검증 자료에는 전환 전후 Workflow ID와 Run ID, 전달 입력, 처리한 문서 목록, 외부 결과 건수를 남긴다. 빠뜨린 필드를 추가한 뒤 같은 테스트를 반복해 이전의 중복·누락이 사라지는지 본다. 단순히 이력이 짧아졌다는 사실보다 업무 상태가 이어졌는지가 완료 기준이다.

**확인 질문:** 같은 Workflow ID인데 Run ID가 바뀌면 중복 판단 키는 그대로 써도 될까? 새 Run에 넘길 데이터가 계속 커진다면 무엇을 다시 설계해야 할까?

## 참고 자료

- [Java Continue-As-New](https://docs.temporal.io/develop/java/workflows/continue-as-new)
- [Workflow ID와 Run ID](https://docs.temporal.io/workflow-execution/workflowid-runid)
- [메시지 핸들러 종료와 전환](https://docs.temporal.io/develop/java/workflows/message-passing)
