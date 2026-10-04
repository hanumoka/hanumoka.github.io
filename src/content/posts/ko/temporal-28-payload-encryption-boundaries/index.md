---
pubDatetime: 2026-10-04T09:00:00+09:00
title: "암호화하면 History의 무엇이 가려질까"
key: "temporal-28-payload-encryption-boundaries"
description: "Codec의 payload와 실패 속성 보호 범위를 구별하고 평문 메타데이터·로그를 확인한다."
tags: ["temporal", "distributed-systems"]
kind: "concept"
series: "temporal"
seriesOrder: 28
readingMinutes: 6
sourceNote: "docs/research/2026-10-04-temporal-series-plan.md"
draft: true
---

문서 본문이 Activity 입력과 결과에 들어간다면 실행 이력에서 어떤 데이터가 보이는지 확인해야 한다. Payload Codec으로 암호화하면 보호할 수 있는 영역이 생긴다. 그러나 설정 하나로 Workflow ID, 검색 속성, 애플리케이션 로그까지 모두 가려지는 것은 아니다.

이 글의 질문은 암호화 알고리즘을 직접 만드는 방법이 아니다. 데이터가 어떤 경로로 저장되고 어느 항목이 암호화 대상인지 구별하는 것이다. 실습에는 생성한 문서와 가짜 식별자만 사용하고, 실제 민감정보로 보호 여부를 시험할 필요는 없다.

## 직렬화와 암호화는 다르다

Java 객체를 네트워크로 보내려면 바이트 형태로 바꿔야 한다. Data Converter는 이 변환 과정에 관여한다. 기본 직렬화가 JSON으로 값을 표현한다고 해서 그 내용이 암호화되는 것은 아니다. 읽을 수 있는 JSON을 저장하는 것과 암호문을 저장하는 것은 다른 보호 수준이다.

Payload Codec은 직렬화된 payload를 암호화하거나 압축하는 계층으로 사용할 수 있다. Java에서는 CodecDataConverter에 사용자 정의 PayloadCodec을 연결하는 방식이 안내된다. 실제 암호화 구현과 키 관리는 별도 책임이며 예제의 고정 키를 운영 설정으로 복사하지 않는다.

Client가 입력을 인코딩하고 Worker가 읽을 수 있어야 하므로 양쪽 설정이 호환돼야 한다. 한쪽에만 Codec을 적용하면 실행이 시작됐더라도 데이터를 해석하지 못할 수 있다. 어떤 payload가 어느 키와 형식으로 만들어졌는지 해독할 수 있는 정보도 필요하다.

## 검색할 정보는 암호화 payload와 구분된다

Search Attributes는 실행을 검색하기 위한 메타데이터다. 공식 문서는 이 값들이 암호화되지 않으므로 민감정보나 개인정보를 이름과 값에 넣지 말라고 안내한다. 본문을 암호화한 뒤 검색을 편하게 하려고 동일한 본문 일부를 검색 속성에 복사하면 보호 의도를 스스로 깨뜨릴 수 있다.

Workflow ID도 사용자 정의 식별자이며 Payload Codec의 처리 대상이 아니다. 문서 제목, 사용자 이메일, 비밀 값을 ID에 직접 넣지 않는다. 실습에서는 의미를 드러내지 않는 가짜 업무 식별자를 사용하고, 상세 정보는 권한 있는 애플리케이션 조회에서 연결하도록 설계할 수 있다.

로그는 또 다른 경로다. Worker가 복호화한 문서를 통째로 로그에 남기면 History의 payload를 암호화해도 평문이 로그 저장소에 남는다. 예외 메시지, HTTP 요청 로그, 테스트 출력에도 같은 질문을 적용한다. 특정 암호화 기능의 적용 범위를 전체 시스템의 보장으로 확대하지 않는다.

## UI에서 평문이 보인다고 암호화 실패일까

암호화된 payload를 UI나 CLI에서 읽기 위해 Codec Server를 사용할 수 있다. 이것은 저장된 암호문을 권한 있는 사용자에게 해독해 보여주는 별도 서비스다. 따라서 UI에 평문이 보이는지만으로 저장 상태가 평문인지 판단할 수는 없다.

반대로 Codec Server에 접근할 수 있는 주체를 통제하지 않으면 암호화된 이력을 가진 사람이 복호화 서비스를 통해 내용을 읽을 수 있다. Codec Server의 인증·접근 권한·네트워크를 자체적으로 운영해야 한다. “키가 Service에 없으니 끝났다”로 결론 내리지 않는다.

