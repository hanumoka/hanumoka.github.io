---
title: 코틀린 스프링으로 기초적인 멀티모듈 프로젝트 생성하기
key: 2026-09-16-kotlin-spring-multimodule
description: 실행 모듈과 도메인 모듈을 나누고, Boot 플러그인은 실행 모듈에만 붙여, 빈 Kotlin·Spring Boot 멀티모듈 프로젝트를 만든다.
pubDatetime: 2026-09-16T17:00:00+09:00
kind: snippet
tags:
  - kotlin
  - spring-boot
  - gradle
  - multi-module
draft: true
---

이 글은 **빈 멀티모듈 프로젝트**를 만드는 순서다. 주문·재고 같은 업무 코드는 넣지 않는다.

끝까지 따라가면 셋이 된다.

1. Gradle 모듈이 셋이다. 실행 모듈 하나, 라이브러리 모듈 둘.
2. `./gradlew build`가 통과한다.
3. 프로세스가 하나 뜨고 HTTP 요청을 받는다.

실제 저장소는 [hanumoka-be](https://github.com/hanumoka/hanumoka-be)다. 이 글이 가리키는 코드는 `main` 커밋 [`a29f2a0`](https://github.com/hanumoka/hanumoka-be/tree/a29f2a0c67aa78412bc057069bffd376a5ce4c53)이다. 그 저장소에는 공통 빌드 설정을 `buildSrc`로 뺀 것과, 모듈 사이 의존 규칙 검사가 더 있다. **오늘은 그 둘을 만들지 않는다.** 모듈을 나누고 프로세스를 하나 띄우는 것까지만 한다.

## 목차

## 이 글에서 쓰는 말

- **모듈**: Gradle 하위 프로젝트 하나. `settings.gradle.kts`에 `include`로 등록하고, 각자 `build.gradle.kts`를 갖는다.
- **실행 모듈**: `main`이 있고 Boot 플러그인을 붙인 모듈. 프로세스가 여기서 뜬다.
- **라이브러리 모듈**: `main`이 없고 Boot 플러그인도 없다. 다른 모듈이 의존하는 jar만 낸다.
- **BOM**: 여러 라이브러리의 버전을 한 번에 정해 주는 목록. Spring Boot BOM을 가져오면 의존성마다 버전을 손으로 안 적어도 된다.

## 왜 모듈을 나누는가

한 저장소에 모듈이 여럿이어도, 지금은 프로세스 하나에서 돈다. 나중에 프로세스를 둘로 나눌 때 **빌드 파일에서 의존을 지울 수 있어야** 나뉜다.

도메인 모듈 하나가 `main`까지 가지면 이런 일이 생긴다.

1. 주문 모듈이 `main`을 갖는다.
2. 그 프로세스에서 재고까지 쓰려면 주문 모듈이 재고 모듈을 의존해야 한다.
3. 나중에 주문과 재고가 이벤트로만 말하게 바꿔도, 부팅 때문에 그 의존을 못 지운다.

`main`을 별도 모듈로 빼면, 프로세스를 가를 때 바뀌는 것은 실행 모듈이 의존하는 목록뿐이다. 도메인 코드는 그대로다.

그래서 오늘은 이렇게 만든다.

```text
프로젝트/
├── settings.gradle.kts
├── app/
│   └── app-monolith/     실행 모듈. main이 있다
└── service/
    ├── service-order/    라이브러리. 주문
    └── service-inventory 라이브러리. 재고
```

| 모듈        | Boot 플러그인 | `main` | 빌드 결과      |
| ----------- | ------------- | ------ | -------------- |
| `app/*`     | 적용          | 있음   | 실행 가능 jar  |
| `service/*` | 없음          | 없음   | 라이브러리 jar |

## 버전

이 글의 명령은 아래 버전으로 확인했다. `hanumoka-be` `a29f2a0`과 같다.

| 도구                 | 버전   |
| -------------------- | ------ |
| JDK                  | 25     |
| Kotlin               | 2.3.21 |
| Spring Boot          | 4.1.0  |
| Gradle               | 9.7.1  |
| foojay 툴체인 리졸버 | 1.0.0  |

## 1. Gradle 래퍼를 만든다

빈 폴더에서 래퍼를 만든다. Gradle이 이미 있는 기계에서 한 번만 하면 된다.

```shell
gradle wrapper --gradle-version 9.7.1
```

이후에는 `./gradlew`(Windows는 `gradlew.bat`)만 쓴다. 다른 기계에 Gradle을 미리 설치하지 않아도 된다.

## 2. 모듈 목록과 JDK 다운로드 저장소를 적는다

`settings.gradle.kts`다.

```kotlin
plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = "hanumoka-be"

include(
    ":app:app-monolith",
    ":service:service-order",
    ":service:service-inventory",
)
```

`include`에 없는 폴더는 모듈이 아니다. `platform/` 같은 폴더를 미리 만들어 두어도, 여기 없으면 빌드에 안 들어간다.

foojay 플러그인은 **JDK 25를 이 기계에 손으로 안 깔아도** Gradle이 툴체인을 받게 한다. 이 줄이 없으면 설치되지 않은 기계에서 빌드가 서지 않는다.

루트 `build.gradle.kts`는 비워 둔다. 공통 설정을 루트의 `subprojects { }`로 넣지 않는다. 한 프로젝트가 다른 프로젝트를 설정하면 모듈을 독립적으로 다루기 어려워진다. 공통 설정은 각 모듈이 플러그인을 **적용**하는 쪽으로 둔다.

## 3. 라이브러리 모듈을 만든다

`service/service-inventory/build.gradle.kts`다. Boot 플러그인이 없다.

```kotlin
plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    id("io.spring.dependency-management") version "1.1.7"
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

dependencyManagement {
    imports {
        mavenBom("org.springframework.boot:spring-boot-dependencies:4.1.0")
    }
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.springframework.boot:spring-boot-starter")
}
```

Boot 플러그인을 안 붙이면 BOM이 자동으로 안 들어온다. 그래서 BOM을 직접 가져온다. 가져오지 않으면 의존성마다 버전을 손으로 적어야 한다.

`service/service-order/build.gradle.kts`도 같다. 다만 지금은 주문이 재고를 직접 부른다. 프로세스가 하나인 동안의 시작점이다. 나중에 이벤트로 바꿀 때 이 의존을 지운다.

```kotlin
plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    id("io.spring.dependency-management") version "1.1.7"
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

dependencyManagement {
    imports {
        mavenBom("org.springframework.boot:spring-boot-dependencies:4.1.0")
    }
}

dependencies {
    implementation(project(":service:service-inventory"))
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
}
```

소스 폴더만 만든다. 패키지는 `com.hanumoka.be.order`, `com.hanumoka.be.inventory`다. 오늘은 클래스를 안 넣어도 빌드는 된다.

```text
service/service-order/src/main/kotlin/com/hanumoka/be/order/
service/service-inventory/src/main/kotlin/com/hanumoka/be/inventory/
```

## 4. 실행 모듈을 만든다

`app/app-monolith/build.gradle.kts`다. **여기만** Boot 플러그인을 붙인다.

```kotlin
plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    id("org.springframework.boot") version "4.1.0"
    id("io.spring.dependency-management") version "1.1.7"
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

dependencies {
    implementation(project(":service:service-order"))
    implementation(project(":service:service-inventory"))
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
}
```

이 `project(...)` 목록이 **이 프로세스에 무엇이 들어가는가**다. 프로세스를 가를 때 고치는 곳이 여기다.

부팅 클래스다. `app/app-monolith/src/main/kotlin/com/hanumoka/be/app/MonolithApplication.kt`.

```kotlin
package com.hanumoka.be.app

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication(
    scanBasePackages = [
        "com.hanumoka.be.app",
        "com.hanumoka.be.order",
        "com.hanumoka.be.inventory",
    ],
)
class MonolithApplication

fun main(args: Array<String>) {
    runApplication<MonolithApplication>(*args)
}
```

`scanBasePackages`를 적는 이유가 있다. 모듈 경계는 빌드 시점에만 있고, 컴포넌트 스캔은 패키지를 본다. 기본값은 부팅 클래스의 패키지(`com.hanumoka.be.app`) 아래만 훑는다. 그러면 주문·재고 빈이 하나도 안 잡힌다.

부팅 클래스를 `com.hanumoka.be`로 올리면 전부 훑는다. 그렇게 하면 classpath에 있는 것이 전부 들어오므로, **실행 모듈이 무엇을 이 프로세스에 넣을지 고르는 행위가 사라진다.** 그래서 목록으로 남긴다. 이 목록과 `build.gradle.kts`의 `project(...)` 목록이 짝이다.

설정 파일은 실행 모듈만 갖는다. `app/app-monolith/src/main/resources/application.yml`.

```yaml
server:
  port: 8080

spring:
  application:
    name: hanumoka-be-monolith
```

같은 이름 `application.yml`이 둘 이상 classpath에 올라오면 하나만 이기고 나머지는 조용히 무시된다. 그래서 라이브러리 모듈에 두지 않는다.

프로세스가 뜨는지 보려면 HTTP 표면이 하나 있으면 된다. 업무 규칙이 아닌 확인용이다. `app` 패키지 아래에 컨트롤러 하나를 둔다.

```kotlin
package com.hanumoka.be.app.smoke

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class SmokeController {
    @GetMapping("/smoke")
    fun smoke(): Map<String, String> = mapOf("status" to "ok")
}
```

## 5. 빌드하고 띄운다

저장소 루트에서 한다.

```shell
./gradlew clean build
```

통과하면 실행한다.

```shell
./gradlew :app:app-monolith:bootRun
```

다른 터미널에서 확인한다.

```shell
curl http://localhost:8080/smoke
```

`{"status":"ok"}`가 나오면 실행 모듈이 뜬 것이다.

## 여기서 하지 않은 것

- 주문·재고의 엔티티, 저장소, 서비스. 도메인은 다음이다.
- `buildSrc` 관례 플러그인. 모듈마다 플러그인 버전을 반복하지 않으려면 그다음에 뺀다.
- 모듈 사이 의존 규칙을 빌드가 검사하게 만드는 것.
- Kafka, 두 개의 DataSource, JPA.

오늘은 **실행 모듈과 라이브러리 모듈을 나누고, 프로세스가 하나 뜨는 것**까지다. 그 구분이 서 있어야 다음에 도메인을 넣든, 프로세스를 가르든 같은 자리가 보인다.
