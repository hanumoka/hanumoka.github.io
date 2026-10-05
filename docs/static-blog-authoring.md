# Markdown 글과 정적 시각화 작성

- 목적: 본문과 그림을 함께 보관하고 Markdown으로 내려받아 읽을 수 있게 한다.
- 대상·소유자: hanumoka 및 블로그 작성 도구
- 마지막 검토: 2026-10-05

## 작성 원칙

새 글은 `src/content/posts/{언어}/{영문-key}/index.md`로 작성한다. Markdown 본문에 이미지 상대경로를 사용하고 그림 바로 아래에 같은 내용을 설명한다. 커스텀 MDX 컴포넌트나 독자 조작에 의존하는 시각화는 새로 만들지 않는다. 움직임이 필요하면 GIF와 정적 PNG/SVG를 함께 삽입한다.

이미지 URL을 외부 서버에 직접 연결하지 않는다. 필요한 이미지를 다운로드해 글의 `assets/`에 넣고, Notion 원고에는 실제 파일로 업로드한다. 출처 사이트와 참고 문서 링크는 일반 링크로 유지할 수 있다. 외부 무료 렌더링 서버에 원고를 보내지 않는다.

## 도구별 지원 범위

| 도구                 | 편집 원본            | 블로그와 Markdown에서 읽는 파일 | 생성 방법                         |
| -------------------- | -------------------- | ------------------------------- | --------------------------------- |
| Mermaid              | `.mmd`, `.mermaid`   | SVG/PNG                         | 저장소의 로컬 렌더 명령           |
| PlantUML             | `.puml`, `.plantuml` | SVG/PNG                         | Java + 로컬 PlantUML JAR          |
| D2                   | `.d2`                | SVG/PNG                         | 로컬 D2 CLI, PNG는 sharp 변환     |
| draw.io              | `.drawio`            | SVG/PNG                         | 편집기의 Export 기능              |
| Excalidraw           | `.excalidraw`        | SVG/PNG                         | 편집기의 Export image 기능        |
| 순서 설명 애니메이션 | 도구 원본·프레임     | GIF + 정적 그림                 | 로컬 도구에서 제작 후 그대로 첨부 |

거대한 편집기를 사이트에 설치하지 않는다. draw.io/Excalidraw 파일을 Git과 ZIP에 보존하고 편집기에서 다시 연다. SVG에 `foreignObject`, 스크립트, 외부 그림·스타일이 들어 있으면 검사에서 거절하므로 HTML 라벨을 끄거나 PNG를 선택한다. GIF의 프레임과 반복 설정은 export가 재인코딩하지 않는다.

## 시작 조건과 실제 명령

Node 24.16 이상 24.x와 `npm ci`가 필요하다. Mermaid CLI 설치 시 Puppeteer의 Chromium도 설치된다. 다운로드를 생략한 환경에서는 `DIAGRAM_BROWSER_PATH`를 설치된 Chromium 계열 브라우저 실행 파일로 설정한다.

```shell
npm run diagram:render -- src/content/posts/ko/example/assets/flow.mmd src/content/posts/ko/example/assets/flow.svg
```

