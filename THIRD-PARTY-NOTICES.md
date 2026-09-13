<!-- 이 파일은 scripts/generate-notices.mjs 가 package-lock.json 에서 만든다. 직접 고치지 말 것. -->

# 제3자 고지

이 사이트는 정적 파일로 **배포**됩니다. 공개 저장소도 그 자체로 배포입니다.
아래는 빌드 결과물과 이 저장소에 실려 나가는 제3자 자산의 고지입니다.

npm 패키지의 이름·버전·라이선스 목록은 `scripts/generate-notices.mjs`가
`package-lock.json`에서 다시 씁니다. 테마·아이콘·Google Fonts 글꼴처럼
락파일 밖에 있는 것만 예외로 적습니다.

---

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

라틴 본문과 코드에 쓰는 고정폭 글꼴입니다. Astro의 폰트 기능이 빌드 때
내려받아 **자가 호스팅**하므로 폰트 파일이 사이트와 함께 배포됩니다.
이 글꼴에는 한글 글리프가 없고, 한글은 아래 Noto Sans KR이 이어받습니다.

공유 이미지(OG)용 ttf는 satori가 빌드 때 읽습니다. 그 얼굴에는 `<Font>`를
걸지 않으므로 방문자의 `@font-face`에는 오르지 않습니다.

- 저작자: The Google Sans Code Project Authors
- 발행: Google LLC
- 출처: <https://github.com/googlefonts/googlesans-code>
- 라이선스: **SIL Open Font License 1.1**

OFL은 재배포와 임베딩을 허용하되 저작권 고지 유지를 요구하며, **글꼴을 고치면
이름을 바꾸어야 합니다.** 이 저장소는 글꼴을 고치지 않고 그대로 씁니다.
전문은 아래 Noto Sans KR과 같습니다.

## Noto Sans KR (웹폰트)

한글 본문 글꼴입니다. 브라우저용은 `@fontsource/noto-sans-kr` (5.3.0)의
unicode-range 조각이고, `@font-face` 선언은 CSS 번들로 들어가 캐시됩니다.
공유 이미지용은 Astro가 Google Fonts에서 받는 통짜 ttf이며, 그 변수에는
`<Font>`를 걸지 않아 방문자가 내려받지 않습니다.

- 패키지: `@fontsource/noto-sans-kr@5.3.0`
- 저작자: Google Inc. / The Noto Project Authors
- 출처: <https://fontsource.org/fonts/noto-sans-kr>
- 라이선스: **SIL Open Font License 1.1** (`OFL-1.1`)

```
Google Inc.

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

## Tabler Icons

헤더·검색·페이지네이션 등에 쓰는 SVG는 Tabler Icons를 이 저장소에 복사한
것입니다(`src/assets/icons/`). npm 패키지로 받지 않습니다.

- 저작자: Paweł Kuna
- 출처: <https://github.com/tabler/tabler-icons>
- 라이선스: MIT

```
MIT License

Copyright (c) 2020-2025 Paweł Kuna

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

## Tailwind CSS

페이지 스타일은 Tailwind CSS로 빌드되어 CSS 번들에 들어갑니다. 원본
런타임이 그대로 실리는 것은 아니고, 산출 CSS가 실립니다.

- 패키지: `tailwindcss@4.3.3`
- 저작자: Tailwind Labs, Inc.
- 출처: <https://github.com/tailwindlabs/tailwindcss>
- 라이선스: MIT

```
MIT License

Copyright (c) Tailwind Labs, Inc.

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

## Pagefind

검색 런타임과 색인이 빌드 산출물 `dist/pagefind/`로 나갑니다. UI는
`@pagefind/default-ui`입니다. 색인은 빌드가 만들고 저장소에는 두지 않습니다.

- 패키지: `pagefind@1.5.2`, `@pagefind/default-ui@1.5.2`
- 출처: <https://github.com/Pagefind/pagefind>
- 라이선스: MIT

```
pagefind

Copyright (c) Pagefind

All rights reserved.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the ""Software""), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Includes other software related under the MIT license:
- vscode-ripgrep, Copyright Microsoft Corporation. For licensing see /LICENSE/LICENSE-vscode-ripgrep
```

## mermaid

다이어그램이 있는 글에서만 본체를 받습니다. 그때 mermaid와 그 의존 패키지가
JS 청크로 실립니다. 아래 목록은 `package-lock.json`에서 `mermaid`를 뿌리로
걸어 만든 것입니다.

- 패키지: `mermaid@11.17.2`
- 저작자: Knut Sveidqvist
- 출처: <https://github.com/mermaid-js/mermaid>
- 라이선스: MIT

```
The MIT License (MIT)

Copyright (c) 2014 - 2022 Knut Sveidqvist

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

`dompurify`는 `MPL-2.0 OR Apache-2.0`입니다. 이 사이트는 **Apache-2.0을
고릅니다.**

### mermaid가 끌어오는 패키지

