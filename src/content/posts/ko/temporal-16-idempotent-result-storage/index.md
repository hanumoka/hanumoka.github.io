---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "저장 성공 뒤 재시도돼도 한 번만 반영하려면"
key: "temporal-16-idempotent-result-storage"
description: "문서 변환 결과를 DB에 저장하는 Activity가 있다고 하자."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 16
readingMinutes: 5
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

문서 변환 결과를 DB에 저장하는 Activity가 있다고 하자. DB commit은 성공했지만 그 직후 Worker가 종료됐다. Service에는 Activity 완료가 기록되지 않았다. 이 상태에서 재시도가 일어나면 저장 코드는 다시 실행될 수 있다. Temporal이 Workflow를 복구한다는 사실만으로 외부 DB 변경이 한 번만 반영되는 것은 아니다.

이 문제의 핵심은 실패 응답과 외부 효과의 부재가 같은 뜻이 아니라는 점이다. 호출자는 결과를 받지 못했을 뿐이고, 상대 시스템에서는 이미 일을 끝냈을 수 있다. 멱등성은 이 불확실성을 반복 호출로 다룰 수 있게 하는 설계다.

## 메서드가 한 번 호출되는 것을 목표로 삼지 않는다

실행 환경에서 요청 유실과 응답 유실을 항상 구별할 수는 없다. 재시도를 하지 않으면 성공 여부를 모르는 작업이 남고, 재시도하면 중복 효과가 생길 수 있다. 따라서 메서드 호출 횟수를 무조건 하나로 제한하기보다 같은 업무 요청을 여러 번 받아도 의도한 결과가 추가되지 않게 한다.

가상 문서 처리에서는 `documentId + conversionVersion`을 결과 저장의 업무 키 후보로 삼을 수 있다. 같은 문서를 같은 규칙으로 변환한 결과는 하나만 저장한다는 계약이다. 새 규칙으로 다시 변환하는 작업은 다른 버전을 사용한다. 이 키의 의미는 예제의 정책이지 모든 시스템에 적용되는 정답은 아니다.

중요한 것은 재시도마다 새 UUID를 만들어서는 같은 요청을 알아볼 수 없다는 점이다. 업무 키는 필요한 범위에서 안정적이어야 한다. Activity 시도 사이의 중복만 막을지, Workflow 재시작이나 사용자 재요청까지 같은 업무로 볼지도 먼저 정한다.

## DB가 중복을 거부하게 한다

Activity 안에서 “같은 키가 있는지 조회하고 없으면 저장한다”는 코드만 쓰면 동시 요청이 둘 다 없다고 판단할 수 있다. DB의 UNIQUE 제약이나 같은 효과를 내는 원자적 저장 기능이 마지막 방어를 맡아야 한다.

```sql
-- 개념 스키마: 실제 타입과 결과 보존 정책은 별도 결정한다.
CREATE TABLE conversion_result (
    document_id VARCHAR(100) NOT NULL,
    conversion_version VARCHAR(40) NOT NULL,
    result_reference VARCHAR(300) NOT NULL,
    PRIMARY KEY (document_id, conversion_version)
);
```

중복 키가 들어왔을 때는 단순히 모든 오류를 무시하지 않는다. 기존 결과를 반환할 것인지, 입력 내용이 다르면 충돌로 거절할 것인지 정해야 한다. 같은 키에 서로 다른 입력을 허용하면 중복 방지 때문에 오히려 잘못된 결과를 정상으로 돌려줄 수 있다.

결과 저장과 처리 완료 표시를 별도 테이블에 둔다면 두 기록을 같은 로컬 DB 트랜잭션으로 묶는지도 확인한다. 완료 표시만 먼저 남고 결과가 없는 상태, 결과만 있고 완료 표시가 없는 상태를 각각 어떻게 처리할지 결정해야 한다.

## 성공 직후 실패를 넣어 차이를 본다

실험은 재시도를 짧고 유한하게 제한한 개인 DB에서 수행한다. 먼저 결과 저장 직후 의도적으로 예외를 던져 중복 행이 만들어지는 단순 구현을 관찰한다. 그다음 업무 키 제약을 넣고 같은 실패를 반복한다. 예상은 Activity 시도는 여러 번이어도 업무 결과는 계약한 수만 남는 것이다.

이 실험을 “실제 네트워크 응답 유실을 재현했다”고 과장하지 않는다. 저장 성공과 Activity 실패 판단이 함께 존재할 수 있는 경계를 시험한 것이다. 이후 필요하면 Worker 프로세스 종료나 응답 전달 지연을 별도 실험으로 추가한다.

증거는 Activity 시도 번호, DB 저장 시각, 키별 결과 건수, 반환한 기존 결과다. Workflow가 Completed라는 사실만 보면 잘못된 중복 저장이 있었는지 알 수 없다. 반대로 로그에 재시도가 여러 번 보인다고 곧바로 업무 결과가 중복됐다고 말할 수도 없다.

## Workflow ID만 같게 하면 해결될까

Workflow ID의 중복 시작 정책과 외부 DB 저장의 멱등성은 다른 문제다. 같은 Workflow가 실행 중이어도 그 안의 Activity는 재시도될 수 있다. Workflow 시작을 한 번으로 제한하는 것은 DB 저장 함수의 반복 실행을 막는 약속이 아니다.

공식 문서는 Run ID와 Activity ID를 조합한 키를 같은 Activity 재시도 범위에서 사용할 수 있다고 설명한다. 그러나 새 Run이나 업무 재요청을 같은 효과로 묶어야 한다면 그 범위를 넘어서는 업무 식별자가 필요할 수 있다. 키 선택 전에 중복으로 간주할 범위를 문장으로 적는 이유다.

허용량 예약과 확정·취소에도 같은 질문을 적용한다. 예약 요청이 두 번 오면 같은 예약을 돌려주는지, 확정된 예약의 재확정은 무엇을 반환하는지, 취소된 예약을 다시 취소해도 안전한지 정의한다. “모두 멱등”이라는 한 줄 대신 각 상태에서의 응답과 효과를 확인해야 한다.

**확인 질문:** 동일한 업무 키로 다른 문서 내용이 들어오면 어떤 응답이 맞을까? Workflow를 한 번만 시작했는데도 DB 멱등성이 필요한 이유는 무엇일까?

## 참고 자료

- [Activity 정의와 멱등성](https://docs.temporal.io/activity-definition)
- [Java Activity 재시도 설정](https://docs.temporal.io/develop/java/activities/timeouts)
- [Workflow 이력과 결정성](https://docs.temporal.io/workflow-definition)
