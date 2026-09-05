import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** 글의 종류. `content.config.ts`의 enum과 같아야 한다. */
export type Kind = NonNullable<Post['data']['kind']>;

/**
 * 화면에 보여줄 이름.
 *
 * 값 자체를 한글로 두지 않는 이유는 허브의 `kind` 계약과 갈라지기 때문이다.
 * 저장하는 값은 영문 그대로 두고 표시만 여기서 옮긴다.
 */
export const KIND_LABEL: Record<Kind, string> = {
  til: '배운 것',
  troubleshooting: '장애 대응',
  concept: '개념',
  snippet: '스니펫',
  'agent-issue': 'AI 도구 이슈',
};

/** 공개된 글만, 최신순으로. draft는 어디서도 보이지 않는다. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** 태그별 글 수. 글이 많은 태그부터, 같으면 이름순. */
export function countByTag(posts: Post[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return new Map(
    [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko')),
  );
}

/** 종류별 글 수. `KIND_LABEL`의 선언 순서를 따른다 — 빈도로 정렬하면 순서가 계속 바뀐다. */
export function countByKind(posts: Post[]): Map<Kind, number> {
  const counts = new Map<Kind, number>();
  for (const kind of Object.keys(KIND_LABEL) as Kind[]) {
    const n = posts.filter((p) => p.data.kind === kind).length;
    if (n > 0) counts.set(kind, n);
  }
  return counts;
}