| 패키지 | 버전 | 라이선스 |
| ------ | ---- | -------- |
| `@antfu/install-pkg` | 2.0.1 | MIT |
| `@braintree/sanitize-url` | 7.1.2 | MIT |
| `@chevrotain/types` | 11.1.2 | Apache-2.0 |
| `@iconify/types` | 2.0.0 | MIT |
| `@iconify/utils` | 3.1.7 | MIT |
| `@mermaid-js/parser` | 1.2.1 | MIT |
| `@types/d3` | 7.4.3 | MIT |
| `@types/d3-array` | 3.2.2 | MIT |
| `@types/d3-axis` | 3.0.6 | MIT |
| `@types/d3-brush` | 3.0.6 | MIT |
| `@types/d3-chord` | 3.0.6 | MIT |
| `@types/d3-color` | 3.1.3 | MIT |
| `@types/d3-contour` | 3.0.6 | MIT |
| `@types/d3-delaunay` | 6.0.4 | MIT |
| `@types/d3-dispatch` | 3.0.7 | MIT |
| `@types/d3-drag` | 3.0.7 | MIT |
| `@types/d3-dsv` | 3.0.7 | MIT |
| `@types/d3-ease` | 3.0.2 | MIT |
| `@types/d3-fetch` | 3.0.7 | MIT |
| `@types/d3-force` | 3.0.10 | MIT |
| `@types/d3-format` | 3.0.4 | MIT |
| `@types/d3-geo` | 3.1.1 | MIT |
| `@types/d3-hierarchy` | 3.1.7 | MIT |
| `@types/d3-interpolate` | 3.0.4 | MIT |
| `@types/d3-path` | 3.1.1 | MIT |
| `@types/d3-polygon` | 3.0.2 | MIT |
| `@types/d3-quadtree` | 3.0.6 | MIT |
| `@types/d3-random` | 3.0.4 | MIT |
| `@types/d3-scale` | 4.0.9 | MIT |
| `@types/d3-scale-chromatic` | 3.1.0 | MIT |
| `@types/d3-selection` | 3.0.11 | MIT |
| `@types/d3-shape` | 3.2.0 | MIT |
| `@types/d3-time` | 3.0.4 | MIT |
| `@types/d3-time-format` | 4.0.3 | MIT |
| `@types/d3-timer` | 3.0.2 | MIT |
| `@types/d3-transition` | 3.0.9 | MIT |
| `@types/d3-zoom` | 3.0.8 | MIT |
| `@types/geojson` | 7946.0.16 | MIT |
| `@types/trusted-types` | 2.0.7 | MIT |
| `@upsetjs/venn.js` | 2.0.0 | MIT |
| `commander` | 7.2.0 | MIT |
| `commander` | 8.3.0 | MIT |
| `cose-base` | 1.0.3 | MIT |
| `cose-base` | 2.2.0 | MIT |
| `cytoscape` | 3.34.2 | MIT |
| `cytoscape-cose-bilkent` | 4.1.0 | MIT |
| `cytoscape-fcose` | 2.2.0 | MIT |
| `d3` | 7.9.0 | ISC |
| `d3-array` | 2.12.1 | BSD-3-Clause |
| `d3-array` | 3.2.4 | ISC |
| `d3-axis` | 3.0.0 | ISC |
| `d3-brush` | 3.0.0 | ISC |
| `d3-chord` | 3.0.1 | ISC |
| `d3-color` | 3.1.0 | ISC |
| `d3-contour` | 4.0.2 | ISC |
| `d3-delaunay` | 6.0.4 | ISC |
| `d3-dispatch` | 3.0.1 | ISC |
| `d3-drag` | 3.0.0 | ISC |
| `d3-dsv` | 3.0.1 | ISC |
| `d3-ease` | 3.0.1 | BSD-3-Clause |
| `d3-fetch` | 3.0.1 | ISC |
| `d3-force` | 3.0.0 | ISC |
| `d3-format` | 3.1.2 | ISC |
| `d3-geo` | 3.1.1 | ISC |
| `d3-hierarchy` | 3.1.2 | ISC |
| `d3-interpolate` | 3.0.1 | ISC |
| `d3-path` | 1.0.9 | BSD-3-Clause |
| `d3-path` | 3.1.0 | ISC |
| `d3-polygon` | 3.0.1 | ISC |
| `d3-quadtree` | 3.0.1 | ISC |
| `d3-random` | 3.0.1 | ISC |
| `d3-sankey` | 0.12.3 | BSD-3-Clause |
| `d3-scale` | 4.0.2 | ISC |
| `d3-scale-chromatic` | 3.1.0 | ISC |
| `d3-selection` | 3.0.0 | ISC |
| `d3-shape` | 1.3.7 | BSD-3-Clause |
| `d3-shape` | 3.2.0 | ISC |
| `d3-time` | 3.1.0 | ISC |
| `d3-time-format` | 4.1.0 | ISC |
| `d3-timer` | 3.0.1 | ISC |
| `d3-transition` | 3.0.1 | ISC |
| `d3-zoom` | 3.0.0 | ISC |
| `dagre-d3-es` | 7.0.14 | MIT |
| `dayjs` | 1.11.23 | MIT |
| `delaunator` | 5.1.0 | ISC |
| `dompurify` | 3.4.15 | (MPL-2.0 OR Apache-2.0) |
| `es-toolkit` | 1.52.0 | MIT |
| `fastdom` | 1.0.12 | MIT |
| `hachure-fill` | 0.5.2 | MIT |
| `iconv-lite` | 0.6.3 | MIT |
| `import-meta-resolve` | 4.2.0 | MIT |
| `internmap` | 1.0.1 | ISC |
| `internmap` | 2.0.3 | ISC |
| `katex` | 0.16.47 | MIT |
| `khroma` | 2.1.0 | MIT |
| `layout-base` | 1.0.2 | MIT |
| `layout-base` | 2.0.1 | MIT |
| `lodash-es` | 4.18.1 | MIT |
| `marked` | 16.4.2 | MIT |
| `mermaid` | 11.17.2 | MIT |
| `package-manager-detector` | 1.8.0 | MIT |
| `path-data-parser` | 0.1.0 | MIT |
| `points-on-curve` | 0.2.0 | MIT |
| `points-on-path` | 0.2.1 | MIT |
| `robust-predicates` | 3.0.3 | Unlicense |
| `roughjs` | 4.6.6 | MIT |
| `rw` | 1.3.3 | BSD-3-Clause |
| `safer-buffer` | 2.1.2 | MIT |
| `strictdom` | 1.0.1 | MIT |
| `stylis` | 4.4.0 | MIT |
| `tinyexec` | 1.3.1 | MIT |
| `ts-dedent` | 2.3.0 | MIT |
| `uuid` | 14.0.2 | MIT |

## 락파일 라이선스 목록

`hanumoka-site@0.2.0`의 `package-lock.json`(lockfileVersion 3)에서
고른 패키지 787개입니다. 이 목록의 패키지가 모두 사이트에
실리는 것은 아닙니다. 실리는 것은 위 절에 적었습니다. 빌드 기계에서만 쓰는
것(이미지 변환용 libvips, CSS 변환기, 형식 검사기 등)의 바이너리는 저장소에도
사이트에도 실리지 않습니다.

### (MPL-2.0 OR Apache-2.0)

- `dompurify@3.4.15`

### 0BSD

- `tslib@2.8.1`

### Apache-2.0

