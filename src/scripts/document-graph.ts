import type { GraphNode, GraphEdge } from "@/utils/documentGraph";
import type { UIStrings } from "@/i18n/types";
type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  labels: UIStrings["graph"];
  draftLabel: string;
};

class DocumentGraph extends HTMLElement {
  private controller?: AbortController;
  connectedCallback() {
    this.controller?.abort();
    this.controller = new AbortController();
    const { signal } = this.controller;
    const raw = this.querySelector("[data-graph-data]")?.textContent;
    if (!raw) return;
    const { nodes, edges, labels, draftLabel } = JSON.parse(raw) as GraphData;
    const byId = new Map(nodes.map(node => [node.id, node]));
    let selected: string | undefined;
    let scale = 1;
    const search = this.querySelector<HTMLInputElement>("[data-search]");
    const svg = this.querySelector<SVGSVGElement>("svg");
    this.querySelectorAll<HTMLElement>("[data-enhanced]").forEach(
      el => (el.hidden = false)
    );
    const list = this.querySelector<HTMLDetailsElement>(".document-list");
    if (list) list.open = false;
    const text = (selector: string, value: string) => {
      const el = this.querySelector(selector);
      if (el) el.textContent = value;
    };
    const fill = (selector: string, ids: string[]) => {
      const el = this.querySelector(selector);
      if (!el) return;
      el.replaceChildren(
        ...(ids.length
          ? ids.map(id => {
              const item = byId.get(id)!;
              const li = document.createElement("li");
              const a = document.createElement("a");
              a.href = item.url;
              a.textContent = item.title;
              li.append(a);
              return li;
            })
          : [
              Object.assign(document.createElement("li"), {
                textContent: labels.none,
              }),
            ])
      );
    };
    const draw = () => {
      const query = search?.value.trim().toLocaleLowerCase() ?? "";
      const matches = new Set(
        nodes
          .filter(node =>
            `${node.title} ${node.description}`
              .toLocaleLowerCase()
              .includes(query)
          )
          .map(node => node.id)
      );
      const outgoing = edges
        .filter(edge => edge.source === selected)
        .map(edge => edge.target);
      const incoming = edges
        .filter(edge => edge.target === selected)
        .map(edge => edge.source);
      const adjacent = new Set([selected, ...outgoing, ...incoming]);
      this.querySelectorAll<SVGGElement>("[data-node]").forEach(el => {
        el.dataset.selected = String(el.dataset.node === selected);
        el.dataset.dim = String(
          !matches.has(el.dataset.node!) ||
            (!!selected && !adjacent.has(el.dataset.node))
        );
        el.setAttribute("aria-pressed", String(el.dataset.node === selected));
      });
      this.querySelectorAll<SVGLineElement>("line[data-source]").forEach(el => {
        const connected =
          el.dataset.source === selected || el.dataset.target === selected;
        el.dataset.connected = String(connected);
        el.dataset.dim = String(
          (!!selected && !connected) ||
            !matches.has(el.dataset.source!) ||
            !matches.has(el.dataset.target!)
        );
      });
      this.querySelectorAll<HTMLElement>("[data-list-node]").forEach(
        el => (el.hidden = !matches.has(el.dataset.listNode!))
      );
      text(
        "[data-result-count]",
        `${labels.documents} ${matches.size} / ${nodes.length} · ${labels.references} ${edges.length}`
      );
      const node = selected ? byId.get(selected) : undefined;
      text(
        "[data-selected-title]",
        node
          ? `${node.title}${node.draft ? ` · ${draftLabel}` : ""}`
          : labels.select
      );
      text("[data-selected-description]", node?.description ?? "");
      const link = this.querySelector<HTMLAnchorElement>(
        "[data-selected-link]"
      );
      if (link) {
        link.hidden = !node;
        if (node) link.href = node.url;
        else link.removeAttribute("href");
      }
      fill("[data-outgoing]", outgoing);
      fill("[data-incoming]", incoming);
      this.dataset.selected = selected ?? "";
    };
    const choose = (id: string | undefined) => {
      if (id && byId.has(id)) {
        selected = id;
        draw();
      }
    };
    this.addEventListener(
      "click",
      event => {
        const target = (event.target as Element).closest<HTMLElement>(
          "[data-node],[data-select],[data-reset],[data-zoom]"
        );
        if (!target) return;
        if (target.hasAttribute("data-reset")) {
          selected = undefined;
          if (search) search.value = "";
          draw();
        } else if (target.dataset.zoom && svg) {
          scale =
            target.dataset.zoom === "reset"
              ? 1
              : Math.max(
                  0.75,
                  Math.min(
                    2.5,
                    scale + (target.dataset.zoom === "in" ? 0.25 : -0.25)
                  )
                );
          svg.style.width = `${scale * 100}%`;
        } else choose(target.dataset.node ?? target.dataset.select);
      },
      { signal }
    );
    this.addEventListener(
      "keydown",
      event => {
        const target = (event.target as Element).closest<SVGGElement>(
          "[data-node]"
        );
        if (target && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          choose(target.dataset.node);
        }
        if (event.key === "Escape") {
          selected = undefined;
          draw();
        }
      },
      { signal }
    );
    search?.addEventListener(
      "input",
      () => {
        selected = undefined;
        if (list) list.open = true;
        draw();
      },
      { signal }
    );
    draw();
  }
  disconnectedCallback() {
    this.controller?.abort();
  }
}
if (!customElements.get("document-graph"))
  customElements.define("document-graph", DocumentGraph);
