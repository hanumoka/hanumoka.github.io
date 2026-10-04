---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "정상 health인데 왜 처리가 멈춰 있을까"
key: "temporal-33-healthy-service-stalled-workflows"
description: "Service health가 정상이어도 멈출 수 있는 실행을 SDK·Service·업무 지표로 진단한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 33
readingMinutes: 6
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

Temporal Service의 health 확인은 정상인데 문서 처리가 끝나지 않는다. 이것은 모순이 아니다. API를 받을 수 있다는 사실과 작업을 가져가는 Worker가 있다는 사실, 그 Worker가 외부 저장소에 결과를 쓸 수 있다는 사실은 서로 다르기 때문이다. 이번 초안은 “정상”이라는 표시 하나에서 벗어나 실행이 어디에서 기다리는지 찾는 방법을 다룬다.

가상 예제는 허용량 예약, 문서 변환, 결과 저장, 예약 확정 순서다. 사용자에게 중요한 성공은 마지막 예약 확정과 결과의 존재다. health는 그 성공에 필요한 일부 구성요소를 살펴보는 신호다. 아래 실험은 아직 수행하지 않았으며 예상 관찰과 검증 방법을 제안한다.

## health가 답하는 질문을 먼저 적는다

Frontend의 health 확인은 연결과 서비스 준비 상태를 확인하는 데 쓰인다. 그러나 애플리케이션의 모든 Task Queue에 Worker가 붙어 있는지, 외부 예약 API가 올바른 결과를 주는지까지 대신 확인하지는 않는다. 같은 Service를 쓰는 다른 애플리케이션이 정상이라고 특정 문서 실행도 정상이라고 판단할 수도 없다.

따라서 운영 화면을 만들 때부터 질문을 나눈다. “Service API를 호출할 수 있는가”, “해당 작업을 가져가는 Worker가 있는가”, “받은 작업은 끝나는가”, “업무 결과는 올바른가”다. 이를 한 개의 녹색 표시로 합치면 장애 위치를 찾기 어렵다.

실행 중 상태도 실패를 뜻하지 않는다. Workflow는 정상적으로 승인이나 타이머를 기다릴 수 있다. 반대로 Running이라는 상태만으로 진전이 있다고 보장할 수 없다. 마지막 이벤트와 예정된 다음 동작을 알아야 의도한 대기인지 멈춤인지 구분할 수 있다.

## Service 지표와 SDK 지표를 함께 수집한다

Service 지표는 API 요청, History와 Matching의 처리, persistence 접근 등을 보여 준다. SDK 지표는 Worker가 작업을 받아 처리하는 상황을 보여 준다. 둘은 배출 위치부터 다르므로 Server의 지표 endpoint만 연결해 놓고 Worker 상태까지 관측한다고 생각하면 안 된다.

Java에서는 SDK 지표를 Micrometer와 연동하는 방식이 공식 문서에 안내돼 있다. Prometheus가 Service와 Java Worker의 지표를 각각 수집하고 Grafana가 이를 표시하도록 구성할 수 있다. 중요한 것은 도구 이름보다 두 종류의 지표가 실제로 들어오는지 확인하는 일이다.

지표명과 단위는 선택 SDK와 Server에서 확인해야 한다. 같은 지연이라는 이름이 있어도 사용자의 Activity가 기다린 시간과 History 내부 작업이 기다린 시간은 대상이 다르다. 설명에는 무엇이 시작되고 무엇이 끝날 때까지 재는지 반드시 적는다.

## Worker만 중단하는 작은 실험

이번에는 한 번에 한 가지 실패만 만든다. 정상 실행을 먼저 확인하고, 가상 변환 Activity를 처리하는 SDK Worker를 중단한다. Service와 DB, 예약 API는 유지한다. 별도 Workflow Worker를 사용하는 구성이라면 어느 Worker를 중단했는지도 기록한다.

관찰 절차는 다음과 같다.