- `@chevrotain/types@11.1.2`
- `@eslint/config-array@0.23.5`
- `@eslint/config-helpers@0.7.0`
- `@eslint/core@1.2.1`
- `@eslint/object-schema@3.0.5`
- `@eslint/plugin-kit@0.7.3`
- `@humanfs/core@0.19.2`
- `@humanfs/node@0.16.8`
- `@humanfs/types@0.15.0`
- `@humanwhocodes/module-importer@1.0.1`
- `@humanwhocodes/retry@0.4.3`
- `@img/sharp-darwin-arm64@0.35.4`
- `@img/sharp-darwin-x64@0.35.4`
- `@img/sharp-freebsd-wasm32@0.35.4`
- `@img/sharp-linux-arm@0.35.4`
- `@img/sharp-linux-arm64@0.35.4`
- `@img/sharp-linux-ppc64@0.35.4`
- `@img/sharp-linux-riscv64@0.35.4`
- `@img/sharp-linux-s390x@0.35.4`
- `@img/sharp-linux-x64@0.35.4`
- `@img/sharp-linuxmusl-arm64@0.35.4`
- `@img/sharp-linuxmusl-x64@0.35.4`
- `@img/sharp-webcontainers-wasm32@0.35.4`
- `aria-query@5.3.2`
- `axobject-query@4.1.0`
- `detect-libc@2.1.2`
- `eslint-visitor-keys@3.4.3`
- `eslint-visitor-keys@5.0.1`
- `sharp@0.35.4`
- `typescript@6.0.3`

### Apache-2.0 AND LGPL-3.0-or-later

- `@img/sharp-win32-arm64@0.35.4`
- `@img/sharp-win32-ia32@0.35.4`
- `@img/sharp-win32-x64@0.35.4`

### Apache-2.0 AND LGPL-3.0-or-later AND MIT

- `@img/sharp-wasm32@0.35.4`

### BlueOak-1.0.0

- `common-ancestor-path@2.0.0`
- `lru-cache@11.5.2`
- `minimatch@10.2.6`
- `sax@1.6.1`

### BSD-2-Clause

- `css-select@6.0.0`
- `css-what@7.0.0`
- `domelementtype@2.3.0`
- `domhandler@5.0.3`
- `domutils@3.2.2`
- `entities@4.5.0`
- `entities@6.0.1`
- `entities@8.0.0`
- `eslint-scope@9.1.2`
- `espree@11.2.0`
- `esrecurse@4.3.0`
- `estraverse@5.3.0`
- `esutils@2.0.3`
- `http-cache-semantics@4.2.0`
- `nth-check@2.1.1`
- `uri-js@4.4.1`

### BSD-3-Clause

- `d3-array@2.12.1`
- `d3-ease@3.0.1`
- `d3-path@1.0.9`
- `d3-sankey@0.12.3`
- `d3-shape@1.3.7`
- `diff@9.0.0`
- `esquery@1.7.0`
- `fast-uri@3.1.7`
- `rw@1.3.3`
- `smol-toml@1.8.0`
- `source-map@0.7.6`
- `source-map-js@1.2.1`

### CC0-1.0

- `mdn-data@2.0.28`
- `mdn-data@2.27.1`

### ISC

- `@emmetio/html-matcher@1.3.0`
- `@ungap/structured-clone@1.4.0`
- `anymatch@3.1.3`
- `boolbase@1.0.0`
- `cliui@9.0.1`
- `css-color-keywords@1.0.0`
- `d3@7.9.0`
- `d3-array@3.2.4`
- `d3-axis@3.0.0`
- `d3-brush@3.0.0`
- `d3-chord@3.0.1`
- `d3-color@3.1.0`
- `d3-contour@4.0.2`
- `d3-delaunay@6.0.4`
- `d3-dispatch@3.0.1`
- `d3-drag@3.0.0`
- `d3-dsv@3.0.1`
- `d3-fetch@3.0.1`
- `d3-force@3.0.0`
- `d3-format@3.1.2`
- `d3-geo@3.1.1`
- `d3-hierarchy@3.1.2`
- `d3-interpolate@3.0.1`
- `d3-path@3.1.0`
- `d3-polygon@3.0.1`
- `d3-quadtree@3.0.1`
- `d3-random@3.0.1`
- `d3-scale@4.0.2`
- `d3-scale-chromatic@3.1.0`
- `d3-selection@3.0.0`
- `d3-shape@3.2.0`
- `d3-time@3.1.0`
- `d3-time-format@4.1.0`
- `d3-timer@3.0.1`
- `d3-transition@3.0.1`
- `d3-zoom@3.0.0`
- `delaunator@5.1.0`
- `flatted@3.4.4`
- `get-caller-file@2.0.5`
- `github-slugger@2.0.0`
- `glob-parent@6.0.2`
- `graceful-fs@4.2.11`
- `internmap@1.0.1`
- `internmap@2.0.3`
- `isexe@2.0.0`
- `piccolore@0.1.3`
- `picocolors@1.1.1`
- `semver@7.8.5`
- `which@2.0.2`
- `y18n@5.0.8`
- `yaml@2.8.3`
- `yaml@2.9.0`
- `yargs-parser@22.0.0`

### LGPL-3.0-or-later

- `@img/sharp-libvips-darwin-arm64@1.3.3`
- `@img/sharp-libvips-darwin-x64@1.3.3`
- `@img/sharp-libvips-linux-arm@1.3.3`
- `@img/sharp-libvips-linux-arm64@1.3.3`
- `@img/sharp-libvips-linux-ppc64@1.3.3`
- `@img/sharp-libvips-linux-riscv64@1.3.3`
- `@img/sharp-libvips-linux-s390x@1.3.3`
- `@img/sharp-libvips-linux-x64@1.3.3`
- `@img/sharp-libvips-linuxmusl-arm64@1.3.3`
- `@img/sharp-libvips-linuxmusl-x64@1.3.3`

### MIT

