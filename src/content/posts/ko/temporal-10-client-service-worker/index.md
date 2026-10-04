---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "Client·Service·Worker는 어디서 실행되는가"
key: "temporal-10-client-service-worker"
description: "Client의 시작 요청, Service의 이력 관리, Worker의 코드 실행을 구별하고 큐와 poller로 대기 원인을 찾는다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 10
readingMinutes: 7
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

문서 처리 요청을 Temporal에 보냈다고 해서 Temporal Service가 문서를 변환하는 것은 아니다. 우리가 작성한 Java 코드는 Worker 프로세스에서 실행된다. Service는 실행 상태와 이력을 관리하고, Worker가 다음 작업을 가져갈 수 있게 한다. 이 구분을 먼저 이해해야 “서버는 정상인데 왜 문서가 처리되지 않을까?”라는 질문에 답할 수 있다.

이 글은 가상의 문서 처리 요청을 사용한다. 처리 허용량을 예약하고, 문서를 변환하고, 결과를 저장한 뒤 예약을 확정하는 흐름이다. 아직 실행 결과를 소개하는 글은 아니다. 각 구성 요소가 어디에 있고 어떤 책임을 갖는지 살펴보는 초안이다.

## 시작 요청과 코드 실행은 다른 곳에서 일어난다

Client는 Temporal에 요청하는 SDK 사용 코드다. 웹 API 안에 있을 수도 있고, 명령줄 프로그램이나 다른 서비스 안에 있을 수도 있다. 문서 처리 API가 Client를 사용해 Workflow 시작을 요청하면 Service는 요청을 처리하고 실행을 관리한다. 시작 요청이 수락됐다는 사실과 문서 처리가 완료됐다는 사실은 다르다.

Workflow는 전체 순서와 분기를 정의한다. “허용량 예약이 성공하면 변환하고, 저장이 끝나면 확정한다”는 결정이 여기에 들어간다. 이 Java Workflow 코드도 Worker에서 실행된다. Service 안에 우리가 만든 JAR를 넣고 실행시키는 구조가 아니다.

Activity는 실제 외부 작업을 수행한다. 허용량 서비스 호출, 파일 읽기, 변환 API 호출, 결과 DB 저장처럼 외부 시스템과 상호작용하는 코드를 둔다. Workflow Worker와 Activity Worker는 역할을 구별하는 이름이다. 하나의 프로세스가 두 역할을 모두 수행할 수도 있고, 다른 프로세스로 나눌 수도 있다.

## Task Queue는 코드를 보내는 통로가 아니다

Worker는 특정 Namespace의 Task Queue에서 작업을 가져온다. Task Queue 이름은 Worker와 실행 요청을 연결하는 설정이다. Service가 작업과 함께 Java 구현체를 내려보내는 것이 아니다. Worker는 이미 Workflow나 Activity 구현을 등록한 상태여야 한다.

같은 큐를 본다고 모든 Worker가 임의의 코드를 실행할 수 있는 것도 아니다. 해당 작업의 타입과 호환되는 구현이 필요하다. 큐 이름은 맞는데 구현 등록이 빠진 경우와, 구현은 있는데 다른 큐를 보고 있는 경우는 모두 처리 실패의 원인이 될 수 있다. 그러나 진단할 지점은 다르다.

문서 한 건의 정상 흐름을 단순화하면 다음과 같다.

1. API의 Client가 Service에 Workflow 시작을 요청한다.
2. Workflow Worker가 Workflow Task를 받아 다음 Activity를 결정한다.
3. Activity Worker가 허용량 예약을 실행하고 결과를 Service에 보고한다.
4. Workflow Worker가 그 결과를 사용해 변환·저장·확정을 차례로 진행한다.
5. Client는 필요에 따라 완료 결과를 기다리거나 나중에 조회한다.

이 과정에서 API가 계속 연결돼 있어야만 Workflow가 진행하는 것은 아니다. 실행 수명과 HTTP 요청 수명을 분리해서 설계할 수 있다. 다만 API 응답에 무엇을 담을지, 사용자가 어떤 식별자로 상태를 확인할지는 애플리케이션이 정해야 한다.

## Worker가 없으면 무엇이 보일까

가장 작은 실패 실험은 Service를 유지하고 Worker만 끄는 것이다. 새로운 문서 처리 요청을 시작한 뒤 실행 목록과 이력을 살펴본다. 예상은 시작 요청이 받아들여졌어도 업무 코드는 진행하지 못한다는 것이다. Worker를 다시 켰을 때 같은 요청이 진행되는지도 함께 확인한다.

