---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Child Workflow는 함수 분리와 무엇이 다른가"
key: "temporal-25-child-workflow-lifecycle"
description: "Child의 시작 확인·부모 종료 정책·취소 전파를 구별해 독립 실행의 수명을 설계한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 25
readingMinutes: 6
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

문서 처리 코드가 길어지면 메서드로 나누고 싶어진다. 그렇다고 모든 메서드를 Child Workflow로 바꿀 필요는 없다. Child Workflow는 별도의 실행 ID와 이력, 종료 상태를 가진다. 코드를 보기 좋게 나누는 것보다 실행의 수명과 책임을 나누는 결정에 가깝다.

이 글에서는 문서 묶음 하나를 관리하는 부모 Workflow와 개별 문서를 처리하는 자식 Workflow를 가정한다. 자식은 허용량 예약·변환·저장·확정을 수행한다. 부모는 여러 문서의 완료를 기다리거나 전체 취소 정책을 결정한다.

## 메서드 호출과 다른 정보가 생긴다

일반 메서드를 호출하면 같은 Workflow 코드 안의 계산을 나눈다. Child Workflow를 시작하면 별도의 Workflow Execution을 만들고, 부모 이력에는 자식 시작과 완료 등에 관한 사건이 남는다. 자식의 내부 Activity 이력은 자식 실행에서 확인할 수 있다.

따라서 개별 문서를 독립적으로 조회하거나 다른 실패 수명으로 관리해야 할 때 유용할 수 있다. 반면 전체 흐름을 읽으려면 여러 실행을 오가야 하고, 부모와 자식의 종료 관계를 정의해야 한다. 단순한 코드 재사용만 필요하다면 메서드나 공통 코드로 충분할 수 있다.

Activity와도 구별한다. 외부 변환 API 한 번을 호출하는 작업은 Activity로 표현할 수 있다. 여러 Activity와 대기·메시지 처리를 포함하는 독립 업무 흐름이라면 Child Workflow를 검토할 근거가 생긴다. 길이가 길다는 이유만으로 자식을 만드는 기준은 충분하지 않다.

## 부모가 끝날 때 자식은 어떻게 될까

Parent Close Policy는 부모가 종료됐을 때 자식에게 어떤 동작을 적용할지 정한다. 기본 정책은 자식 실행을 Terminate하는 것이다. 부모가 성공으로 끝났다는 이유로 자식도 모두 정상 완료했다고 생각하면 안 된다.

자식을 계속 실행하게 두려면 ABANDON 같은 정책을 검토할 수 있다. 이 경우 부모가 끝나도 누가 자식의 실패를 감시하고 결과를 회수할지 필요하다. 부모의 생애에서 분리했다는 사실은 관리 책임이 사라졌다는 뜻이 아니다.

취소 요청 정책과 강제 종료도 다르다. 취소는 자식이 정리할 기회를 가질 수 있지만, 강제 종료에는 그 기회가 없다. 자식이 허용량을 예약한 상태라면 이 선택이 외부 원장에 어떤 영향을 주는지 확인해야 한다.

## 시작 요청과 시작 확인 사이도 구별한다

부모가 자식을 비동기로 시작하도록 요청하고 바로 반환하면 자식이 실제로 시작되기 전에 부모가 끝날 수 있다. 부모와 독립적으로 자식을 계속 실행하려는 경우에는 적절한 종료 정책뿐 아니라 자식 시작 확인도 필요하다.

Java에서는 자식 stub에 대한 Workflow 실행 정보를 기다려 시작을 확인하는 방식을 공식 문서가 안내한다. 구체적인 코드는 사용하는 SDK 버전의 예제와 함께 확인한다. 중요한 의미는 자식 완료를 기다리는 것과 자식 시작을 확인하는 것이 다르다는 점이다.

문서 묶음 부모가 “처리 접수 완료”로 끝나도록 설계했다면 모든 자식의 완료를 기다릴 필요는 없을 수 있다. 그러나 자식이 실제로 시작됐다는 사실과 이후 결과를 찾을 식별자는 필요하다. 사용자 응답에 “모든 문서 처리 완료”라고 표시해서는 안 된다.

## 부모를 먼저 끝내 보는 실험

