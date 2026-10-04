export type GraphNode = {
  id: string;
  title: string;
  description: string;
  url: string;
  draft: boolean;
  links: string[];
};
export type GraphEdge = { source: string; target: string };

/** 전달된 허용 글 집합 밖으로는 문서·연결 정보를 만들지 않는다. */
export function connectDocuments(
  nodes: GraphNode[],
  site: string
): GraphEdge[] {
  const pathKey = (path: string) =>
    decodeURIComponent(path).replace(/\/+$/, "");
  const origin = new URL(site).origin;
  const byPath = new Map(
    nodes.map(node => [pathKey(new URL(node.url, site).pathname), node.id])
  );
  const edges = new Map<string, GraphEdge>();
  for (const node of nodes)
    for (const href of node.links) {
      try {
        const url = new URL(href, new URL(node.url, site));
        if (url.origin !== origin) continue;
        const target = byPath.get(pathKey(url.pathname));
        if (target && target !== node.id)
          edges.set(`${node.id}\n${target}`, { source: node.id, target });
      } catch {
        /* 유효하지 않은 주소는 기존 링크 검사에서 보고한다. */
      }
    }
  return [...edges.values()];
}

/** 참조가 있는 글을 중심에, 연결이 없는 글을 바깥에 둔다. 위치는 의미나 중요도 점수가 아니다. */
export function documentPositions(nodes: GraphNode[], edges: GraphEdge[]) {
  const connected = new Set(edges.flatMap(edge => [edge.source, edge.target]));
  const groups = [
    nodes.filter(node => connected.has(node.id)),
    nodes.filter(node => !connected.has(node.id)),
  ];
  return groups.flatMap((group, category) =>
    group.map((node, index) => {
      const angle =
        (index / Math.max(group.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const radius = category === 0 ? (group.length <= 1 ? 0 : 190) : 330;
      return {
        ...node,
        x: 460 + Math.cos(angle) * radius,
        y: 380 + Math.sin(angle) * radius,
        number: nodes.indexOf(node) + 1,
      };
    })
  );
}