1. 정상 상태에서 문서 하나의 전체 처리 시간과 마지막 이벤트를 기록한다.
2. 대상 Worker를 중단한 뒤 같은 계약의 새 문서 처리를 시작한다.
3. Service health와 해당 Task Queue의 poller 정보를 각각 확인한다.
4. Event History에서 예정된 작업과 실제 시작 여부를 확인한다.
5. Worker를 복구하고 작업 대기와 완료 결과가 어떻게 바뀌는지 본다.

예상 결과는 Service health가 정상이어도 해당 작업을 수행할 Worker가 없으면 진행이 기다릴 수 있다는 것이다. 실제 재개 시간은 작업 종류와 Timeout, 재시도 정책, 재연결에 따라 달라진다. 중단 직후 모든 지표가 동시에 변할 것이라고 가정하지 않는다.

## 지표가 조용하다는 것도 해석이 필요하다

Worker가 완전히 종료되면 그 프로세스에서 나오는 SDK 지표도 끊긴다. 작업이 하나도 시작되지 않는 동안에는 완료된 작업을 바탕으로 한 지연 지표가 즉시 새 값을 내지 않을 수도 있다. 따라서 평균 지연이 낮다는 이유만으로 문제가 없다고 판단하면 안 된다.

수집 대상의 생존 여부, Task Queue의 대기 작업, 최근 poller, 실제 완료 건수를 함께 읽어야 한다. “오류가 없다”와 “아무것도 처리하지 않는다”를 구분하는 데 도움이 된다. 업무 관점에서는 일정 시간 안에 결과가 생성된 문서 수와 미완료 예약 수를 비교할 수 있다. 이 수치는 Temporal 내부 지표만으로 대신하지 않고 예제의 외부 원장에서 확인한다.

대표 실패는 Worker가 다른 Task Queue 이름을 기다리는 상황이다. 프로세스가 살아 있고 지표도 내며 Service에 연결돼도 요청한 작업은 가져오지 않을 수 있다. 이때 자원 부족을 먼저 의심하기보다 실행이 사용하는 Queue와 Worker 등록을 대조한다. 운영 기록에는 실제 내부 명칭 대신 역할을 나타내는 공개용 이름을 사용한다.

## 로그와 trace는 지표의 질문을 좁힌다

지표로 대기 시간이 늘었다는 사실을 찾았다면 특정 실행의 Event History와 로그로 범위를 좁힌다. Workflow ID와 Run ID는 실행을 찾는 데 유용하지만 모든 지표의 label로 붙이면 실행 수만큼 시계열이 늘어날 수 있다. 집계 지표와 실행별 진단 정보를 다른 방식으로 연결하는 편이 낫다.

Workflow 로그는 replay를 고려해야 한다. Java의 `Workflow.getLogger`처럼 재생 중 중복 로그를 다루는 방법을 사용한다. 일반 로그만 보고 예약 코드가 다시 읽혔으니 예약 API도 다시 호출됐다고 결론 내리면 replay와 Activity 재시도를 혼동할 수 있다.

trace도 별도 설정이 필요하다. OpenTelemetry Collector를 설치했다고 Client, Workflow, Activity의 호출 관계가 자동으로 모두 기록되지는 않는다. Java SDK의 interceptor와 context 전달 방식, 외부 HTTP 계측을 선택한 버전에 맞춰 확인해야 한다.

검증 질문은 “health는 정상이고 오류율도 낮은데 완료 건수가 0이라면 무엇을 더 봐야 할까?”다. 또 “Worker가 종료돼 지표가 사라진 상태와 부하가 없는 상태를 어떻게 구분할까?”를 생각해 보자. 이 질문에 답할 수 있는 관측 구성이 있어야 다음 글의 확장 실험도 해석할 수 있다.

## 공식 자료

- [Service와 SDK 지표 수집](https://docs.temporal.io/self-hosted-guide/monitoring)
- [Service 지표의 의미](https://docs.temporal.io/references/service-metrics)
- [Java 관측과 replay 로그](https://docs.temporal.io/develop/java/platform/observability)
