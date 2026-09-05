import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * 글 컬렉션.
 *
 * 이 스키마는 문서 허브(비공개)의 지식 노트 frontmatter 계약과 짝을 이루도록
 * 만들었다. 그쪽은 `doc_type`·`owner`·`last_reviewed`·`kind`·`status`·`tags`를
 * 쓰고 파이썬 감사기가 검사하는데, 그중 **공개본에 의미가 있는 것만** 여기 남기고
 * 나머지(소유자·검토일 같은 내부 운영 필드)는 넘어오지 않는다.
 *
 * 스키마를 두는 이유는 형식 통일이 아니라 **빌드를 깨뜨리기 위해서**다.
 * 필수 필드가 비면 배포가 실패하므로 반쪽짜리 글이 조용히 공개되지 않는다.
 */
const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    /** 목록 카드와 메타 설명에 쓴다. 한 문장. */
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),

    /**
     * 허브의 `kind`를 그대로 가져왔다. 값을 바꾸면 양쪽이 갈라지므로
     * 새 종류가 필요하면 허브 쪽 계약을 먼저 고친다.
     */
    kind: z
      .enum(['til', 'troubleshooting', 'concept', 'snippet', 'agent-issue'])
      .optional(),

    tags: z.array(z.string()).default([]),

    /**
     * ★ 파생 추적. 이 글이 허브의 어느 노트에서 나왔는지를 적는다.
     * 예: `docs/knowledge/git/2026-09-05-check-ignore-quotes-windows-paths.md`
     *
     * 공개본은 정본의 복사본이 아니라 **재작성물**이다. 정본은 자신을 위해
     * 쓰였고 공개본은 남을 위해 쓰이므로 맥락이 다시 붙어야 한다. 그래서
     * 자동 동기화 대상이 아니고, 이 필드는 그 관계를 사람이 따라갈 수 있게만 한다.
     *
     * 허브 밖에서 새로 쓴 글이면 비운다.
     */
    sourceNote: z.string().optional(),

    /** `true`면 빌드에서 제외한다. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