- `@antfu/install-pkg@2.0.1`
- `@astrojs/check@0.9.10`
- `@astrojs/compiler@2.13.1`
- `@astrojs/compiler@4.0.0`
- `@astrojs/compiler-binding@0.4.0`
- `@astrojs/compiler-binding-darwin-arm64@0.4.0`
- `@astrojs/compiler-binding-darwin-x64@0.4.0`
- `@astrojs/compiler-binding-linux-arm64-gnu@0.4.0`
- `@astrojs/compiler-binding-linux-arm64-musl@0.4.0`
- `@astrojs/compiler-binding-linux-x64-gnu@0.4.0`
- `@astrojs/compiler-binding-linux-x64-musl@0.4.0`
- `@astrojs/compiler-binding-wasm32-wasi@0.4.0`
- `@astrojs/compiler-binding-win32-arm64-msvc@0.4.0`
- `@astrojs/compiler-binding-win32-x64-msvc@0.4.0`
- `@astrojs/compiler-rs@0.4.0`
- `@astrojs/internal-helpers@0.10.4`
- `@astrojs/internal-helpers@0.11.0`
- `@astrojs/language-server@2.16.16`
- `@astrojs/markdown-remark@7.2.4`
- `@astrojs/markdown-remark@7.3.0`
- `@astrojs/markdown-satteri@0.4.0`
- `@astrojs/mdx@7.0.8`
- `@astrojs/prism@4.0.2`
- `@astrojs/rss@4.0.19`
- `@astrojs/sitemap@3.7.4`
- `@astrojs/telemetry@3.3.3`
- `@astrojs/yaml2ts@0.2.4`
- `@babel/helper-string-parser@7.29.7`
- `@babel/helper-validator-identifier@7.29.7`
- `@babel/parser@7.29.8`
- `@babel/types@7.29.8`
- `@braintree/sanitize-url@7.1.2`
- `@bruits/satteri-darwin-arm64@0.10.5`
- `@bruits/satteri-darwin-x64@0.10.5`
- `@bruits/satteri-linux-arm64-gnu@0.10.5`
- `@bruits/satteri-linux-arm64-musl@0.10.5`
- `@bruits/satteri-linux-x64-gnu@0.10.5`
- `@bruits/satteri-linux-x64-musl@0.10.5`
- `@bruits/satteri-wasm32-wasi@0.10.5`
- `@bruits/satteri-win32-arm64-msvc@0.10.5`
- `@bruits/satteri-win32-x64-msvc@0.10.5`
- `@cacheable/memory@2.2.0`
- `@cacheable/utils@2.5.0`
- `@capsizecss/unpack@4.0.1`
- `@clack/core@1.4.3`
- `@clack/prompts@1.7.0`
- `@emmetio/abbreviation@2.3.3`
- `@emmetio/css-abbreviation@2.1.8`
- `@emmetio/css-parser@0.4.1`
- `@emmetio/scanner@1.0.4`
- `@emmetio/stream-reader@2.2.0`
- `@emmetio/stream-reader-utils@0.1.0`
- `@emnapi/core@1.11.1`
- `@emnapi/core@1.11.3`
- `@emnapi/runtime@1.11.1`
- `@emnapi/runtime@1.11.3`
- `@emnapi/wasi-threads@1.2.2`
- `@emnapi/wasi-threads@1.2.3`
- `@esbuild/aix-ppc64@0.28.2`
- `@esbuild/android-arm@0.28.2`
- `@esbuild/android-arm64@0.28.2`
- `@esbuild/android-x64@0.28.2`
- `@esbuild/darwin-arm64@0.28.2`
- `@esbuild/darwin-x64@0.28.2`
- `@esbuild/freebsd-arm64@0.28.2`
- `@esbuild/freebsd-x64@0.28.2`
- `@esbuild/linux-arm@0.28.2`
- `@esbuild/linux-arm64@0.28.2`
- `@esbuild/linux-ia32@0.28.2`
- `@esbuild/linux-loong64@0.28.2`
- `@esbuild/linux-mips64el@0.28.2`
- `@esbuild/linux-ppc64@0.28.2`
- `@esbuild/linux-riscv64@0.28.2`
- `@esbuild/linux-s390x@0.28.2`
- `@esbuild/linux-x64@0.28.2`
- `@esbuild/netbsd-arm64@0.28.2`
- `@esbuild/netbsd-x64@0.28.2`
- `@esbuild/openbsd-arm64@0.28.2`
- `@esbuild/openbsd-x64@0.28.2`
- `@esbuild/openharmony-arm64@0.28.2`
- `@esbuild/sunos-x64@0.28.2`
- `@esbuild/win32-arm64@0.28.2`
- `@esbuild/win32-ia32@0.28.2`
- `@esbuild/win32-x64@0.28.2`
- `@eslint-community/eslint-utils@4.10.1`
- `@eslint-community/regexpp@4.12.2`
- `@iconify/types@2.0.0`
- `@iconify/utils@3.1.7`
- `@img/colour@1.1.0`
- `@jridgewell/gen-mapping@0.3.13`
- `@jridgewell/remapping@2.3.5`
- `@jridgewell/resolve-uri@3.1.2`
- `@jridgewell/sourcemap-codec@1.6.0`
- `@jridgewell/trace-mapping@0.3.31`
- `@keyv/bigmap@1.3.1`
- `@keyv/serialize@1.1.1`
- `@mdx-js/mdx@3.1.1`
- `@mermaid-js/parser@1.2.1`
- `@napi-rs/wasm-runtime@1.2.3`
- `@nodable/entities@3.0.0`
- `@oslojs/encoding@1.1.0`
- `@oxc-project/types@0.148.0`
- `@pagefind/darwin-arm64@1.5.2`
- `@pagefind/darwin-x64@1.5.2`
- `@pagefind/default-ui@1.5.2`
- `@pagefind/freebsd-x64@1.5.2`
- `@pagefind/linux-arm64@1.5.2`
- `@pagefind/linux-x64@1.5.2`
- `@pagefind/windows-arm64@1.5.2`
- `@pagefind/windows-x64@1.5.2`
- `@pkgr/core@0.3.6`
- `@rolldown/binding-android-arm-eabi@1.2.7`
- `@rolldown/binding-android-arm64@1.2.7`
- `@rolldown/binding-darwin-arm64@1.2.7`
- `@rolldown/binding-darwin-x64@1.2.7`
- `@rolldown/binding-freebsd-x64@1.2.7`
- `@rolldown/binding-linux-arm-gnueabihf@1.2.7`
- `@rolldown/binding-linux-arm64-gnu@1.2.7`
- `@rolldown/binding-linux-arm64-musl@1.2.7`
- `@rolldown/binding-linux-ppc64-gnu@1.2.7`
- `@rolldown/binding-linux-s390x-gnu@1.2.7`
- `@rolldown/binding-linux-x64-gnu@1.2.7`
- `@rolldown/binding-linux-x64-musl@1.2.7`
- `@rolldown/binding-openharmony-arm64@1.2.7`
- `@rolldown/binding-win32-arm64-msvc@1.2.7`
- `@rolldown/binding-win32-x64-msvc@1.2.7`
- `@rolldown/pluginutils@1.0.1`
- `@shikijs/core@4.4.3`
- `@shikijs/engine-javascript@4.4.3`
- `@shikijs/engine-oniguruma@4.4.3`
- `@shikijs/langs@4.4.3`
- `@shikijs/primitive@4.4.3`
- `@shikijs/themes@4.4.3`
- `@shikijs/transformers@4.4.3`
- `@shikijs/types@4.4.3`
- `@shikijs/vscode-textmate@10.0.2`
- `@shuding/opentype.js@1.4.0-beta.0`
- `@tailwindcss/node@4.3.3`
- `@tailwindcss/oxide@4.3.3`
- `@tailwindcss/oxide-android-arm64@4.3.3`
- `@tailwindcss/oxide-darwin-arm64@4.3.3`
- `@tailwindcss/oxide-darwin-x64@4.3.3`
- `@tailwindcss/oxide-freebsd-x64@4.3.3`
- `@tailwindcss/oxide-linux-arm-gnueabihf@4.3.3`
- `@tailwindcss/oxide-linux-arm64-gnu@4.3.3`
- `@tailwindcss/oxide-linux-arm64-musl@4.3.3`
- `@tailwindcss/oxide-linux-x64-gnu@4.3.3`
- `@tailwindcss/oxide-linux-x64-musl@4.3.3`
- `@tailwindcss/oxide-wasm32-wasi@4.3.3`
- `@tailwindcss/oxide-win32-arm64-msvc@4.3.3`
- `@tailwindcss/oxide-win32-x64-msvc@4.3.3`
- `@tailwindcss/typography@0.5.20`
- `@tailwindcss/vite@4.3.3`
- `@tybys/wasm-util@0.10.3`
- `@types/d3@7.4.3`
- `@types/d3-array@3.2.2`
- `@types/d3-axis@3.0.6`
- `@types/d3-brush@3.0.6`
- `@types/d3-chord@3.0.6`
- `@types/d3-color@3.1.3`
- `@types/d3-contour@3.0.6`
- `@types/d3-delaunay@6.0.4`
- `@types/d3-dispatch@3.0.7`
- `@types/d3-drag@3.0.7`
- `@types/d3-dsv@3.0.7`
- `@types/d3-ease@3.0.2`
- `@types/d3-fetch@3.0.7`
- `@types/d3-force@3.0.10`
- `@types/d3-format@3.0.4`
- `@types/d3-geo@3.1.1`
- `@types/d3-hierarchy@3.1.7`
- `@types/d3-interpolate@3.0.4`
- `@types/d3-path@3.1.1`
- `@types/d3-polygon@3.0.2`
- `@types/d3-quadtree@3.0.6`
- `@types/d3-random@3.0.4`
- `@types/d3-scale@4.0.9`
- `@types/d3-scale-chromatic@3.1.0`
- `@types/d3-selection@3.0.11`
- `@types/d3-shape@3.2.0`
- `@types/d3-time@3.0.4`
- `@types/d3-time-format@4.0.3`
- `@types/d3-timer@3.0.2`
- `@types/d3-transition@3.0.9`
- `@types/d3-zoom@3.0.8`
- `@types/debug@4.1.13`
- `@types/esrecurse@4.3.1`
- `@types/estree@1.0.9`
- `@types/estree-jsx@1.0.5`
- `@types/geojson@7946.0.16`
- `@types/hast@3.0.5`
- `@types/json-schema@7.0.15`
- `@types/lodash@4.17.25`
- `@types/lodash.kebabcase@4.1.9`
- `@types/mdast@4.0.4`
- `@types/mdx@2.0.14`
- `@types/ms@2.1.0`
- `@types/nlcst@2.0.3`
- `@types/node@24.13.3`
- `@types/sax@1.2.7`
- `@types/trusted-types@2.0.7`
- `@types/ungap__structured-clone@1.2.0`
- `@types/unist@2.0.11`
- `@types/unist@3.0.3`
- `@typescript-eslint/parser@8.69.0`
- `@typescript-eslint/project-service@8.69.0`
- `@typescript-eslint/scope-manager@8.69.0`
- `@typescript-eslint/tsconfig-utils@8.69.0`
- `@typescript-eslint/types@8.69.0`
- `@typescript-eslint/typescript-estree@8.69.0`
- `@typescript-eslint/visitor-keys@8.69.0`
- `@upsetjs/venn.js@2.0.0`
- `@volar/kit@2.4.28`
- `@volar/language-core@2.4.28`
- `@volar/language-server@2.4.28`
- `@volar/language-service@2.4.28`
- `@volar/source-map@2.4.28`
- `@volar/typescript@2.4.28`
- `@vscode/emmet-helper@2.11.0`
- `@vscode/l10n@0.0.18`
- `acorn@8.18.0`
- `acorn-jsx@5.3.2`
- `ajv@6.15.0`
- `ajv@8.20.0`
- `ajv-draft-04@1.0.0`
- `ajv-i18n@4.2.0`
- `am-i-vibing@0.4.0`
- `ansi-regex@6.3.0`
- `ansi-styles@6.2.3`
- `anynum@1.0.1`
- `arg@5.0.2`
- `array-iterate@2.0.1`
- `astring@1.9.0`
- `astro@7.3.1`
- `astro-eslint-parser@2.1.0`
- `astrojs-compiler-sync@1.1.1`
- `bail@2.0.2`
- `balanced-match@4.0.4`
- `base64-js@0.0.8`
- `brace-expansion@5.0.9`
- `cacheable@2.5.0`
- `camelize@1.0.1`
- `ccount@2.0.1`
- `character-entities@2.0.2`
- `character-entities-html4@2.1.0`
- `character-entities-legacy@3.0.0`
- `character-reference-invalid@2.0.1`
- `chokidar@4.0.3`
- `chokidar@5.0.0`
- `ci-info@4.4.0`
- `clsx@2.1.1`
- `collapse-white-space@2.1.0`
- `color-name@1.1.4`
- `comma-separated-tokens@2.0.3`
- `commander@11.1.0`
- `commander@7.2.0`
- `commander@8.3.0`
- `cookie@2.0.1`
- `cookie-es@1.2.3`
- `cose-base@1.0.3`
- `cose-base@2.2.0`
- `cross-spawn@7.0.6`
- `crossws@0.3.5`
- `css-background-parser@0.1.0`
- `css-box-shadow@1.0.0-3`
- `css-gradient-parser@0.0.17`
- `css-to-react-native@3.2.0`
- `css-tree@2.2.1`
- `css-tree@3.2.1`
- `cssesc@3.0.0`
- `csso@5.0.5`
- `cytoscape@3.34.2`
- `cytoscape-cose-bilkent@4.1.0`
- `cytoscape-fcose@2.2.0`
- `dagre-d3-es@7.0.14`
- `dayjs@1.11.23`
- `debug@4.4.3`
- `decode-named-character-reference@1.3.0`
- `deep-is@0.1.4`
- `defu@6.1.7`
- `dequal@2.0.3`
- `destr@2.0.5`
- `devalue@5.9.2`
- `devlop@1.1.0`
- `dom-serializer@2.0.0`
- `dset@3.1.4`
- `emmet@2.4.11`
- `emoji-regex@10.6.0`
- `emoji-regex-xs@2.0.1`
- `enhanced-resolve@5.24.5`
- `es-module-lexer@2.3.2`
- `es-toolkit@1.52.0`
- `esast-util-from-estree@2.0.0`
- `esast-util-from-js@2.0.1`
- `esbuild@0.28.2`
- `escalade@3.2.0`
- `escape-html@1.0.3`
- `escape-string-regexp@4.0.0`
- `escape-string-regexp@5.0.0`
- `eslint@10.10.0`
- `eslint-plugin-astro@2.1.1`
- `estree-util-attach-comments@3.0.0`
- `estree-util-build-jsx@3.0.1`
- `estree-util-is-identifier-name@3.0.0`
- `estree-util-scope@1.0.1`
- `estree-util-to-js@2.0.0`
- `estree-util-visit@2.0.0`
- `estree-walker@3.0.3`
- `eventemitter3@5.0.4`
- `extend@3.0.2`
- `fast-deep-equal@3.1.3`
- `fast-json-stable-stringify@2.1.0`
- `fast-levenshtein@2.0.6`
- `fast-string-truncated-width@3.0.3`
- `fast-string-width@3.0.2`
- `fast-wrap-ansi@0.2.2`
- `fast-xml-builder@1.3.1`
- `fast-xml-parser@5.11.1`
- `fastdom@1.0.12`
- `fdir@6.5.0`
- `fflate@0.7.5`
- `file-entry-cache@11.1.5`
- `find-proc@0.1.0`
- `find-up@5.0.0`
- `flat-cache@6.1.23`
- `flattie@1.1.1`
- `fontace@0.4.1`
- `fontkitten@1.0.3`
- `fsevents@2.3.3`
- `get-east-asian-width@1.6.0`
- `get-tsconfig@5.0.0-beta.4`
- `globals@17.12.0`
- `h3@1.15.11`
- `hachure-fill@0.5.2`
- `hashery@1.5.1`
- `hast-util-from-html@2.0.3`
- `hast-util-from-parse5@8.0.3`
- `hast-util-is-element@3.0.0`
- `hast-util-parse-selector@4.0.0`
- `hast-util-raw@9.1.0`
- `hast-util-to-estree@3.1.3`
- `hast-util-to-html@9.0.5`
- `hast-util-to-jsx-runtime@2.3.6`
- `hast-util-to-parse5@8.0.1`
- `hast-util-to-text@4.0.2`
- `hast-util-whitespace@3.0.0`
- `hastscript@9.0.1`
- `hex-rgb@4.3.0`
- `hookified@1.15.1`
- `hookified@2.2.0`
- `html-escaper@3.0.3`
- `html-void-elements@3.0.0`
- `iconv-lite@0.6.3`
- `ignore@5.3.2`
- `import-meta-resolve@4.2.0`
- `imurmurhash@0.1.4`
- `inline-style-parser@0.2.7`
- `iron-webcrypto@1.2.1`
- `is-alphabetical@2.0.1`
- `is-alphanumerical@2.0.1`
- `is-decimal@2.0.1`
- `is-docker@4.0.0`
- `is-extglob@2.1.1`
- `is-glob@4.0.3`
- `is-hexadecimal@2.0.1`
- `is-plain-obj@4.1.0`
- `is-unsafe@2.0.2`
- `jiti@2.7.0`
- `js-yaml@4.3.2`
- `json-schema-traverse@0.4.1`
- `json-schema-traverse@1.0.0`
- `json-stable-stringify-without-jsonify@1.0.1`
- `jsonc-parser@2.3.1`
- `jsonc-parser@3.3.1`
- `katex@0.16.47`
- `keyv@5.6.0`
- `khroma@2.1.0`
- `kleur@4.1.5`
- `layout-base@1.0.2`
- `layout-base@2.0.1`
- `levn@0.4.1`
- `linebreak@1.1.0`
- `locate-path@6.0.0`
- `lodash-es@4.18.1`
- `lodash.kebabcase@4.1.1`
- `longest-streak@3.1.0`
- `magic-string@0.30.21`
- `magic-string@1.2.3`
- `magicast@0.5.4`
- `markdown-extensions@2.0.0`
- `markdown-table@3.0.4`
- `marked@16.4.2`
- `mdast-util-definitions@6.0.0`
- `mdast-util-find-and-replace@3.0.2`
- `mdast-util-from-markdown@2.0.3`
- `mdast-util-gfm@3.1.0`
- `mdast-util-gfm-autolink-literal@2.0.1`
- `mdast-util-gfm-footnote@2.1.0`
- `mdast-util-gfm-strikethrough@2.0.0`
- `mdast-util-gfm-table@2.0.0`
- `mdast-util-gfm-task-list-item@2.0.0`
- `mdast-util-heading-range@2.1.5`
- `mdast-util-mdx@3.0.0`
- `mdast-util-mdx-expression@2.0.1`
- `mdast-util-mdx-jsx@3.2.0`
- `mdast-util-mdxjs-esm@2.0.1`
- `mdast-util-phrasing@4.1.0`
- `mdast-util-to-hast@13.2.1`
- `mdast-util-to-markdown@2.1.2`
- `mdast-util-to-string@1.1.0`
- `mdast-util-to-string@4.0.0`
- `mdast-util-toc@7.1.0`
- `mermaid@11.17.2`
- `micromark@4.0.2`
- `micromark-core-commonmark@2.0.3`
- `micromark-extension-gfm@3.0.0`
- `micromark-extension-gfm-autolink-literal@2.1.0`
- `micromark-extension-gfm-footnote@2.1.0`
- `micromark-extension-gfm-strikethrough@2.1.0`
- `micromark-extension-gfm-table@2.1.1`
- `micromark-extension-gfm-tagfilter@2.0.0`
- `micromark-extension-gfm-task-list-item@2.1.0`
- `micromark-extension-mdx-expression@3.0.1`
- `micromark-extension-mdx-jsx@3.0.2`
- `micromark-extension-mdx-md@2.0.0`
- `micromark-extension-mdxjs@3.0.0`
- `micromark-extension-mdxjs-esm@3.0.0`
- `micromark-factory-destination@2.0.1`
- `micromark-factory-label@2.0.1`
- `micromark-factory-mdx-expression@2.0.3`
- `micromark-factory-space@2.0.1`
- `micromark-factory-title@2.0.1`
- `micromark-factory-whitespace@2.0.1`
- `micromark-util-character@2.1.1`
- `micromark-util-chunked@2.0.1`
- `micromark-util-classify-character@2.0.1`
- `micromark-util-combine-extensions@2.0.1`
- `micromark-util-decode-numeric-character-reference@2.0.2`
- `micromark-util-decode-string@2.0.1`
- `micromark-util-encode@2.0.1`
- `micromark-util-events-to-acorn@2.0.3`
- `micromark-util-html-tag-name@2.0.1`
- `micromark-util-normalize-identifier@2.0.1`
- `micromark-util-resolve-all@2.0.1`
- `micromark-util-sanitize-uri@2.0.1`
- `micromark-util-subtokenize@2.1.0`
- `micromark-util-symbol@2.0.1`
- `micromark-util-types@2.0.2`
- `mrmime@2.0.1`
- `ms@2.1.3`
- `muggle-string@0.4.1`
- `nanoid@3.3.18`
- `natural-compare@1.4.0`
- `neotraverse@1.0.1`
- `nlcst-to-string@4.0.0`
- `node-fetch-native@1.6.7`
- `node-mock-http@1.0.5`
- `normalize-path@3.0.0`
- `obug@2.1.4`
- `ofetch@1.5.1`
- `ohash@2.0.12`
- `oniguruma-parser@0.12.2`
- `oniguruma-to-es@4.3.6`
- `optionator@0.9.4`
- `p-limit@3.1.0`
- `p-limit@7.3.2`
- `p-locate@5.0.0`
- `p-queue@9.3.3`
- `p-timeout@7.0.1`
- `package-manager-detector@1.8.0`
- `pagefind@1.5.2`
- `pako@0.2.9`
- `parse-css-color@0.2.1`
- `parse-entities@4.0.2`
- `parse-latin@7.0.0`
- `parse5@7.3.0`
- `parse5@8.0.1`
- `path-browserify@1.0.1`
- `path-data-parser@0.1.0`
- `path-exists@4.0.0`
- `path-expression-matcher@1.6.2`
- `path-key@3.1.1`
- `picomatch@2.3.2`
- `picomatch@4.0.7`
- `points-on-curve@0.2.0`
- `points-on-path@0.2.1`
- `postcss@8.5.28`
- `postcss-selector-parser@6.0.10`
- `postcss-selector-parser@7.1.6`
- `postcss-value-parser@4.2.0`
- `prelude-ls@1.2.1`
- `prettier@3.9.3`
- `prettier-plugin-astro@0.14.1`
- `prettier-plugin-tailwindcss@0.8.1`
- `prismjs@1.30.0`
- `process-ancestry@0.1.0`
- `property-information@7.2.0`
- `punycode@2.3.1`
- `qified@0.10.1`
- `radix3@1.1.2`
- `readdirp@4.1.2`
- `readdirp@5.1.1`
- `recma-build-jsx@1.0.0`
- `recma-jsx@1.0.1`
- `recma-parse@1.0.0`
- `recma-stringify@1.0.0`
- `regex@6.1.0`
- `regex-recursion@6.0.2`
- `regex-utilities@2.3.0`
- `rehype-callouts@2.2.0`
- `rehype-raw@7.0.0`
- `rehype-recma@1.0.0`
- `rehype-stringify@10.0.1`
- `remark-collapse@0.1.2`
- `remark-gfm@4.0.1`
- `remark-mdx@3.1.1`
- `remark-parse@11.0.0`
- `remark-rehype@11.1.2`
- `remark-smartypants@3.0.3`
- `remark-stringify@11.0.0`
- `remark-toc@9.0.0`
- `request-light@0.5.8`
- `request-light@0.7.0`
- `require-from-string@2.0.2`
- `resolve-pkg-maps@1.0.0`
- `retext@9.0.0`
- `retext-latin@4.0.0`
- `retext-smartypants@6.2.0`
- `retext-stringify@4.0.0`
- `rolldown@1.2.7`
- `roughjs@4.6.6`
- `s.color@0.0.15`
- `safer-buffer@2.1.2`
- `sass-formatter@0.7.9`
- `satteri@0.10.5`
- `shebang-command@2.0.0`
- `shebang-regex@3.0.0`
- `shiki@4.4.3`
- `sisteransi@1.0.5`
- `sitemap@9.0.1`
- `slugify@1.6.9`
- `space-separated-tokens@2.0.2`
- `strictdom@1.0.1`
- `string-width@7.2.0`
- `string-width@8.2.2`
- `string.prototype.codepointat@0.2.1`
- `stringify-entities@4.0.4`
- `strip-ansi@7.2.0`
- `strnum@2.4.2`
- `style-to-js@1.1.21`
- `style-to-object@1.0.14`
- `stylis@4.4.0`
- `suf-log@2.5.3`
- `svgo@4.1.0`
- `synckit@0.11.13`
- `tailwindcss@4.3.3`
- `tapable@2.3.3`
- `tiny-inflate@1.0.3`
- `tinyclip@0.1.15`
- `tinyexec@1.3.1`
- `tinyglobby@0.2.17`
- `trim-lines@3.0.1`
- `trough@2.2.0`
- `ts-api-utils@2.5.0`
- `ts-dedent@2.3.0`
- `type-check@0.4.0`
- `typesafe-path@0.2.2`
- `typescript-auto-import-cache@0.3.6`
- `ufo@1.6.4`
- `ultrahtml@1.7.0`
- `uncrypto@0.1.3`
- `undici@8.10.2`
- `undici-types@7.18.2`
- `unicode-trie@2.0.0`
- `unified@11.0.5`
- `unifont@0.7.5`
- `unist-util-find-after@5.0.0`
- `unist-util-is@6.0.1`
- `unist-util-modify-children@4.0.0`
- `unist-util-position@5.0.0`
- `unist-util-position-from-estree@2.0.0`
- `unist-util-remove-position@5.0.0`
- `unist-util-stringify-position@4.0.0`
- `unist-util-visit@5.1.0`
- `unist-util-visit-children@3.0.0`
- `unist-util-visit-parents@6.0.2`
- `unstorage@1.17.5`
- `util-deprecate@1.0.2`
- `uuid@14.0.2`
- `vfile@6.0.3`
- `vfile-location@5.0.3`
- `vfile-message@4.0.3`
- `vite@8.2.2`
- `vitefu@1.1.3`
- `volar-service-css@0.0.71`
- `volar-service-emmet@0.0.71`
- `volar-service-html@0.0.71`
- `volar-service-prettier@0.0.71`
- `volar-service-typescript@0.0.71`
- `volar-service-typescript-twoslash-queries@0.0.71`
- `volar-service-yaml@0.0.71`
- `vscode-css-languageservice@6.3.10`
- `vscode-html-languageservice@5.6.2`
- `vscode-json-languageservice@4.1.8`
- `vscode-jsonrpc@8.2.0`
- `vscode-jsonrpc@9.0.2`
- `vscode-languageserver@9.0.1`
- `vscode-languageserver-protocol@3.17.5`
- `vscode-languageserver-protocol@3.18.3`
- `vscode-languageserver-textdocument@1.0.14`
- `vscode-languageserver-types@3.17.5`
- `vscode-languageserver-types@3.18.3`
- `vscode-nls@5.2.0`
- `vscode-uri@3.2.0`
- `web-namespaces@2.0.1`
- `word-wrap@1.2.5`
- `wrap-ansi@9.0.2`
- `xml-naming@0.3.0`
- `xxhash-wasm@1.1.0`
- `yaml-language-server@1.23.0`
- `yargs@18.1.0`
- `yocto-queue@0.1.0`
- `yocto-queue@1.2.2`
- `yoga-layout@3.2.1`
- `zod@4.5.4`
- `zwitch@2.0.4`

