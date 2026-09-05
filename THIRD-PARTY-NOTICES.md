# 제3자 고지

이 사이트는 정적 파일로 **배포**됩니다. 아래 자산이 빌드 결과물에 실려 나가므로
각 라이선스가 요구하는 고지를 여기 둡니다.

## AstroPaper (사이트 테마)

이 저장소의 구조·레이아웃·스타일은 AstroPaper에서 가져와 고친 것입니다.

- 저작자: Sat Naing
- 출처: <https://github.com/satnaing/astro-paper>
- 라이선스: MIT

```
MIT License

Copyright (c) 2023 Sat Naing

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

전문은 이 저장소의 [`LICENSE`](LICENSE)에도 그대로 있습니다.

## Google Sans Code (웹폰트)

코드 블록에 쓰는 고정폭 글꼴입니다. Astro의 폰트 기능이 빌드 때 내려받아
**자가 호스팅**하므로 폰트 파일이 이 사이트에서 함께 배포됩니다
(`_astro/fonts/` · 20개 파일 · 약 940KB).

- 저작자: The Google Sans Code Authors
- 발행: Google LLC
- 출처: <https://github.com/googlefonts/googlesans-code>
- 라이선스: **SIL Open Font License 1.1**

OFL은 재배포와 임베딩을 허용하되 저작권 고지 유지를 요구하며, **글꼴을 고치면
이름을 바꾸어야 합니다.** 이 저장소는 글꼴을 고치지 않고 그대로 씁니다.

> 이 글꼴은 라틴 문자용이라 한글은 시스템 글꼴로 표시됩니다. 940KB를 줄이려면
> `astro.config.ts`의 `fonts` 항목을 지우고 시스템 고정폭 글꼴을 쓰면 되며,
> 그 경우 이 절도 함께 지웁니다.

## 빌드 의존성

`package.json`에 적힌 패키지들은 빌드 도구이며 그 자체가 사이트에 실려 나가지는
않습니다. 다만 일부는 산출물에 코드를 포함시킵니다(Pagefind의 검색 런타임 등).
전부 OSI 승인 라이선스이며 목록은 `package.json`과 `package-lock.json`에 있습니다.

---

**이 문서를 두는 이유**는 공개 저장소를 그 자체로 배포로 보기 때문입니다. 이전에
다른 저장소에서 MIT 자산을 고지 없이 재배포한 일이 있었고, 그때 세운 규칙을 여기서
지킵니다.