실습에서는 Codec 연결 없이 보는 저장 payload와, 허용된 복호화 경로를 통해 보는 내용을 구별한다. 공개 자료에는 실제 키나 인증 설정을 넣지 않고, 가짜 데이터가 어느 화면에서 보였는지와 조건만 기록한다.

## 한쪽 설정을 빼서 실패를 확인한다

대표 실패 실험은 Client에는 Codec을 적용하고 Worker에는 적용하지 않은 구성이다. 입력 해석이 어떻게 실패하는지 확인한 다음 설정을 맞춰 비교한다. 이어 평문 검색 속성에 가짜 표식 하나를 넣어 payload 암호화와 별개로 검색되는지 관찰한다.

이 실험은 “암호문이 보였다”에서 끝나지 않는다. Workflow 입력, Activity 입력·결과, 식별자, 검색 속성, 애플리케이션 로그를 각각 확인한다. 모든 항목을 같은 방식으로 보호한다고 가정하지 말고 실제 적용 범위를 표로 남긴다.

키를 교체하는 상황도 생각해야 한다. 새 입력은 새 키로 암호화하더라도 진행 중이거나 보존된 실행은 이전 키로 만든 payload를 읽어야 할 수 있다. 과거 키를 너무 빨리 없애면 이력이 남아 있어도 재생과 조회가 막힐 수 있다. 키 보존 기간과 데이터 보존·복구 정책을 함께 검토한다.

## 필요한 데이터만 보내는 설계가 먼저다

암호화는 불필요한 데이터를 계속 전송해도 된다는 허가가 아니다. 이전 글처럼 ID와 불변 버전만으로 충분한 경우에는 본문 전달을 줄일 수 있다. 다만 ID 자체가 민감한 의미를 드러내지 않는지도 확인한다.

실행 이력은 장애 분석과 복구에 중요하다. 보호를 강화하면서도 필요한 사람이 원인을 진단할 수 있는 절차가 있어야 한다. 민감한 본문 대신 오류 분류와 안전한 식별자, 처리 단계만으로도 설명 가능한 로그를 설계하면 복구와 보호를 함께 다루기 쉬워진다.

**확인 질문:** payload를 암호화했는데 이메일을 Workflow ID에 넣으면 무엇이 노출될까? 이전 키를 삭제해도 되는 시점은 새 키로 전환한 시점과 왜 다를까?

## 실패 메시지와 스택도 따로 설정한다

Java SDK **1.40.0의 2인자 `CodecDataConverter` 생성자는 실패의 message와 stackTrace를 기본 평문 필드로 남긴다.** 실패 속성까지 payload로 옮기려면 세 번째 인자를 `true`로 지정한다.

```java
DataConverter converter = new CodecDataConverter(
    DefaultDataConverter.newDefaultInstance(),
    List.of(encryptingCodec),
    true // failure message·stackTrace를 Codec이 처리할 payload로 옮긴다.
);
```

`encryptingCodec`은 인증된 암호화와 키 관리를 구현한 PayloadCodec이다. 이 옵션 자체가 암호화 알고리즘은 아니며 빈 Codec 목록으로는 암호화되지 않는다. [고정 SDK 소스](https://github.com/temporalio/sdk-java/blob/v1.40.0/temporal-sdk/src/main/java/io/temporal/common/converter/CodecDataConverter.java).

실패 **유형**, Workflow·Activity·Signal 이름, Task Queue, Workflow ID, Search Attributes와 Codec이 평문 metadata에 넣은 key ID는 이 설정의 보호 대상이 아니다. SDK 경고 로그와 애플리케이션 로그도 별도로 점검한다. 안전한 가짜 표식으로 2인자/3인자 변환 결과와 원시 History의 failure를 비교하고 message·stackTrace·encodedAttributes·type을 각각 관찰한다. 새 Search Attribute를 쓰는 실험은 30편의 사전 등록을 먼저 수행한다.

## 참고 자료

- [Java Payload 암호화와 Codec Server](https://docs.temporal.io/develop/java/best-practices/data-handling/data-encryption)
- [Search Attributes의 보호 범위](https://docs.temporal.io/search-attribute)
- [Workflow ID에 넣지 말아야 할 데이터](https://docs.temporal.io/workflow-execution/workflowid-runid)
- [Java Data Converter](https://docs.temporal.io/develop/java/best-practices/data-handling)