### MPL-2.0

- `lightningcss@1.32.0`
- `lightningcss@1.33.0`
- `lightningcss-android-arm64@1.32.0`
- `lightningcss-android-arm64@1.33.0`
- `lightningcss-darwin-arm64@1.32.0`
- `lightningcss-darwin-arm64@1.33.0`
- `lightningcss-darwin-x64@1.32.0`
- `lightningcss-darwin-x64@1.33.0`
- `lightningcss-freebsd-x64@1.32.0`
- `lightningcss-freebsd-x64@1.33.0`
- `lightningcss-linux-arm-gnueabihf@1.32.0`
- `lightningcss-linux-arm-gnueabihf@1.33.0`
- `lightningcss-linux-arm64-gnu@1.32.0`
- `lightningcss-linux-arm64-gnu@1.33.0`
- `lightningcss-linux-arm64-musl@1.32.0`
- `lightningcss-linux-arm64-musl@1.33.0`
- `lightningcss-linux-x64-gnu@1.32.0`
- `lightningcss-linux-x64-gnu@1.33.0`
- `lightningcss-linux-x64-musl@1.32.0`
- `lightningcss-linux-x64-musl@1.33.0`
- `lightningcss-win32-arm64-msvc@1.32.0`
- `lightningcss-win32-arm64-msvc@1.33.0`
- `lightningcss-win32-x64-msvc@1.32.0`
- `lightningcss-win32-x64-msvc@1.33.0`
- `satori@0.26.0`