대표 실패는 자식의 변환 Activity를 지연시키고 부모를 먼저 종료하는 것이다. 기본 정책과 자식을 유지하는 정책을 각각 적용해 자식 상태와 외부 예약 상태를 비교한다. 정책 이름만 확인하지 말고 자식의 이력에 어떤 종료가 남는지 본다.

다음으로 자식 시작 확인을 생략한 경우를 비교한다. 항상 실패하도록 만들기 어렵다면 시작·종료 순서를 통제할 수 있는 테스트 환경을 사용한다. 한 번 자식이 우연히 시작됐다는 사실로 시작 확인이 불필요하다고 결론 내리지 않는다.

실험에서는 부모 ID, 자식 ID, 시작 확인 시각, 부모 종료 상태, 자식 최종 상태, 예약 원장 상태를 함께 남긴다. 부모 목록 한 줄만 보면 자식이 계속 실행 중인지, 중단돼 정리가 필요한지 알 수 없다.

## 독립 실행의 비용도 선택에 넣는다

자식 Workflow는 이력을 나누는 데 도움이 될 수 있지만 무한히 많이 만들어도 된다는 뜻은 아니다. 부모에서 자식 시작을 대량 요청하면 부모 이력과 요청 처리에도 부담이 생긴다. SDK·Service의 한계와 실제 처리량은 별도 측정이 필요하다.

처음에는 하나의 Workflow와 Activities로 업무 조건을 이해하고, 개별 실행의 독립성이 필요해졌을 때 Child Workflow를 추가하는 편이 설계 이유를 설명하기 쉽다. 분리 전후 코드 줄 수보다 실패·취소·결과 조회의 책임이 명확해졌는지를 평가한다.

**확인 질문:** 부모가 Completed인데 자식이 Terminated라면 모순일까? 자식을 부모와 독립적으로 유지할 때 결과와 실패를 추적할 책임은 어디에 둘까?

## 부모 종료 정책과 취소 전파는 별개다

Parent Close Policy의 기본값은 Terminate다. ABANDON을 지정해도 부모 CancellationScope의 취소 전파까지 막는 것은 아니다. 부모 Cancel을 전달하지 않을 의도라면 ChildWorkflowCancellationType도 별도로 선택해야 한다. 부모 정상 반환·Cancel·Terminate·Continue-As-New를 서로 다른 실험 조건으로 나눈다.

비동기 Child 호출을 만든 뒤 바로 부모가 반환하면 자식 시작이 확정되기 전에 종료될 수 있다. 자식을 독립적으로 남기는 경로에서는 `Workflow.getWorkflowExecution(child).get()`으로 **시작 확인**을 기다린다. 자식 결과 전체를 기다리는 것과는 다르다. 자식 종료 후에도 이미 시작된 Activity의 외부 효과는 따로 확인한다.

Java SDK 1.40.0·CLI 1.9.1·Server 1.32.0의 가상 Child 재현에서는 ABANDON 부모가 자식 결과를 기다릴 때 Cancel이 자식까지 전달됐지만, 별도 대기 중 곧바로 닫힐 때 자식이 Running으로 남았다. 부모에 취소 명령이 기록된 것과 자식 취소 완료는 다르다. 취소 완료가 필요하면 부모가 닫히기 전에 확인하고, 독립 자식은 별도 감시 책임을 둔다.

같은 재현에서 기본 Parent Close Policy는 정상 반환·Continue-As-New 뒤 자식을 Terminated로 만들었다. 시작 확인 없이 바로 부모가 끝난 경우에는 자식이 만들어지지 않았다. 메모리 테스트 서버와 실제 개발 서버의 결과가 달랐으므로 개발 서버 결과를 따로 확인했다. 이는 가상 재현 결과이며 이 글의 문서 처리 전체 업무를 검증한 것은 아니다. [Java Child](https://docs.temporal.io/develop/java/workflows/child-workflows), [Child 취소 옵션](https://github.com/temporalio/sdk-java/blob/v1.40.0/temporal-sdk/src/main/java/io/temporal/workflow/ChildWorkflowCancellationType.java).

## 참고 자료

- [Java Child Workflow와 Parent Close Policy](https://docs.temporal.io/develop/java/workflows/child-workflows)
- [Child Workflow 사용 판단](https://docs.temporal.io/child-workflows)
- [Java 취소와 Terminate](https://docs.temporal.io/develop/java/workflows/cancellation)
