---
title: Spring Boot 4 + Kotlin 멀티모듈 골격을 처음부터 세우기
description: 실행 모듈과 도메인 모듈을 나누고, 공통 빌드 설정을 buildSrc에 모으고, 모듈 사이 의존 규칙을 빌드가 검사하게 만드는 과정을 파일 단위로 따라간다.
pubDatetime: 2026-09-10T18:00:00+09:00
kind: snippet
tags:
  - kotlin
  - spring-boot
  - gradle
  - multi-module
draft: false
---

[hanumoka-be](https://github.com/hanumoka/hanumoka-be)의 골격을 세운 과정을 처음부터 따라 할 수 있게 정리했다. 완성본은 커밋 [`a29f2a0`](https://github.com/hanumoka/hanumoka-be/tree/a29f2a0c67aa78412bc057069bffd376a5ce4c53)이다.

끝까지 따라가면 세 가지가 된다.

1. `./gradlew build` 한 번에 컴파일, 테스트, 모듈 의존 규칙 검사가 함께 돈다.
2. 실행 가능한 jar가 하나 나오고 HTTP 요청을 받는다.
3. 도메인 코드를 넣을 자리가 준비된다. 도메인 코드 자체는 이 글에 없다.

단계마다 확인 명령을 두었다. 그 명령이 통과해야 다음 단계로 간다. 이렇게 하면 무언가 깨졌을 때 어느 단계에서 깨졌는지 바로 알 수 있다.

## 목차

## 버전

| 도구                                  | 버전   |
| ------------------------------------- | ------ |
| JDK (컴파일·실행용)                   | 25     |
| Kotlin                                | 2.3.21 |
| Spring Boot                           | 4.1.0  |
| Gradle                                | 9.7.1  |
| Spring dependency-management 플러그인 | 1.1.7  |
| foojay 툴체인 리졸버                  | 1.0.0  |
| ArchUnit                              | 1.5.0  |

Spring Boot 4는 3에서 쓰던 의존성 좌표 몇 개를 바꿨다. 바뀐 자리는 해당 단계에서 짚는다.

## 이 글에서 쓰는 말

- **모듈**: Gradle 하위 프로젝트 하나. `settings.gradle.kts`의 `include`로 등록하고, 각자 `build.gradle.kts`를 갖는다.
- **층**: 모듈을 역할별로 묶은 단위. 이 글에서는 최상위 디렉터리 이름(`app`, `service`)이 곧 층이다.
- **관례 플러그인**: 여러 모듈이 함께 쓰는 빌드 설정을 담아 직접 만든 Gradle 플러그인. `buildSrc/`에 둔다. Gradle 문서에서 convention plugin이라고 부르는 것이다.
- **BOM**: 여러 라이브러리의 버전을 한 번에 정해 둔 목록. Spring Boot의 BOM을 가져오면 의존성마다 버전을 적지 않아도 된다.
- **툴체인**: 컴파일과 테스트에 쓸 JDK를 빌드 설정이 직접 고르는 Gradle 기능. Gradle 자체를 실행하는 JDK와는 별개다.

## 완성된 모습

```text
hanumoka-be/
├── settings.gradle.kts     모듈 목록, JDK 자동 다운로드
├── build.gradle.kts        비어 있다
├── gradle.properties
├── buildSrc/               공통 빌드 설정 (관례 플러그인 셋)
├── app/
│   └── app-monolith/       main이 있는 유일한 모듈. 프로세스가 된다
└── service/
    ├── service-order/      주문 도메인 (라이브러리)
    └── service-inventory/  재고 도메인 (라이브러리)
```

핵심은 **실행 모듈과 도메인 모듈을 나눈 것**이다.

| 모듈        | Boot 플러그인 | `main` | 빌드 결과      |
| ----------- | ------------- | ------ | -------------- |
| `app/*`     | 적용          | 있음   | 실행 가능 jar  |
| `service/*` | 없음          | 없음   | 라이브러리 jar |

도메인 모듈 하나가 `main`까지 가지면 이런 일이 생긴다.

1. 주문 모듈이 `main`을 가지면, 한 프로세스에서 재고까지 돌리기 위해 주문 모듈이 재고 모듈을 의존해야 한다.
2. 나중에 주문과 재고가 이벤트로만 대화하도록 바꿔도, 부팅 때문에 그 의존을 지울 수 없다.
3. 결국 빌드 파일에 "주문이 재고를 안다"가 남는다. 코드는 경계를 나눴는데 빌드는 나누지 못한 상태다.

`main`을 별도 모듈(`app-monolith`)로 빼면 이 문제가 없다. 프로세스를 여럿으로 나눌 때 바뀌는 것은 `app` 쪽 목록 두 개(의존하는 모듈 목록, 스캔할 패키지 목록)뿐이고 도메인 코드는 그대로다.

### 지키는 규칙 다섯

원래 구조는 나중에 `platform`(여러 서비스가 함께 쓰는 기반)과 `contract`(서비스 사이의 이벤트 스키마) 층까지 둔다. 이 글에서는 두 층을 만들지 않지만 규칙은 처음부터 네 층 기준으로 적는다.

1. `service`끼리 서로의 클래스를 직접 부르지 않는다. 이벤트로만 대화한다.
2. `service`는 자기 DB만 쓴다.
3. `service`에서 `platform` 방향으로만 의존한다. 반대는 없다.
4. `platform`은 도메인을 모른다.
5. `app`은 모두를 알고, 아무도 `app`을 모른다.

8단계에서 1, 3, 4, 5를 빌드가 검사하게 만든다. 2는 DB가 생긴 뒤의 일이다.

이 골격은 규칙 1을 일부러 하나 어긴 채로 시작한다. 주문 모듈이 재고 모듈을 직접 의존한다. 이벤트를 넣기 전과 후를 비교할 기준을 먼저 만들기 위해서다. 이 예외는 8단계에서 이유와 함께 목록에 등록한다.

## 0단계. 준비

| 필요한 것     | 이유                                                                                   |
| ------------- | -------------------------------------------------------------------------------------- |
| JDK 17 이상   | Gradle 9를 실행하는 데 필요하다. 컴파일용 JDK 25는 없어도 된다. 3단계 설정이 받아 온다 |
| Gradle 설치본 | 1단계에서 래퍼를 만들 때 한 번만 쓴다. 그 뒤로는 래퍼(`./gradlew`)만 쓴다              |
| Git           | 2단계와 9단계에서 쓴다                                                                 |
| curl          | 7단계 확인에 쓴다                                                                      |

이 글의 명령은 Git Bash, macOS, Linux 기준이다. Windows PowerShell에서는 `./gradlew` 대신 `.\gradlew`를 친다.

## 1단계. 빈 저장소와 Gradle 래퍼

1. 디렉터리를 만들고 Git 저장소로 초기화한다.

   ```bash
   mkdir hanumoka-be
   cd hanumoka-be
   git init
   ```

2. 설정 파일을 이름만 적어 먼저 만든다. 나머지는 3단계에서 채운다.

   ```kotlin file="settings.gradle.kts"
   rootProject.name = "hanumoka-be"
   ```

3. 래퍼를 만든다.

   ```bash
   gradle wrapper --gradle-version 9.7.1
   ```

4. Kotlin 코드 스타일을 적는다.

   ```text file="gradle.properties"
   kotlin.code.style=official
   ```

설정 파일을 먼저 만드는 이유가 있다. 빈 디렉터리에서 `gradle wrapper`를 치면 Gradle이 그 디렉터리를 빌드로 인식하지 않아 이렇게 실패한다.

```text
Directory '.../hanumoka-be' does not contain a Gradle build.
```

**확인**

```bash
./gradlew --version
```

출력에 `Gradle 9.7.1`이 보이면 된다. 이제부터 모든 명령은 설치본 `gradle`이 아니라 `./gradlew`로 친다. 래퍼는 저장소에 적힌 버전을 받아 쓰므로 누가 클론해도 같은 Gradle로 빌드된다.

## 2단계. Git 설정 파일 둘

첫 커밋 전에 둔다. 한 번 잘못 커밋된 줄바꿈은 나중에 고치기 번거롭다.

```text file=".gitattributes"
# 줄바꿈을 저장소에서 통일한다.
* text=auto eol=lf

# Windows에서만 실행되는 스크립트는 CRLF여야 한다.
*.bat  text eol=crlf
*.cmd  text eol=crlf

# 셸에서 실행되는 스크립트는 반드시 LF다.
gradlew text eol=lf

*.jar  binary
*.png  binary
*.jpg  binary
*.gif  binary
*.ico  binary
```

이 파일이 없으면 Windows에서 커밋한 `gradlew`가 CRLF 줄바꿈으로 저장될 수 있다. 그러면 Linux와 macOS에서 실행되지 않는다. 첫 줄 `#!/bin/sh` 끝에 보이지 않는 `\r`이 붙어서, 셸이 `/bin/sh\r`라는 없는 프로그램을 찾기 때문이다.

```text file=".gitignore"
.gradle/
.kotlin/
build/
out/

.idea/
*.iml

.DS_Store
```

`.gitignore`에는 주의할 점이 하나 있다. `build/`처럼 슬래시가 끝에만 있는 패턴은 저장소 어디에 있든 그 이름의 디렉터리를 전부 무시한다.

1. 소스 패키지 이름을 `com.example.build`로 지으면 디렉터리가 `com/example/build/`가 된다.
2. 그 디렉터리가 `build/` 규칙에 걸려 안의 파일이 커밋에서 빠진다. 오류는 나지 않는다.
3. 로컬 빌드는 파일이 디스크에 있으니 통과한다. 깨지는 것은 다른 사람이 클론한 뒤의 빌드다.

4단계의 패키지를 `buildlogic`으로 지은 이유가 이것이다. 어떤 파일이 왜 무시되는지는 다음 명령이 `.gitignore`의 몇 번째 줄 때문인지까지 알려 준다.

```bash
git check-ignore -v <파일 경로>
```

**확인**

```bash
git check-attr eol gradlew gradlew.bat
```

`gradlew: eol: lf`와 `gradlew.bat: eol: crlf`가 나오면 규칙이 적용된 것이다.

## 3단계. 모듈 목록과 JDK 자동 다운로드

1. 모듈 디렉터리를 만든다.

   ```bash
   mkdir -p app/app-monolith service/service-order service/service-inventory
   ```

2. `settings.gradle.kts`를 다음 내용으로 바꾼다.

   ```kotlin file="settings.gradle.kts"
   // 툴체인 다운로드 저장소를 등록한다.
   // 이것이 없으면 JDK 25가 설치되지 않은 기계에서 빌드가 서지 않는다.
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

모듈 경로의 콜론(`:`)은 디렉터리 구분이다. `:app:app-monolith`는 `app/app-monolith/` 디렉터리를 가리킨다. 디렉터리를 먼저 만든 이유는 Gradle 9가 없는 디렉터리를 `include`하면 실패하기 때문이다.

```text
Configuring project ':app:app-monolith' without an existing directory is not allowed.
```

위의 `plugins` 블록은 4단계에서 적을 JDK 설정과 짝을 이룬다.

1. 4단계의 `jvmToolchain(25)`는 "25 이상"이 아니라 **정확히 25**를 찾는다. 26이 설치돼 있어도 대신 쓰지 않는다. 기계마다 다른 JDK로 컴파일되는 것을 막기 위해서다.
2. 25가 없으면 Gradle이 받아 올 수 있다. 다만 어디서 받을지를 알려 주는 설정이 따로 있어야 한다. 그것이 foojay 플러그인이다.
3. 이 플러그인이 없으면 JDK 25가 없는 기계에서 이렇게 실패한다.

```text
Cannot find a Java installation on your machine (...) matching: {languageVersion=25, ...}.
Toolchain download repositories have not been configured.
```

IntelliJ의 JDK Auto-download 설정은 "다운로드를 막지 않는다"는 뜻일 뿐이다. 받을 주소는 이 플러그인이 정한다. 허락과 주소는 서로 다른 설정이다.

**확인**

```bash
./gradlew projects
```

출력 중간의 `Project hierarchy` 부분이 이렇게 나오면 된다.

```text
Root project 'hanumoka-be'
+--- Project ':app'
|    \--- Project ':app:app-monolith'
\--- Project ':service'
     +--- Project ':service:service-inventory'
     \--- Project ':service:service-order'
```

`:app`과 `:service`는 디렉터리 이름을 보고 Gradle이 만든 중간 프로젝트다. 빌드 파일이 없어도 된다.

## 4단계. 공통 빌드 설정 — buildSrc

모듈 셋은 같은 설정을 공유한다. 좌표(`group`, `version`), JDK 버전, 의존성 저장소, 테스트 러너다. 흔한 방법은 루트 `build.gradle.kts`의 `subprojects { }` 블록에 몰아 적는 것인데, 여기서는 쓰지 않는다.

- 모듈마다 필요한 것이 다르다. `app`에는 Boot 플러그인이 있어야 하고 `service`에는 없어야 한다. 한 블록에 몰면 모듈 이름으로 분기하는 코드가 생긴다.
- Gradle 문서도 한 프로젝트가 다른 프로젝트를 설정하는 방식 대신 관례 플러그인을 권한다. 모듈이 자기 설정을 스스로 "적용"하면 모듈 사이에 숨은 결합이 생기지 않는다.

그래서 루트 빌드 파일은 비워 둔다.

```kotlin file="build.gradle.kts"
// 이 파일은 비어 있다. 공통 설정은 buildSrc/ 의 관례 플러그인 셋이 갖는다.
//
//   hanumoka.kotlin-base     Kotlin, 툴체인 25, 테스트 러너
//   hanumoka.spring-library  service 층. Boot 플러그인 없음, BOM 을 직접 가져온다
//   hanumoka.spring-app      app 층. Boot 플러그인, 실행 가능 jar
//
// 여기에 allprojects, subprojects 블록을 두지 않는다.
// 플러그인 버전은 buildSrc/build.gradle.kts 한 곳에만 있다.
```

### 플러그인 버전은 한 곳에

```kotlin file="buildSrc/build.gradle.kts"
plugins {
    `kotlin-dsl`
}

repositories {
    mavenCentral()
    gradlePluginPortal()
}

// 저장소 전체에서 플러그인 버전이 적히는 유일한 곳이다.
dependencies {
    implementation("org.jetbrains.kotlin:kotlin-gradle-plugin:2.3.21")
    // kotlin.plugin.spring 은 kotlin-gradle-plugin 이 아니라 kotlin-allopen 에 들어 있다.
    implementation("org.jetbrains.kotlin:kotlin-allopen:2.3.21")
    implementation("org.springframework.boot:spring-boot-gradle-plugin:4.1.0")
    implementation("io.spring.gradle:dependency-management-plugin:1.1.7")
}
```

`buildSrc`에서는 플러그인을 플러그인 ID가 아니라 **그 플러그인이 든 라이브러리 좌표**로 가져온다. 그래서 어느 좌표에 어느 플러그인이 들었는지 알아야 한다. 대부분은 이름이 짝을 이루지만 `org.jetbrains.kotlin.plugin.spring`은 예외다. 이 플러그인은 `kotlin-allopen` 안에 있다. 이 줄을 빠뜨리면 관례 플러그인이 그 ID를 찾지 못한다.

`kotlin.plugin.spring`이 필요한 이유는 이렇다.

1. Kotlin 클래스는 기본이 `final`이다. 상속할 수 없다.
2. 스프링은 `@Configuration`, `@Transactional` 같은 애노테이션이 붙은 클래스를 상속해 프록시를 만든다.
3. 이 플러그인이 그런 애노테이션이 붙은 클래스를 자동으로 열어 준다.

### 모든 모듈이 부르는 함수

```kotlin file="buildSrc/src/main/kotlin/com/hanumoka/buildlogic/conventions.kt"
package com.hanumoka.buildlogic

import org.gradle.api.Project
import org.gradle.api.tasks.testing.Test
import org.gradle.kotlin.dsl.configure
import org.gradle.kotlin.dsl.withType
import org.jetbrains.kotlin.gradle.dsl.KotlinJvmProjectExtension

// 패키지 이름이 buildlogic 인 이유: build 로 지으면 .gitignore 의 build/ 규칙에 걸려
// 이 파일이 커밋되지 않는다. 2단계를 참고한다.

/**
 * 모든 모듈이 공유하는 바닥. 좌표, 툴체인, 저장소, 테스트 러너.
 *
 * 관례 플러그인 셋이 각자 본문에서 이 함수를 부른다.
 */
fun Project.applyHanumokaConventions() {
    group = "com.hanumoka"
    version = "0.0.1-SNAPSHOT"

    repositories.mavenCentral()

    extensions.configure<KotlinJvmProjectExtension>("kotlin") {
        // 정확히 25 를 찾는다. 없으면 settings.gradle.kts 의 foojay 리졸버가 받아 온다.
        jvmToolchain(TOOLCHAIN_JAVA_VERSION)
        compilerOptions {
            // 생성자 파라미터에 붙인 애노테이션의 기본 대상.
            // 검증 애노테이션(@field:NotBlank 같은 것)을 쓰기 시작하면 이 옵션이 값을 한다.
            freeCompilerArgs.add("-Xannotation-default-target=param-property")
        }
    }

    tasks.withType<Test>().configureEach {
        useJUnitPlatform()
    }
}

private const val TOOLCHAIN_JAVA_VERSION = 25
```

### 관례 플러그인 셋

`buildSrc/src/main/kotlin/` 아래의 `이름.gradle.kts` 파일은 그 자체로 플러그인이 된다. 파일 이름에서 `.gradle.kts`를 뺀 것이 플러그인 ID다.

```kotlin file="buildSrc/src/main/kotlin/hanumoka.kotlin-base.gradle.kts"
import com.hanumoka.buildlogic.applyHanumokaConventions

// 스프링을 모르는 순수 Kotlin 모듈이 쓰는 관례.
// 나머지 관례 플러그인 둘도 이것을 물려받는다.
plugins {
    id("org.jetbrains.kotlin.jvm")
}

applyHanumokaConventions()
```

```kotlin file="buildSrc/src/main/kotlin/hanumoka.spring-library.gradle.kts"
import org.springframework.boot.gradle.plugin.SpringBootPlugin

// service 층이 쓰는 관례. 라이브러리 모듈이다.
// Boot 플러그인을 일부러 적용하지 않는다. 적용하면 main 을 요구한다.
plugins {
    id("hanumoka.kotlin-base")
    id("org.jetbrains.kotlin.plugin.spring")
    id("io.spring.dependency-management")
}

// Boot 플러그인이 없으면 BOM 이 자동으로 들어오지 않는다. 그래서 직접 가져온다.
// 이 상수는 buildSrc 에 적은 Boot 플러그인 버전을 그대로 읽으므로 버전을 두 번 적지 않는다.
dependencyManagement {
    imports {
        mavenBom(SpringBootPlugin.BOM_COORDINATES)
    }
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
```

```kotlin file="buildSrc/src/main/kotlin/hanumoka.spring-app.gradle.kts"
// app 층이 쓰는 관례. 프로세스가 되는 모듈이다.
// 여기에만 Boot 플러그인을 적용한다. main 을 갖고 실행 가능 jar 를 낸다.
plugins {
    id("hanumoka.kotlin-base")
    id("org.jetbrains.kotlin.plugin.spring")
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    // 8단계의 클래스 단위 의존 검사에 쓴다.
    testImplementation("com.tngtech.archunit:archunit-junit5:1.5.0")
}
```

| 플러그인                  | 쓰는 모듈            | 더하는 것                                         |
| ------------------------- | -------------------- | ------------------------------------------------- |
| `hanumoka.kotlin-base`    | 스프링을 모르는 모듈 | Kotlin, 좌표, 툴체인 25, 테스트 러너              |
| `hanumoka.spring-library` | `service/*`          | 위 + 스프링. Boot 플러그인 없이 BOM을 직접 가져옴 |
| `hanumoka.spring-app`     | `app/*`              | 위 + Boot 플러그인. BOM은 Boot 플러그인이 넣어 줌 |

`spring-library`에서 BOM을 직접 가져오는 것은 Boot 플러그인을 뺀 대가다. Boot 플러그인과 `io.spring.dependency-management`가 함께 있으면 BOM이 자동으로 들어오지만, Boot 플러그인이 없으면 들어오지 않는다. 그 상태로 두면 모든 의존성에 버전을 손으로 적어야 한다.

### 블록 주석에 경로를 쓰지 않는다

관례 플러그인에 주석을 달 때 이것을 조심한다. 설명에 `app/*` 같은 경로를 블록 주석(`/** */`) 안에 쓰면 파일 뒷부분이 통째로 사라진다.

1. Kotlin은 블록 주석 안에 블록 주석을 또 열 수 있다. Java는 그렇지 않다.
2. `/** app/* 가 쓰는 관례 */`에서 `app/*`의 `/*`가 안쪽 주석을 하나 더 연다.
3. 줄 끝의 `*/`는 안쪽 주석만 닫는다. 바깥 주석은 열린 채로 남아 뒤의 코드를 전부 주석으로 만든다.
4. 오류는 엉뚱한 곳에서 난다. 이 관례 플러그인을 쓰는 모듈의 빌드 파일에서 `Unresolved reference 'implementation'`이 난다.

한 줄 주석(`//`)은 이 문제가 없다. 이 글의 빌드 파일 주석이 대부분 `//`인 이유다.

**확인**

```bash
./gradlew help
```

`BUILD SUCCESSFUL`이 나오면 된다. `buildSrc`는 다른 무엇보다 먼저 컴파일되므로, 여기서 통과하면 관례 플러그인 셋이 문법상 문제없다는 뜻이다.

## 5단계. 도메인 모듈 둘

도메인 모듈은 라이브러리다. Boot 플러그인도 `main`도 없다.

```kotlin file="service/service-inventory/build.gradle.kts"
// 재고 도메인. 라이브러리 모듈이므로 Boot 플러그인도 main 도 없다.
plugins {
    id("hanumoka.spring-library")
}

dependencies {
    // 재고에는 HTTP 입구가 없다. 주문이 직접 부른다. 그래서 webmvc 가 아니라 기본 starter 다.
    implementation("org.springframework.boot:spring-boot-starter")
}
```

```kotlin file="service/service-order/build.gradle.kts"
// 주문 도메인. 라이브러리 모듈이므로 Boot 플러그인도 main 도 없다.
plugins {
    id("hanumoka.spring-library")
}

dependencies {
    // 규칙 1 을 일부러 어기는 줄이다. 8단계에서 예외 목록에 등록한다.
    // 이벤트로 바꾸면 이 줄과 그 예외 항목이 함께 사라진다.
    implementation(project(":service:service-inventory"))

    implementation("org.springframework.boot:spring-boot-starter-webmvc")
}
```

의존성에 버전이 없다. 4단계의 `spring-library`가 가져온 BOM이 버전을 정한다.

두 모듈에는 소스가 아직 없다. 도메인 코드는 이 글의 범위 밖이다.

**확인**

```bash
./gradlew :service:service-order:build
```

`BUILD SUCCESSFUL`이 나오면 된다. 소스가 없으므로 컴파일 태스크는 `NO-SOURCE`로 건너뛴다.

## 6단계. 실행 모듈

`app-monolith`는 `main`을 갖고, 어떤 도메인을 넣을지 고르고, 환경 설정을 갖는다. 업무 규칙은 한 줄도 없다.

```kotlin file="app/app-monolith/build.gradle.kts"
// 이 글의 유일한 프로세스.
plugins {
    id("hanumoka.spring-app")
}

dependencies {
    // 이 목록이 "이 프로세스에 무엇이 들어가는가"를 정한다.
    // MonolithApplication 의 scanBasePackages 와 짝이다.
    implementation(project(":service:service-order"))
    implementation(project(":service:service-inventory"))

    implementation("org.springframework.boot:spring-boot-starter-webmvc")

    // Boot 4 는 Jackson 3 을 쓴다. 그룹이 com.fasterxml.jackson.module 이 아니라 tools.jackson.module 이다.
    // 이 모듈이 실제로 무엇을 하는지는 7단계에서 테스트로 잰다.
    implementation("tools.jackson.module:jackson-module-kotlin")

    // Boot 4 에서 @AutoConfigureMockMvc 가 이 모듈로 옮겨 갔다. starter-test 에는 없다.
    testImplementation("org.springframework.boot:spring-boot-webmvc-test")
}
```

```kotlin file="app/app-monolith/src/main/kotlin/com/hanumoka/be/app/MonolithApplication.kt"
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

`scanBasePackages`를 적는 이유는 이렇다.

1. 모듈 경계는 빌드할 때만 있다. 실행 중인 스프링은 모듈을 모르고 패키지만 본다.
2. `@SpringBootApplication`은 기본으로 자기 패키지(`com.hanumoka.be.app`) 아래만 스캔한다. 그대로 두면 도메인 모듈의 빈이 하나도 잡히지 않는다.
3. 부팅 클래스를 상위 패키지(`com.hanumoka.be`)로 옮기면 전부 잡힌다. 대신 classpath에 올라온 것이 모두 들어와서, 이 프로세스에 무엇을 넣을지 `app`이 고른다는 구조가 사라진다.
4. 그래서 스캔할 패키지를 목록으로 적는다. 이 목록과 `build.gradle.kts`의 `project(...)` 목록이 짝이다.

지금은 두 도메인 패키지에 클래스가 없어서 목록에서 빼도 결과가 같다. 차이는 도메인 클래스가 생긴 뒤에 나타난다.

```yaml file="app/app-monolith/src/main/resources/application.yml"
# application.yml 은 app 모듈이 갖는다. service 모듈에 두지 않는다.
server:
  port: 8080

spring:
  application:
    name: hanumoka-be-monolith
```

`application.yml`을 `app` 모듈에만 두는 이유가 있다. 여러 모듈이 같은 이름의 파일을 classpath에 올리면 먼저 찾은 하나만 읽히고 나머지는 조용히 무시된다. 환경 설정은 프로세스에 속하므로 프로세스가 되는 모듈이 갖는다.

```kotlin file="app/app-monolith/src/test/kotlin/com/hanumoka/be/app/MonolithApplicationTests.kt"
package com.hanumoka.be.app

import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest

// 이 테스트가 재는 것은 하나다. 이 프로세스가 뜨는가.
// 도메인 모듈에는 이 테스트를 두지 않는다. 부팅 클래스가 거기에 없기 때문이다.
@SpringBootTest
class MonolithApplicationTests {

    @Test
    fun contextLoads() {
    }
}
```

`@SpringBootTest`는 테스트 클래스의 패키지에서 위로 올라가며 부팅 클래스를 찾는다. 도메인 모듈에는 부팅 클래스가 없으므로, 도메인 모듈의 테스트는 스프링 없이 도는 단위 테스트로 쓴다.

**확인**

```bash
./gradlew build
./gradlew :app:app-monolith:bootRun
```

`BUILD SUCCESSFUL`이 나오고, `bootRun` 로그에 다음 줄이 보이면 된다. 서버는 Ctrl+C로 끈다.

```text
Tomcat started on port 8080 (http) with context path '/'
```

**실패하면**

| 증상                                                                                        | 원인                                             | 대응                                         |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| `Cannot find a Java installation on your machine (...) matching: {languageVersion=25, ...}` | JDK 25가 없고 받아 올 주소도 없다                | 3단계의 foojay 플러그인이 있는지 본다        |
| `Main class name has not been configured and it could not be resolved from classpath`       | `main`이 없는 모듈에 Boot 플러그인이 적용돼 있다 | 그 모듈을 `hanumoka.spring-library`로 바꾼다 |
| 앱은 뜨는데 도메인 모듈의 빈을 못 찾는다                                                    | `scanBasePackages`에 그 패키지가 없다            | 목록에 패키지를 더한다                       |

## 7단계. HTTP와 JSON이 오가는지 확인

도메인이 없으므로 임시 컨트롤러로 요청 처리 경로만 확인한다. 확인할 것은 셋이다. 프로세스가 뜨는가, 웹 서버가 요청을 받는가, JSON이 양방향으로 오가는가. 첫 실제 도메인 엔드포인트가 생기면 이 컨트롤러는 지운다.

```kotlin file="app/app-monolith/src/main/kotlin/com/hanumoka/be/app/smoke/SmokeController.kt"
package com.hanumoka.be.app.smoke

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

data class ItemRequest(val name: String)

data class ItemResponse(val id: Long, val name: String)

@RestController
@RequestMapping("/smoke/items")
class SmokeController {

    private val store = ConcurrentHashMap<Long, String>()
    private val sequence = AtomicLong(0)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: ItemRequest): ItemResponse {
        val id = sequence.incrementAndGet()
        store[id] = request.name
        return ItemResponse(id, request.name)
    }

    @GetMapping
    fun findAll(): List<ItemResponse> =
        store.entries
            .sortedBy { it.key }
            .map { ItemResponse(it.key, it.value) }

    @GetMapping("/{id}")
    fun findOne(@PathVariable id: Long): ResponseEntity<ItemResponse> {
        val name = store[id] ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(ItemResponse(id, name))
    }

    @PutMapping("/{id}")
    fun replace(
        @PathVariable id: Long,
        @RequestBody request: ItemRequest,
    ): ResponseEntity<ItemResponse> {
        val updated = store.computeIfPresent(id) { _, _ -> request.name }
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(ItemResponse(id, updated))
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: Long) {
        store.remove(id)
    }
}
```

테스트는 MockMvc로 쓴다. 실제 포트를 열지 않고 요청 처리 경로 전체를 지나간다.

```kotlin file="app/app-monolith/src/test/kotlin/com/hanumoka/be/app/smoke/SmokeControllerTest.kt"
package com.hanumoka.be.app.smoke

import com.jayway.jsonpath.JsonPath
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put

// 컨트롤러가 싱글턴 빈 안에 상태를 들고 있으므로 테스트끼리 상태를 공유한다.
// "전체 개수가 3이다" 같은 단정은 실행 순서에 따라 깨진다.
// 그래서 각 테스트가 자기 항목을 만들고 그 항목만 확인한다.
@SpringBootTest
@AutoConfigureMockMvc
class SmokeControllerTest @Autowired constructor(
    private val mockMvc: MockMvc,
) {

    @Test
    fun `POST creates an item and answers 201 with its id`() {
        val id = create("keyboard")

        mockMvc.get("$PATH/$id")
            .andExpect {
                status { isOk() }
                jsonPath("\$.id") { value(id.toInt()) }
                jsonPath("\$.name") { value("keyboard") }
            }
    }

    @Test
    fun `GET on a missing id answers 404`() {
        mockMvc.get("$PATH/999999")
            .andExpect { status { isNotFound() } }
    }

    @Test
    fun `GET on the collection contains the created item`() {
        val id = create("monitor")

        val body = mockMvc.get(PATH)
            .andExpect { status { isOk() } }
            .andReturn().response.contentAsString

        val ids: List<Int> = JsonPath.read(body, "\$[*].id")
        assertThat(ids).contains(id.toInt())
    }

    @Test
    fun `PUT replaces the name and answers 200`() {
        val id = create("mouse")

        mockMvc.put("$PATH/$id") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"trackball"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("\$.name") { value("trackball") }
        }

        mockMvc.get("$PATH/$id")
            .andExpect { jsonPath("\$.name") { value("trackball") } }
    }

    @Test
    fun `PUT on a missing id answers 404`() {
        mockMvc.put("$PATH/999999") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"ghost"}"""
        }.andExpect { status { isNotFound() } }
    }

    @Test
    fun `DELETE answers 204 and the item is gone afterwards`() {
        val id = create("cable")

        mockMvc.delete("$PATH/$id")
            .andExpect { status { isNoContent() } }

        mockMvc.get("$PATH/$id")
            .andExpect { status { isNotFound() } }
    }

    @Test
    fun `POST without a name is rejected with 400`() {
        mockMvc.post(PATH) {
            contentType = MediaType.APPLICATION_JSON
            content = "{}"
        }.andExpect { status { isBadRequest() } }
    }

    // POST 로 하나 만들고 그 id 를 돌려준다.
    private fun create(name: String): Long {
        val body = mockMvc.post(PATH) {
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"$name"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("\$.name") { value(name) }
        }.andReturn().response.contentAsString

        return JsonPath.read<Int>(body, "\$.id").toLong()
    }

    private companion object {
        const val PATH = "/smoke/items"
    }
}
```

```kotlin file="app/app-monolith/src/test/kotlin/com/hanumoka/be/app/JacksonKotlinModuleTest.kt"
package com.hanumoka.be.app

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import tools.jackson.databind.ObjectMapper

// jackson-module-kotlin 이 왜 의존성에 있는지를 재는 테스트다.
// 이 테스트가 없으면 그 의존성이 필요해서 넣은 것인지 습관으로 넣은 것인지 구분되지 않는다.
@SpringBootTest
class JacksonKotlinModuleTest @Autowired constructor(
    private val objectMapper: ObjectMapper,
) {

    data class OrderLine(val name: String, val quantity: Int = 1)

    @Test
    fun `a missing field falls back to the Kotlin default instead of a silent zero`() {
        val decoded = objectMapper.readValue("""{"name":"keyboard"}""", OrderLine::class.java)

        assertThat(decoded.quantity).isEqualTo(1)
    }
}
```

### Boot 4에서 바뀐 좌표

Boot 3에서 쓰던 좌표를 그대로 적으면 이 단계에서 컴파일이 깨진다.

| 무엇                           | Boot 3                                                    | Boot 4                                               |
| ------------------------------ | --------------------------------------------------------- | ---------------------------------------------------- |
| `@AutoConfigureMockMvc` 패키지 | `org.springframework.boot.test.autoconfigure.web.servlet` | `org.springframework.boot.webmvc.test.autoconfigure` |
| 그 애노테이션이 든 아티팩트    | `spring-boot-test-autoconfigure` (starter-test에 포함)    | `spring-boot-webmvc-test` (starter-test에 없음)      |
| Jackson Kotlin 모듈 그룹       | `com.fasterxml.jackson.module`                            | `tools.jackson.module`                               |
| `ObjectMapper` 패키지          | `com.fasterxml.jackson.databind`                          | `tools.jackson.databind`                             |

좌표를 기억에 의존해 찾기보다 classpath를 직접 보는 편이 빠르다. 다음 두 명령은 버전이 바뀌어도 그대로 쓸 수 있다.

1. 테스트 classpath에 실제로 어떤 jar가 올라오는지 본다.

   ```bash
   ./gradlew :app:app-monolith:dependencies --configuration testRuntimeClasspath
   ```

2. 의심 가는 jar 안에 그 클래스가 있는지 연다.

   ```bash
   unzip -l <jar 경로> | grep AutoConfigureMockMvc
   ```

### jackson-module-kotlin은 실제로 무엇을 하는가

처음에는 이 모듈이 없으면 POST와 PUT의 JSON 본문을 읽지 못할 것이라고 예상했다. 틀렸다. 모듈을 빼도 스모크 테스트는 통과했다. 재 보니 이렇게 돌아가고 있었다.

1. Spring Boot Gradle 플러그인이 Kotlin 컴파일에 `-java-parameters` 옵션을 켠다. 그래서 생성자 파라미터 이름이 바이트코드에 남는다. `javap -v`로 클래스를 열면 `MethodParameters` 항목이 보인다.
2. Jackson 3는 파라미터 이름만 있으면 Kotlin을 몰라도 생성자를 불러 `data class`를 만든다.
3. 차이는 Kotlin 기본값에서 난다. 모듈을 뺀 채로 `{"name":"keyboard"}`를 `OrderLine(val name: String, val quantity: Int = 1)`로 읽으면 기본값 `1`을 쓰지 않고 이렇게 실패한다.

```text
tools.jackson.databind.exc.MismatchedInputException:
  Cannot map `null` into type `int`
```

그래서 모듈을 남기고 그 이유를 `JacksonKotlinModuleTest`가 갖게 했다. 주석은 지워지고 기억은 흐려지지만 실패하는 테스트는 남는다.

`name` 없이 `{}`를 보내면 400이 돌아온다. 이것은 Jackson이 아니라 Kotlin이 막는 것이다. Kotlin은 null이 될 수 없는 파라미터에 null 검사를 심어 두고, 스프링이 그 예외를 요청 본문을 읽을 수 없다는 오류(`HttpMessageNotReadableException`)로 바꾼다.

**확인**

```bash
./gradlew build
```

`BUILD SUCCESSFUL`이 나오면 된다. 이 시점의 테스트는 9건이다(`SmokeControllerTest` 7, `JacksonKotlinModuleTest` 1, `MonolithApplicationTests` 1). 결과는 `app/app-monolith/build/reports/tests/test/index.html`에서 볼 수 있다.

실제 서버로도 확인한다. 한 터미널에서 서버를 띄운다.

```bash
./gradlew :app:app-monolith:bootRun
```

다른 터미널에서 요청을 보낸다.

```bash
curl -i -X POST localhost:8080/smoke/items -H 'Content-Type: application/json' -d '{"name":"keyboard"}'
curl localhost:8080/smoke/items
```

POST는 201과 함께 만든 항목을 돌려주고, 목록 조회에 그 항목이 보이면 된다.

```text
HTTP/1.1 201
Content-Type: application/json
Content-Length: 26
Date: ...

{"id":1,"name":"keyboard"}
```

```text
[{"id":1,"name":"keyboard"}]
```

curl이 응답을 받았다고 해서 방금 띄운 서버가 응답한 것은 아니다. 8080을 이미 다른 프로그램이 쓰고 있으면 새 서버는 뜨지 못하고, curl은 그 프로그램의 응답을 받는다. 그래서 먼저 로그에서 `Tomcat started` 줄을 확인한다. 포트가 겹치면 다른 포트로 띄운다.

```bash
./gradlew :app:app-monolith:bootRun --args='--server.port=18080'
```

## 8단계. 모듈 의존 규칙을 빌드가 검사하게

규칙 다섯은 문서에만 있으면 지켜지지 않는다. 검사를 둘 두고, 두 검사가 보는 것은 서로 다르다.

| 검사                     | 보는 것                                                        | 위치                                   |
| ------------------------ | -------------------------------------------------------------- | -------------------------------------- |
| `checkLayerDependencies` | 모듈이 모듈을 의존하는가 (`build.gradle.kts`의 `project(...)`) | `buildSrc`. 모든 모듈의 `check`에 붙음 |
| `LayerDependencyTest`    | 클래스가 클래스를 참조하는가                                   | `app-monolith`의 테스트. ArchUnit      |

둘 다 필요하다. 예를 들어 주문 도메인 클래스를 실수로 `app` 모듈 안에 만들면 모듈 의존은 그대로이므로 앞의 검사는 아무 말도 못 한다. 클래스 참조를 보는 뒤의 검사만 이것을 잡는다.

### 모듈 단위 검사

`conventions.kt`를 다음 내용으로 바꾼다. 4단계의 내용 끝에 `registerLayerDependencyCheck()` 호출과 검사 코드가 더해졌다.

```kotlin file="buildSrc/src/main/kotlin/com/hanumoka/buildlogic/conventions.kt"
package com.hanumoka.buildlogic

import org.gradle.api.GradleException
import org.gradle.api.Project
import org.gradle.api.artifacts.ProjectDependency
import org.gradle.api.tasks.testing.Test
import org.gradle.kotlin.dsl.configure
import org.gradle.kotlin.dsl.named
import org.gradle.kotlin.dsl.register
import org.gradle.kotlin.dsl.withType
import org.jetbrains.kotlin.gradle.dsl.KotlinJvmProjectExtension

// 패키지 이름이 buildlogic 인 이유: build 로 지으면 .gitignore 의 build/ 규칙에 걸려
// 이 파일이 커밋되지 않는다. 2단계를 참고한다.

/**
 * 모든 모듈이 공유하는 바닥. 좌표, 툴체인, 저장소, 테스트 러너, 층 의존 규칙 검사.
 *
 * 관례 플러그인 셋이 각자 본문에서 이 함수를 부른다.
 */
fun Project.applyHanumokaConventions() {
    group = "com.hanumoka"
    version = "0.0.1-SNAPSHOT"

    repositories.mavenCentral()

    extensions.configure<KotlinJvmProjectExtension>("kotlin") {
        // 정확히 25 를 찾는다. 없으면 settings.gradle.kts 의 foojay 리졸버가 받아 온다.
        jvmToolchain(TOOLCHAIN_JAVA_VERSION)
        compilerOptions {
            // 생성자 파라미터에 붙인 애노테이션의 기본 대상.
            // 검증 애노테이션(@field:NotBlank 같은 것)을 쓰기 시작하면 이 옵션이 값을 한다.
            freeCompilerArgs.add("-Xannotation-default-target=param-property")
        }
    }

    tasks.withType<Test>().configureEach {
        useJUnitPlatform()
    }

    registerLayerDependencyCheck()
}

private const val TOOLCHAIN_JAVA_VERSION = 25

// ---------------------------------------------------------------------------
// 층 의존 규칙. 여기서 보는 것은 모듈이 선언한 project(...) 의존뿐이다.
// 클래스 단위 위반은 app 모듈의 LayerDependencyTest(ArchUnit)가 따로 본다.
// ---------------------------------------------------------------------------

// 일부러 어기는 의존. 주문이 재고를 직접 부르는 것은 규칙 1 위반이지만,
// 이벤트를 넣기 전의 비교 기준으로 남긴다.
// 이벤트로 바꾸면 이 항목과 service-order 의 그 의존이 함께 사라진다.
private val DELIBERATE_EXCEPTIONS: Map<String, Set<String>> = mapOf(
    ":service:service-order" to setOf(":service:service-inventory"),
)

// 어느 층이 어느 층을 알아도 되는가.
//   app 은 모두를 알고 아무도 app 을 모른다 (규칙 5). 어느 값에도 "app" 이 없는 이유다.
//   service 끼리는 모른다 (규칙 1). "service" 의 값에 "service" 가 없는 이유다.
//   platform 은 도메인을 모른다 (규칙 3, 4). "service" 도 "contract" 도 없는 이유다.
private val ALLOWED_EDGES: Map<String, Set<String>> = mapOf(
    "app" to setOf("service", "platform", "contract"),
    "service" to setOf("platform", "contract"),
    "platform" to setOf("platform"),
    "contract" to emptySet(),
)

// 모듈 경로에서 층을 읽는다. 층은 최상위 디렉터리가 정한다.
private fun layerOf(path: String): String = when {
    path.startsWith(":app:") -> "app"
    path.startsWith(":service:") -> "service"
    path.startsWith(":platform:") -> "platform"
    path.startsWith(":contract") -> "contract"
    else -> "unknown"
}

private val DECLARING_CONFIGURATIONS = setOf("api", "implementation", "compileOnly", "runtimeOnly")

private fun Project.registerLayerDependencyCheck() {
    val task = tasks.register("checkLayerDependencies") {
        group = "verification"
        description = "이 모듈의 project 의존이 층 의존 규칙을 지키는지 검사한다."

        // 설정 단계에서 값으로 뽑아 둔다. doLast 안에서 Project 를 잡으면 설정 캐시가 깨진다.
        val modulePath = this@registerLayerDependencyCheck.path
        val moduleLayer = layerOf(modulePath)
        val allowed = ALLOWED_EDGES[moduleLayer].orEmpty()
        val exempted = DELIBERATE_EXCEPTIONS[modulePath].orEmpty()
        val declared = configurations
            .filter { it.name in DECLARING_CONFIGURATIONS }
            .flatMap { it.dependencies }
            .filterIsInstance<ProjectDependency>()
            .map { it.path }
            .toSortedSet()

        doLast {
            val violations = declared.filter { target ->
                target !in exempted && layerOf(target) !in allowed
            }
            if (violations.isEmpty()) return@doLast

            val lines = violations.joinToString("\n") { target ->
                "  $modulePath ($moduleLayer)  ->  $target (${layerOf(target)})"
            }
            throw GradleException(
                "층 의존 규칙 위반:\n$lines\n\n" +
                    "'$moduleLayer' 층이 알아도 되는 층: ${allowed.sorted()}\n" +
                    "일부러 어기는 것이라면 buildSrc 의 DELIBERATE_EXCEPTIONS 에 이유와 함께 등록한다.",
            )
        }
    }

    tasks.named("check") { dependsOn(task) }
}
```

검사는 이 순서로 돈다.

1. 설정 단계에서 이 모듈이 선언한 `project(...)` 의존을 모은다.
2. 의존 대상마다 경로에서 층을 읽는다.
3. 허용 목록에 없는 층이면 위반이다. 예외 목록에 있는 것은 뺀다.
4. 위반이 하나라도 있으면 빌드를 실패시킨다.

`check` 태스크에 붙였으므로 `./gradlew build`를 칠 때마다 돈다.

### 클래스 단위 검사

```kotlin file="app/app-monolith/src/test/kotlin/com/hanumoka/be/app/LayerDependencyTest.kt"
package com.hanumoka.be.app

import com.tngtech.archunit.core.importer.ClassFileImporter
import com.tngtech.archunit.core.importer.ImportOption
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses
import org.junit.jupiter.api.Test

// 층 의존 규칙의 클래스 단위 검사.
// app 모듈에 두는 이유: 모든 도메인을 classpath 에 가진 유일한 모듈이라 전체를 볼 수 있다.
class LayerDependencyTest {

    private val classes = ClassFileImporter()
        .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
        .importPackages(ROOT)

    @Test
    fun `nobody knows the app layer`() {
        noClasses().that().resideOutsideOfPackage("$ROOT.app..")
            .should().dependOnClassesThat().resideInAPackage("$ROOT.app..")
            .because("도메인이 조립 지점을 알면 그 모듈은 이 프로세스 전용이 된다 (규칙 5)")
            .allowEmptyShould(true)
            .check(classes)
    }

    @Test
    fun `inventory does not know order`() {
        noClasses().that().resideInAPackage("$ROOT.inventory..")
            .should().dependOnClassesThat().resideInAPackage("$ROOT.order..")
            .because("service 끼리 서로의 클래스를 직접 부르지 않는다 (규칙 1)")
            .allowEmptyShould(true)
            .check(classes)
    }

    // 반대 방향(주문에서 재고)은 일부러 열어 둔 위반이라 검사하지 않는다.
    // 이벤트로 바꿔 그 의존이 사라지면 그때 대칭 규칙을 더한다.

    private companion object {
        const val ROOT = "com.hanumoka.be"
    }
}
```

`allowEmptyShould(true)`는 임시다.

1. ArchUnit은 검사할 클래스가 하나도 없으면 기본으로 실패한다. 패키지 이름 오타 때문에 규칙이 아무것도 보지 못하는 상황과 구별할 수 없어서다.
2. 지금은 도메인 클래스가 없다. 이 옵션을 지우고 돌려 보면 두 테스트가 모두 `failed to check any classes`라는 메시지로 실패한다.
3. 도메인 클래스가 생기면 이 옵션을 지운다. 그때부터는 검사 대상이 비어 있다는 것 자체가 오타의 신호다.

**확인**

```bash
./gradlew build
```

테스트가 11건이 된다. `LayerDependencyTest`의 2건이 더해졌다. `./gradlew build --console=plain`으로 보면 `checkLayerDependencies` 태스크가 모듈 셋에서 각각 도는 것이 보인다.

검사가 실제로 실패하는지도 한 번 본다. 실패하는 모습을 본 적이 없는 검사는 무엇이든 통과시키는 상태일 수도 있다.

1. `conventions.kt`의 `DELIBERATE_EXCEPTIONS` 안의 항목 한 줄을 주석 처리한다.
2. `./gradlew check`를 돌리면 이렇게 실패한다.

   ```text
   Execution failed for task ':service:service-order:checkLayerDependencies' (registered by plugin 'hanumoka.kotlin-base').
   > 층 의존 규칙 위반:
       :service:service-order (service)  ->  :service:service-inventory (service)

     'service' 층이 알아도 되는 층: [contract, platform]
     일부러 어기는 것이라면 buildSrc 의 DELIBERATE_EXCEPTIONS 에 이유와 함께 등록한다.
   ```

3. 주석을 되돌린다.

## 9단계. 라이선스와 클론 확인

공개 저장소라면 `LICENSE`를 둔다. 라이선스가 없으면 코드가 공개돼 있어도 다른 사람에게는 그 코드를 쓸 권리가 없다. hanumoka-be는 MIT를 골랐다. 전문은 [choosealicense.com](https://choosealicense.com/licenses/mit/)에서 가져와 연도와 이름만 바꾼다.

마지막 확인은 클론으로 한다.

```bash
git add .
git commit -m "build: set up the multi-module skeleton"
git clone . ../hanumoka-be-clone-check
cd ../hanumoka-be-clone-check
./gradlew clean build
```

로컬 작업 트리에는 커밋에 들어가지 않은 파일도 있다. 2단계의 `.gitignore` 문제처럼 파일이 조용히 빠졌다면 로컬 빌드는 통과하고 클론한 빌드만 깨진다. 받아서 빌드하면 된다는 것은 클론해서 빌드해 봐야만 확인된다.

### JDK 25가 없는 기계에서도 되는가

3단계의 foojay 설정은 JDK 25가 없는 기계에서만 일을 한다. 이미 JDK 25가 설치된 기계라면 두 가지로 그 상태를 만들어 확인할 수 있다.

1. Gradle을 JDK 17로 실행한다. `JAVA_HOME`을 JDK 17 경로로 준다.
2. 설치된 JDK를 찾는 자동 탐지를 끈다.

```bash
JAVA_HOME=<JDK 17 경로> ./gradlew clean build -Porg.gradle.java.installations.auto-detect=false
```

foojay 플러그인을 뺀 설정으로 돌리면 3단계에 적은 오류로 실패한다. 플러그인을 넣고 돌리면 Gradle이 JDK 25(Eclipse Temurin)를 받아 `~/.gradle/jdks/` 아래에 풀고 빌드가 통과한다. 받아 온 JDK는 다음 빌드부터 그대로 쓴다.

## 겪은 실패 모음

| 증상                                                                                    | 원인                                                         | 단계 |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---- |
| `Directory '...' does not contain a Gradle build.`                                      | 설정 파일 없이 `gradle wrapper`를 쳤다                       | 1    |
| `Configuring project ':app:app-monolith' without an existing directory is not allowed.` | 디렉터리를 만들기 전에 `include`했다                         | 3    |
| `Toolchain download repositories have not been configured.`                             | JDK 25가 없고 foojay 플러그인도 없다                         | 3    |
| 관례 플러그인을 쓰는 모듈에서 `Unresolved reference 'implementation'`                   | 블록 주석 안의 `app/*`가 주석을 하나 더 열었다               | 4    |
| 커밋은 됐는데 클론한 빌드만 깨진다                                                      | `.gitignore`의 `build/`가 같은 이름의 소스 패키지를 무시했다 | 2, 9 |
| `Main class name has not been configured ...`                                           | `main`이 없는 모듈에 Boot 플러그인이 적용됐다                | 6    |
| `@AutoConfigureMockMvc`를 찾지 못한다                                                   | Boot 4에서 `spring-boot-webmvc-test`로 옮겨 갔다             | 7    |
| `` MismatchedInputException: Cannot map `null` into type `int` ``                       | jackson-module-kotlin 없이 Kotlin 기본값을 썼다              | 7    |

## 여기서 멈춘 것

이 글은 도메인을 넣기 직전까지다. 다음은 일부러 넣지 않았다.

- 도메인 코드, DB, JPA
- 코드 스타일 검사(ktlint, detekt)
- 버전 카탈로그(`gradle/libs.versions.toml`). 플러그인 버전이 `buildSrc` 한 곳에만 적혀 있는 동안은 필요 없다. 버전이 두 곳 이상에 적히기 시작하면 그때 들인다.
- Actuator, 프로파일별 설정, 전역 예외 처리와 요청 검증
- `platform`, `contract` 층

모두 도메인을 만들면서 필요해지는 순간에 넣는다. 미리 갖춰 두면 왜 필요한지 겪기 전에 답부터 갖게 된다.
