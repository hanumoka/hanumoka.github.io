import {
  scenarios,
  snapshot,
  eventText,
  quotaLabel,
  documentLabel,
  statusLabel,
  type Scenario,
} from "./business-consistency-model";

class BusinessConsistencyLab extends HTMLElement {
  private scenario: Scenario = "reserve-after";
  private step = 0;
  private playing = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private controller: AbortController | undefined;
  connectedCallback() {
    this.pause();
    this.controller?.abort();
    this.controller = new AbortController();
    const { signal } = this.controller;
    const outcomes =
      this.parentElement?.querySelector<HTMLDetailsElement>(".static-outcomes");
    if (outcomes) outcomes.open = false;
    this.querySelectorAll<HTMLElement>("[data-controls]").forEach(
      el => (el.hidden = false)
    );
    const selector = this.querySelector<HTMLSelectElement>("select");
    if (selector) selector.value = this.scenario;
    selector?.addEventListener(
      "change",
      () => {
        if (!Object.hasOwn(scenarios, selector.value)) return;
        this.pause();
        this.scenario = selector.value as Scenario;
        this.step = 0;
        this.render(true);
      },
      { signal }
    );
    this.addEventListener(
      "click",
      event => {
        const button = (event.target as Element).closest<HTMLButtonElement>(
          "button[data-action]"
        );
        if (!button || button.disabled) return;
        switch (button.dataset.action) {
          case "play":
            if (this.playing) this.pause();
            else {
              if (this.step === this.length) this.step = 0;
              this.playing = true;
              this.schedule();
            }
            break;
          case "next":
            this.pause();
            this.step = Math.min(this.length, this.step + 1);
            break;
          case "previous":
            this.pause();
            this.step = Math.max(0, this.step - 1);
            break;
          case "reset":
            this.pause();
            this.step = 0;
            break;
        }
        this.render(true);
      },
      { signal }
    );
    document.addEventListener("astro:before-swap", () => this.pause(), {
      signal,
    });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          this.pause();
          this.render();
        }
      },
      { signal }
    );
    this.render();
  }
  disconnectedCallback() {
    this.pause();
    this.controller?.abort();
  }
  private get length() {
    return scenarios[this.scenario].events.length;
  }
  private pause() {
    clearTimeout(this.timer);
    this.playing = false;
  }
  private schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (!this.isConnected || !this.playing) return;
      this.step = Math.min(this.length, this.step + 1);
      if (this.step === this.length) this.pause();
      this.render(true);
      if (this.playing) this.schedule();
    }, 2200);
  }
  private render(announce = false) {
    const state = snapshot(this.scenario, this.step);
    const set = (key: string, text: string) => {
      const el = this.querySelector(`[data-${key}]`);
      if (el) el.textContent = text;
    };
    this.dataset.step = String(this.step);
    this.dataset.scenario = this.scenario;
    this.dataset.playing = String(this.playing);
    this.dataset.status = state.status;
    set("actual-quota", quotaLabel[state.quota]);
    set("known-quota", quotaLabel[state.knownQuota]);
    set("actual-document", documentLabel[state.document]);
    set("known-document", documentLabel[state.knownDocument]);
    set("business-status", statusLabel[state.status]);
    set("step-count", `${this.step} / ${this.length} 사건`);
    const current = state.events.at(-1);
    const description = current
      ? eventText[current]
      : "시나리오를 고른 뒤 ‘다음 사건’을 눌러 보세요. 아직 외부 기록은 없습니다.";
    set("event-title", description);
    set(
      "lesson",
      this.step === this.length
        ? scenarios[this.scenario].lesson
        : "외부 기록이 반영되는 순간과 호출자가 응답을 받는 순간을 따로 보세요."
    );
    if (announce) set("announcement", `${this.step}번째 사건. ${description}`);
    const play = this.querySelector<HTMLButtonElement>('[data-action="play"]');
    if (play) {
      play.textContent = this.playing
        ? "일시정지"
        : this.step === this.length
          ? "처음부터 자동 진행"
          : "자동 진행";
      play.setAttribute("aria-pressed", String(this.playing));
    }
    const previous = this.querySelector<HTMLButtonElement>(
      '[data-action="previous"]'
    );
    const next = this.querySelector<HTMLButtonElement>('[data-action="next"]');
    if (previous) previous.disabled = this.step === 0;
    if (next) next.disabled = this.step === this.length;
    this.querySelectorAll<HTMLElement>("[data-phase]").forEach(el => {
      const phase = Number(el.dataset.phase);
      el.dataset.active = String(phase === state.phase);
      const label = el.querySelector("[data-phase-label]");
      if (label)
        label.textContent =
          phase < state.phase
            ? "응답 확인"
            : phase === state.phase
              ? state.status === "complete"
                ? "응답 확인"
                : "현재 단계"
              : "대기";
    });
    this.querySelectorAll<HTMLElement>(
      "[data-known-quota], [data-known-document]"
    ).forEach(
      el => (el.dataset.uncertain = String(el.textContent === "결과 미확인"))
    );
    this.querySelector("[data-event-log]")?.replaceChildren(
      ...state.events.map((event, i) => {
        const li = document.createElement("li");
        li.textContent = `${i + 1}. ${eventText[event]}`;
        return li;
      })
    );
  }
}
if (!customElements.get("business-consistency-lab"))
  customElements.define("business-consistency-lab", BusinessConsistencyLab);
