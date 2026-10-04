---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "코드 변경이 기존 History와 맞는지 검사한다"
key: "temporal-36-replay-compatible-workflow-changes"
description: "기존 History를 새 코드로 재생하고 getVersion 분기로 호환성을 검증한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 36
readingMinutes: 6
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

새 코드로 시작한 문서 처리가 성공해도, 이미 실행 중이던 문서 처리가 그 코드를 안전하게 사용할 수 있다는 뜻은 아니다. Temporal Workflow는 Event History를 바탕으로 코드를 재생한다. 과거 기록과 새 코드가 만드는 결정의 순서가 맞지 않으면 배포 후에야 문제가 드러날 수 있다. 이번 초안은 replay 검사를 배포 전 질문으로 옮기는 방법을 다룬다.

예제의 기존 순서는 허용량 예약, 가상 변환, 결과 저장, 예약 확정이다. 여기에 변환 결과를 검증하는 Activity를 저장 직전에 추가한다고 가정하자. 아직 실행하지 않은 변경 실험이며, 아래 코드는 개념을 보여 주는 일부다. 전체 실행·오류 처리 코드는 선택 SDK와 예제에 맞춰 준비해야 한다.

## 새 실행의 테스트만으로 부족한 이유

새 Workflow는 추가된 검증 Activity가 있는 순서로 History를 만든다. 따라서 새 코드로 시작하고 끝내는 테스트는 자연스럽게 성공할 수 있다. 하지만 기존 History에는 검증 없이 곧바로 결과 저장을 요청한 기록이 있을 수 있다. 새 코드가 그 지점에서 검증 Activity를 먼저 예약하려 하면 과거 결정과 달라진다.

이때 문제는 같은 입력에서 최종 문자열이 같은지에만 있지 않다. Workflow가 Service에 내보내는 결정과 기록된 이벤트의 관계가 중요하다. 코드를 보기 좋게 정리했다고 생각한 변경도 Activity 호출 순서나 타이머, Child Workflow 생성에 영향을 주면 확인 대상이다.

반대로 모든 Java 문장 변경이 위험하다는 뜻도 아니다. 기록된 결정을 바꾸지 않는 정리와 결정 순서를 바꾸는 변경을 구분해야 한다. 이를 사람의 추측만으로 판단하지 않고 실제로 확보한 History를 새 구현으로 재생해 보는 것이 replay 검사다.

## replay는 외부 작업의 재실행 시험이 아니다

replay에서는 완료된 Activity의 결과를 History에서 읽어 Workflow 상태를 복원한다. 따라서 replay 테스트를 돌렸다고 예약 API와 결과 저장소까지 다시 통합 검증한 것은 아니다. 외부 계약과 멱등성은 별도 테스트가 필요하다.

검사의 목적은 과거 실행 기록을 현재 Workflow 구현이 이해할 수 있는지 확인하는 것이다. Java의 테스트 도구는 `WorkflowReplayer`를 제공한다. 테스트용 History를 파일로 보관할 때는 생성 문서만 사용하고 payload에 자격증명이나 실제 데이터가 섞이지 않게 한다. 암호화된 payload가 있다면 재생에 필요한 데이터 변환 설정도 검토해야 한다.

History는 성공 사례 하나만 고르면 부족하다. 예약 직후, 가상 변환 완료 뒤, 결과 저장 뒤, 보상 경로, 메시지를 받은 상태처럼 변경 지점을 통과한 사례를 선택한다. 보관할 표본의 수보다 변경의 영향을 받는 경로를 포함하는지가 중요하다.

## 변경 지점에 버전을 기록한다

같은 Worker 코드가 기존 실행과 새 실행을 모두 처리해야 한다면 patching을 사용할 수 있다. Java의 `Workflow.getVersion`은 변경 식별자에 대한 버전을 History와 연계하여 분기할 수 있게 한다. 예를 들어 다음 부분을 생각할 수 있다.

```java
int version = Workflow.getVersion(
    "validate-before-store", Workflow.DEFAULT_VERSION, 1);
if (version != Workflow.DEFAULT_VERSION) {
    activities.validate(convertedDocumentId);
}
activities.store(convertedDocumentId);
```

이 코드는 기존 기록과 새 경로를 나누는 의도를 표현한다. `DEFAULT_VERSION`이라는 값 자체를 업무 버전으로 해석하지 않는다. 어느 History가 어떤 분기로 재생되는지와 새 실행에 어떤 marker가 기록되는지는 선택 SDK로 검증해야 한다.

변경 식별자는 같은 변경을 추적하는 계약처럼 다룬다. 단순히 이름을 보기 좋게 바꾸거나 다른 변경에 재사용하면 과거 기록과 연결된 의미를 훼손할 수 있다. 분기를 제거할 때도 “새 배포가 안정적이다”만으로 결정하지 않는다. 이전 분기를 필요로 하는 실행과 보관된 이력의 재생 요구가 남아 있는지 확인한다.

## 실패를 먼저 만들고 수정한다

실험은 다음 순서로 진행할 수 있다.

1. 기존 코드로 생성 문서의 실행 History를 확보한다.
2. 저장 전 검증 Activity를 분기 없이 추가한다.
3. 변경 지점을 이미 지난 History를 새 코드로 replay한다.
4. 호환 오류가 확인되는지 기록한다.
5. 변경 식별자와 버전 분기를 추가하고 같은 History를 다시 검사한다.
6. 새 실행에서는 검증 단계가 실제 포함되는지 별도 테스트한다.

예상 결과는 단순 삽입에서 결정 불일치를 발견하고, 적절한 분기로 기존 경로를 유지할 수 있다는 것이다. 실제 오류와 수정 성공은 실행 후에만 보고할 수 있다. 테스트가 통과하면 어떤 History를 검사했는지도 함께 남겨야 한다.

대표 실패는 분기를 추가한 뒤 새 실행 테스트만 남기고 과거 replay 테스트를 지우는 것이다. 이후 누군가 오래된 분기가 불필요해 보인다며 제거하면 같은 문제가 돌아올 수 있다. 과거 경로가 언제까지 필요한지와 제거 판단 근거를 코드 변경 기록에 남기는 편이 낫다.

## replay 통과의 범위를 넘겨 읽지 않는다

표본 History의 replay가 통과해도 모든 미래 실행이 안전하다는 증명은 아니다. Activity 입력·출력 schema를 바꾸거나 외부 저장소 계약을 바꾸면 다른 문제가 생길 수 있다. 예약 확정 전에 결과가 존재해야 한다는 업무 조건도 replay만으로 검증하지 않는다.

배포 방식에 따라 과거 실행을 이전 Worker 버전에 계속 맡기는 선택도 있다. 이것이 다음 글의 Worker Versioning이다. patching과 Worker Versioning은 문제를 다루는 위치가 다르며, 둘 중 하나의 이름만 도입했다고 테스트 책임이 없어지는 것은 아니다.

검증 질문은 “새 Workflow 테스트는 성공하는데 과거 History replay가 실패할 수 있는 이유는 무엇일까?”다. 또 “replay가 통과했다면 결과 저장 API의 중복 처리까지 안전하다고 말할 수 있을까?”를 생각해 보자. 이 구분이 코드 호환성과 업무 정확성을 함께 검증하는 출발점이다.

## 공식 자료

- [Java Workflow versioning과 getVersion](https://docs.temporal.io/develop/java/workflows/versioning)
- [Java 테스트와 replay](https://docs.temporal.io/develop/java/best-practices/testing-suite)
- [Workflow 결정성](https://docs.temporal.io/workflow-definition)