이 실험에서 “실행이 Running이다”를 “변환이 수행되고 있다”로 해석하면 안 된다. 실행 상태는 완료되지 않았다는 뜻일 수 있으며, 현재 Worker가 실제 작업을 수행 중인지까지 설명하지 않는다. 처리 지연을 진단하려면 Worker의 polling, 작업 등록, 큐 이름, Namespace를 함께 봐야 한다.

실패 원인을 찾을 때는 연결 주소만 바꾸며 재시도하지 말고 순서를 정한다. 먼저 Client와 Worker가 같은 Service·Namespace를 사용하는지 확인한다. 다음으로 시작 요청의 Task Queue와 Worker의 큐가 일치하는지 확인한다. 마지막으로 Worker가 필요한 Workflow와 Activity 타입을 등록했고 실제로 동작하는지 확인한다.

## 한 프로세스로 시작해도 책임은 나눠서 본다

학습 초기에는 Workflow와 Activity를 하나의 Worker 프로세스에 등록하는 편이 이해하기 쉽다. 그렇더라도 코드의 책임은 분리해 둔다. 나중에 변환 작업만 별도 프로세스로 옮겨도 Workflow의 순서와 외부 작업의 경계를 유지할 수 있기 때문이다.

반대로 프로세스를 많이 나눈다고 곧바로 안정성이 높아지는 것은 아니다. 각 프로세스의 배포, 등록, 네트워크, 계약 호환성을 관리해야 한다. 구조 그림에는 프로세스 경계와 코드 역할을 구별해 표시하는 것이 좋다. Workflow라는 코드가 있다는 이유로 별도의 “Workflow 서버”가 필수라고 결론 내리지 않는다.

실습 전에는 Java SDK와 CLI 버전, 로컬 개발 서버의 실행 방식, 사용할 Namespace와 큐 이름을 기록한다. 다른 시스템의 운영 설정을 그대로 가져올 필요는 없다. 개인 예제에서 역할을 설명할 수 있을 정도의 최소 환경이면 충분하다.

**확인 질문:** Worker를 모두 껐는데 시작 요청이 성공했다면 무엇이 성공한 것일까? Service의 health 응답만 보고 문서 처리 기능이 정상이라고 판단할 수 있을까?

## 개발 서버와 관찰 명령

`temporal server start-dev`는 로컬 학습용 Service다. 운영 배포 구성이 아니며 기본 임시 저장과 파일 DB 지정 여부를 구별한다. 별도 터미널에서 다음처럼 시작한다. 기존 DB 파일을 덮어쓰지 않는 실습 폴더를 사용한다.

```shell
temporal server start-dev --ip 127.0.0.1 --db-filename temporal-lab.db
temporal workflow describe --workflow-id first-document
temporal workflow show --workflow-id first-document
temporal task-queue describe --task-queue document-workflow --task-queue-type workflow
temporal task-queue describe --task-queue document-workflow --task-queue-type activity
```

**Namespace**는 실행과 Task Queue 등을 구분하는 논리 영역이다. 위 예제는 기본 `default`를 사용한다. **poller**는 Task를 받아 가려고 Service에 요청하는 Worker의 동작·주체다. **Workflow Task**는 이력을 바탕으로 다음 명령을 결정할 기회이고, **Activity Task**는 외부 작업 코드를 실행할 요청이다.

Worker 부재 시험에서는 충분한 대기 시간을 주고 Worker만 중단한다. Describe의 실행 상태·Pending Activities와 두 종류의 poller를 비교한다. 큐 이름이 틀려도 큐가 자동으로 생겨 연결 오류 없이 기다릴 수 있다. 같은 종류의 Task Queue를 받는 Worker에는 그 큐의 타입을 일관되게 등록한다. 각자의 일부 Activity만 등록하면 타입에 따라 임의 Worker에서 실패할 수 있다. [Task Queues](https://docs.temporal.io/task-queue), [CLI](https://docs.temporal.io/cli/server#start-dev).

## 참고 자료

- [Java SDK 개발 안내](https://docs.temporal.io/develop/java)
- [Java 첫 애플리케이션](https://learn.temporal.io/getting_started/java/hello_world_in_java/)
- [Activity 정의와 Worker 등록](https://docs.temporal.io/activity-definition)
