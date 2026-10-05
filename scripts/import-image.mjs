import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request } from "node:https";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, basename, extname } from "node:path";
import { pathToFileURL } from "node:url";
import { checkSvg } from "./content-export.mjs";

export function isPublicAddress(address) {
  if (isIP(address) === 6)
    return (
      !/^(?:::|fe[89ab]|f[cd]|2001:db8)/i.test(address) &&
      !address.toLowerCase().includes("ffff:")
    );
  if (isIP(address) !== 4) return false;
  const [a, b] = address.split(".").map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && [18, 19].includes(b))
  );
}
export async function importImage(source, destination, credit) {
  if (!credit) throw new Error("출처·이용 조건을 마지막 인자로 적으세요.");
  let url = new URL(source);
  let response;
  for (let redirects = 0; redirects < 6; redirects++) {
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      (url.port && url.port !== "443")
    )
      throw new Error("인증 정보 없는 공개 HTTPS 주소만 허용합니다.");
    if (url.search)
      throw new Error(
        "토큰/만료값을 출처에 기록하지 않도록 query 없는 공개 이미지 URL을 사용하세요. 서명 URL은 별도로 내려받은 파일을 등록하세요."
      );
    const records = await lookup(url.hostname.replace(/^\[|\]$/g, ""), {
      all: true,
    });
    if (
      !records.length ||
      records.some(record => !isPublicAddress(record.address))
    )
      throw new Error("로컬/사설 주소 다운로드는 지원하지 않습니다.");
    response = await new Promise((accept, reject) => {
      const req = request(
        url,
        {
          headers: { Accept: "image/*" },
          // Pin the validated address so DNS changes cannot redirect this request internally.
          lookup: (_hostname, options, callback) =>
            options.all
              ? callback(null, [records[0]])
              : callback(null, records[0].address, records[0].family),
          signal: AbortSignal.timeout(30000),
        },
        accept
      );
      req.on("error", reject);
      req.end();
    });
    if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
      response.destroy();
      url = new URL(response.headers.location, url);
      continue;
    }
    break;
  }
  if (!response || response.statusCode < 200 || response.statusCode >= 300)
    throw new Error(`이미지 다운로드 실패: ${response?.statusCode}`);
  const type = response.headers["content-type"]?.split(";")[0];
  const extensions = {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
    "image/avif": [".avif"],
    "image/svg+xml": [".svg"],
  };
  if (!extensions[type]?.includes(extname(destination).toLowerCase())) {
    response.destroy();
    throw new Error("응답 이미지 형식과 저장 확장자가 일치하지 않습니다.");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of response) {
    size += chunk.length;
    if (size > 20 * 1024 * 1024)
      throw new Error("이미지는 20MB 이하여야 합니다.");
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  if (type === "image/svg+xml") checkSvg(bytes.toString("utf8"), destination);
  else {
    const { default: sharp } = await import("sharp");
    await sharp(bytes, { animated: true }).metadata();
  }
  await mkdir(dirname(resolve(destination)), { recursive: true });
  await writeFile(destination, bytes, { flag: "wx" });
  await writeFile(
    `${destination}.source.json`,
    JSON.stringify(
      {
        file: basename(destination),
        source,
        retrievedFrom: url.href,
        retrievedAt: new Date().toISOString(),
        credit,
      },
      null,
      2
    ) + "\n",
    { flag: "wx" }
  );
  console.log(`이미지와 출처 저장: ${destination}`);
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await importImage(...process.argv.slice(2));
