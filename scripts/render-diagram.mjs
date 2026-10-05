import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, extname } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { checkSvg } from "./content-export.mjs";

export async function renderDiagram(input, output) {
  const source = await readFile(input, "utf8");
  const type = extname(input).toLowerCase();
  const format = extname(output).slice(1).toLowerCase();
  if (!["svg", "png"].includes(format))
    throw new Error("출력은 SVG 또는 PNG여야 합니다.");
  // Render only local definitions. No remote includes, icon fetches, or local file includes.
  if (
    /(?:https?:|file:|\/\/)|!include|@import|\bicon\s*:|\bimport\s|\$\{?\w|<img\b/i.test(
      source
    )
  )
    throw new Error(
      "외부/포함 자산 없는 독립 다이어그램 원본만 렌더합니다. 필요한 그림은 따로 다운로드해 첨부하세요."
    );
  await mkdir(dirname(resolve(output)), { recursive: true });
  let bytes;
  if ([".mmd", ".mermaid"].includes(type)) {
    const { default: puppeteer } = await import("puppeteer");
    const { renderMermaid } = await import("@mermaid-js/mermaid-cli");
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        ...(process.env.DIAGRAM_BROWSER_PATH
          ? { executablePath: process.env.DIAGRAM_BROWSER_PATH }
          : {}),
      });
      const result = await renderMermaid(browser, source, format, {
        mermaidConfig: {
          securityLevel: "strict",
          theme: "neutral",
          htmlLabels: false,
          flowchart: { htmlLabels: false },
        },
        backgroundColor: "white",
      });
      bytes = result.data;
    } catch (error) {
      throw new Error(
        `Mermaid 렌더 실패. npm ci로 Chromium을 설치하거나 DIAGRAM_BROWSER_PATH를 지정하세요. ${error.message}`
      );
    } finally {
      await browser?.close();
    }
  } else if (type === ".puml" || type === ".plantuml") {
    if (!process.env.PLANTUML_JAR)
      throw new Error(
        "PlantUML은 Java와 로컬 JAR가 필요합니다. PLANTUML_JAR 환경변수에 JAR 경로를 지정하세요. https://plantuml.com/download"
      );
    const result = spawnSync(
      "java",
      [
        "-DPLANTUML_SECURITY_PROFILE=SANDBOX",
        "-jar",
        process.env.PLANTUML_JAR,
        "-pipe",
        `-t${format}`,
        "-charset",
        "UTF-8",
        "-failfast2",
      ],
      { input: source, maxBuffer: 32 * 1024 * 1024 }
    );
    if (result.error || result.status !== 0)
      throw new Error(
        `PlantUML 실패 (Java/Graphviz 설치 및 문법 확인): ${result.error?.message ?? result.stderr?.toString()}`
      );
    bytes = result.stdout;
  } else if (type === ".d2") {
    const result = spawnSync(
      process.env.D2_PATH || "d2",
      ["--layout=dagre", "--theme=0", "--sketch=false", "--pad=24", "-", "-"],
      { input: source, maxBuffer: 32 * 1024 * 1024 }
    );
    if (result.error || result.status !== 0)
      throw new Error(
        `D2 실패. 로컬 D2 CLI를 설치하고 PATH 또는 D2_PATH를 지정하세요. https://d2lang.com/tour/install/ ${result.error?.message ?? result.stderr?.toString()}`
      );
    bytes = result.stdout;
    checkSvg(bytes.toString(), input);
    if (format === "png") {
      const { default: sharp } = await import("sharp");
      bytes = await sharp(bytes).png().toBuffer();
    }
  } else
    throw new Error(
      "지원 원본: .mmd/.mermaid, .puml/.plantuml, .d2. draw.io와 Excalidraw는 편집기에서 SVG/PNG로 내보내세요."
    );
  if (format === "svg") checkSvg(new TextDecoder().decode(bytes), output);
  await writeFile(output, bytes);
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output)
    throw new Error("사용법: npm run diagram:render -- 원본.mmd 출력.svg");
  await renderDiagram(input, output);
  console.log(`정적 다이어그램 저장: ${output}`);
}