PlantUML은 [공식 릴리스](https://github.com/plantuml/plantuml/releases)에서 JAR를 내려받고 `PLANTUML_JAR`를 그 파일 경로로 설정한다. Java가 PATH에 있어야 한다. 다이어그램 종류에 따라 Graphviz도 필요하다. 렌더러는 `SANDBOX` 보안 모드와 로컬 표준입출력을 사용한다.

```shell
npm run diagram:render -- src/content/posts/ko/example/assets/sequence.puml src/content/posts/ko/example/assets/sequence.svg
```

[D2 공식 설치 안내](https://d2lang.com/tour/install/)에 따라 CLI를 설치한다. PATH에서 `d2`를 찾을 수 없으면 `D2_PATH`를 실행 파일 경로로 설정한다.

```shell
npm run diagram:render -- src/content/posts/ko/example/assets/services.d2 src/content/posts/ko/example/assets/services.svg
```

검증한 렌더러는 Mermaid CLI(버전은 package-lock.json), PlantUML 1.2026.8, D2 0.9.0이다. PlantUML/D2 바이너리는 저장소나 사이트에 포함하지 않는다. 미설치·문법 오류는 종료 코드 1과 설치 안내로 알린다. 이미 생성해 Git에 보관한 SVG/PNG는 이 도구들 없이도 사이트 빌드와 ZIP 내보내기에 사용할 수 있다. 텍스트를 고쳤으면 반드시 그림을 다시 생성한다.

draw.io/Excalidraw에서는 다음 순서로 작업한다.

1. 편집 원본을 `assets/`에 저장한다.
2. 편집기에서 PNG 또는 SVG를 같은 폴더에 내보낸다. SVG의 외부 자산·HTML 라벨은 제외한다.
3. 아래 자산 목록에 원본과 그림을 연결한다.
4. Markdown 이미지로 삽입하고 설명을 적는다.
5. 빌드와 ZIP 검사를 실행한다.

## 파일 등록과 GIF

글 폴더의 `visual-assets.json`에 원본과 결과물을 기록한다. GIF는 `poster`를 반드시 지정하고 두 그림을 모두 본문에 삽입한다.

```json
{
  "assets": [
    { "file": "./assets/flow.svg", "source": "./assets/flow.mmd", "alt": "요청 저장, 작업 처리, 결과 기록" },
    { "file": "./assets/progress.gif", "poster": "./assets/progress-poster.png", "alt": "요청, 처리, 완료" }
  ]
}
```

```markdown
![요청 저장 → 작업 처리 → 결과 기록](./assets/flow.svg)

1. 요청을 저장한다.
2. 작업을 처리한다.
3. 결과를 기록한다.

![요청, 처리, 완료 순서](./assets/progress.gif)
![전체 단계의 정적 그림](./assets/progress-poster.png)
```

Mermaid는 Markdown 코드 펜스로 작성하면 사이트에서 직접 렌더링한다. Mermaid 코드와 같은 내용을 담은 `.mmd` 원본 및 정적 그림을 자산 목록에 등록하면, 다운로드용 Markdown에서는 코드 블록을 그림과 원본 링크로 바꾼다. 따라서 사이트에서는 PNG를 중복 표시하지 않고, Mermaid를 지원하지 않는 뷰어에서도 내려받은 내용을 읽을 수 있다. 등록 원본과 코드가 다르면 내보내기가 실패하므로 원본·그림을 함께 갱신한다. PlantUML/D2 코드 펜스는 여전히 정적 그림으로 변환해 넣는다.

## 외부 이미지 가져오기

사용 권한을 먼저 확인한다. 작성자가 명시한 공개 HTTPS 이미지 하나를 다음 명령으로 내려받는다.

```shell
npm run image:import -- https://example.org/diagram.png src/content/posts/ko/example/assets/diagram.png "저자명, 라이선스 또는 사용 허가"
```

위 주소는 문법 예시이므로 실제 공개 이미지 주소로 바꾼다. 파일을 덮어쓰지 않으며 같은 위치에 `.source.json`으로 출처·다운로드 시각·이용 조건을 보관한다. 인증정보·query가 있는 주소, 사설 네트워크, 외부 참조가 있는 SVG, 20MB 초과 이미지는 거절한다. 서명 URL이나 Notion 첨부는 작성자가 파일로 내려받아 `assets/`에 넣고 만료 토큰을 제외한 원 출처를 기록한다. 빌드는 네트워크에서 그림을 받지 않는다.

## 내보내기와 완료 확인

```shell
npm run test:content
npm run build
npm run check:dist
npm run preview
```

`npm run dev`는 시작 시 내보내기를 생성한다. 개발 서버 실행 중 원고나 첨부를 바꿨으면 `npm run content:export` 후 개발 서버를 다시 시작해 다운로드도 갱신한다.

1. 빌드가 글의 로컬 이미지, 참조형 이미지, 자산 목록, SVG 외부 참조를 검사한다. 누락 파일이나 hotlink가 있으면 실패한다.
2. `public/exports/{언어}/{key}/index.md`, `article.zip`, 이미지·원본을 생성한다. 이 디렉터리는 Git에서 제외하고 매번 다시 만든다.
3. 검증 가능한 글의 상단에 Markdown·ZIP 다운로드 링크가 나온다. Markdown 단독 다운로드에는 이미지 바이트가 포함되지 않으므로 ZIP을 권장한다.
4. ZIP을 풀고 `index.md`를 Markdown 뷰어에서 연다. 상대경로 이미지, GIF, 편집 원본이 같은 폴더 구조로 있어야 한다. 참고 사이트는 온라인 링크로 남는다.
5. JavaScript를 끈 브라우저에서도 모든 그림과 절차가 보이는지 확인한다.

로컬 Notion Markdown export에도 ZIP 생성기를 쓸 수 있다. 글과 첨부를 같은 폴더에 놓고, 첨부 경로를 상대경로로 바꾼다. frontmatter는 독립 ZIP 생성에는 필수가 아니다.

```shell
node scripts/content-export.mjs path/to/notion-export/index.md path/to/article.zip
```

글 폴더 밖을 참조하는 첨부는 가져오지 않는다. 첨부를 글 폴더 안에 복사하고 링크를 고친다. export는 내용을 삭제하거나 외부 이미지를 자동으로 가져오지 않는다.

기존 MDX 글은 컴포넌트를 지우고 내보내지 않는다. 작성자가 전체 내용을 정적 본문으로 옮긴 `_export.md`를 같은 폴더에 제공했을 때만 다운로드를 제공한다. 파일이 없으면 진단에 표시하고 버튼을 숨긴다. `_export.md`의 내용 완전성은 작성자가 원본과 대조해야 한다. 자동 검사는 남은 컴포넌트·누락 자산만 찾는다.

검사 실패 시 메시지에 나온 파일을 복구하거나 실제 로컬 파일로 교체하고 다시 실행한다. 그림 수정 후 빌드의 검사는 파일 존재·외부 참조를 검증하며 원본과 결과의 의미 일치까지 보장하지 않는다. 미리보기에서 사람이 확인한다.

## 검증 예제

2026-10-05 소유자 요청으로 사이트의 예제 글도 제거했다. 위 명령의 `example`은 새 글을 만들 때 사용할 경로 예시다. 파일을 먼저 만든 뒤 실행한다. 편집 원본과 SVG/PNG/GIF 묶음 보존은 임시 파일을 만드는 자동 검사로 확인한다.

공식 도구 문서: [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli), [PlantUML 명령행](https://plantuml.com/command-line), [D2 export](https://d2lang.com/tour/exports/), [draw.io export](https://www.drawio.com/doc/faq/export-diagram), [Excalidraw](https://docs.excalidraw.com/).
