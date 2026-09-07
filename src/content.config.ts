import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";

export const BLOG_PATH = "src/content/posts";

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(config.site.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image().or(z.string()).optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),

      /**
       * 글의 종류. 비공개 문서 허브의 지식 노트 `kind` 계약에서 그대로 가져왔다.
       * 값을 바꾸면 양쪽이 갈라지므로 새 종류가 필요하면 허브 계약을 먼저 고친다.
       */
      kind: z
        .enum(["til", "troubleshooting", "concept", "snippet", "agent-issue"])
        .optional(),

      /**
       * 연재 이름. 태그와 같은 방식으로 **언어마다 그 언어의 이름을 쓴다**
       * (한국어 글은 한국어 이름, 영어 글은 영어 이름). 글이 언어별로 따로
       * 쓰이므로 한 언어의 독자가 다른 언어의 연재 목록을 볼 일이 없다.
       */
      series: z.string().optional(),

      /**
       * 연재 안에서의 순서. 비우면 발행일 순으로 놓는다.
       *
       * ★ 순서를 명시할 수 있어야 한다 — 나중에 사이에 한 편을 끼워 넣거나
       * 쓴 순서와 읽는 순서가 다를 때 발행일만으로는 표현할 수 없다.
       */
      seriesOrder: z.number().int().positive().optional(),

      /**
       * 파생 추적. 이 글이 허브의 어느 노트에서 나왔는지 적는다.
       *
       * 공개본은 정본의 복사본이 아니라 재작성물이다 — 정본은 자신을 위해 쓰였고
       * 공개본은 남을 위해 쓰이므로 맥락이 다시 붙어야 한다. 그래서 자동 동기화
       * 대상이 아니고, 이 필드는 그 관계를 사람이 따라갈 수 있게만 한다.
       *
       * 허브 밖에서 새로 쓴 글이면 비운다.
       */
      sourceNote: z.string().optional(),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    canonicalURL: z.string().optional(),
  }),
});

export const collections = { posts, pages };