### OFL-1.1

- `@fontsource/noto-sans-kr@5.3.0`

### Python-2.0

- `argparse@2.0.1`

### Unlicense

- `robust-predicates@3.0.3`

## 그 밖에, mermaid 의존 패키지 중 MIT가 아닌 전문

위 표에서 MIT가 아닌 항목 가운데 산출물 JS에 함께 실릴 수 있는 것들입니다.

### ISC (d3)

```
Copyright 2010-2023 Mike Bostock

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
```

### BSD-3-Clause (d3-ease)

```
Copyright 2010-2021 Mike Bostock
Copyright 2001 Robert Penner
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the author nor the names of contributors may be used to
  endorse or promote products derived from this software without specific prior
  written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### BSD-3-Clause (d3-sankey)

```
Copyright 2015, Mike Bostock
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the author nor the names of contributors may be used to
  endorse or promote products derived from this software without specific prior
  written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### BSD-3-Clause (rw)

```
Copyright (c) 2014-2016, Michael Bostock
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* The name Michael Bostock may not be used to endorse or promote products
  derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL MICHAEL BOSTOCK BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### Apache-2.0 (DOMPurify — 이 사이트가 고른 쪽)

```
Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### Unlicense (robust-predicates)

```
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org>
```

---

**이 문서를 두는 이유**는 공개 저장소를 그 자체로 배포로 보기 때문입니다.
이전에 다른 저장소에서 MIT 자산을 고지 없이 재배포한 일이 있었고, 그때 세운
규칙을 여기서 지킵니다.
