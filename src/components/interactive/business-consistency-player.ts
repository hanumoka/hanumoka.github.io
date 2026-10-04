import {
  scenarios,
  snapshot,
  eventText,
  seatLabel,
  paymentLabel,
  ticketLabel,
  decisionLabel,
  statusLabel,
  type Scenario,
} from "./business-consistency-model";

class BusinessConsistencyLab extends HTMLElement {
  private scenario: Scenario = "hold-after";
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
    this.querySelector("[data-next-event-fill]")
      ?.getAnimations()
      .forEach(animation => animation.cancel());
  }
  private schedule() {
    clearTimeout(this.timer);
    const fill = this.querySelector<HTMLElement>("[data-next-event-fill]");
    fill?.getAnimations().forEach(animation => animation.cancel());
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      fill?.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
        duration: 2200,
        fill: "forwards",
      });
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
    const ended = this.step === this.length;
    this.dataset.ended = String(ended);
    const playback = ended
      ? "시나리오 재생 종료"
      : this.playing
        ? "자동 진행 중 · 다음 사건 대기"
        : this.step === 0
          ? "재생 전"
          : "일시정지 · 수동 진행 가능";
    set("playback-state", playback);
    set("progress-text", `${Math.round((this.step / this.length) * 100)}%`);
    const progress = this.querySelector<HTMLProgressElement>(
      "[data-event-progress]"
    );
    if (progress) {
      progress.max = this.length;
      progress.value = this.step;
      progress.textContent = `${this.step} / ${this.length}`;
    }
    set("actual-seat", seatLabel[state.seat]);
    set("known-seat", seatLabel[state.knownSeat]);
    set("actual-payment", paymentLabel[state.payment]);
    set("known-payment", paymentLabel[state.knownPayment]);
    set("actual-ticket", ticketLabel[state.ticket]);
    set("known-ticket", ticketLabel[state.knownTicket]);
    set("decision", decisionLabel[state.decision]);
    set("booking-status", state.bookingStatus);
    set(
      "user-status",
      state.userReceivedCompletion ? "완료 응답 수신" : "완료 응답 미수신"
    );
    set(
      "capture-count",
      `결제 확정 요청 ${state.captureRequests}회 / 실제 청구 ${state.captureKeys.length}회`
    );
    set("business-status", statusLabel[state.status]);
    set("step-count", `${this.step} / ${this.length} 사건`);
    const current = state.events.at(-1);
    const description = current
      ? eventText[current]
      : "시나리오를 고른 뒤 ‘다음 사건’을 눌러 보세요. 아직 좌석·결제·티켓 작업은 시작하지 않았습니다.";
    set("event-title", description);
    set(
      "lesson",
      this.step === this.length
        ? scenarios[this.scenario].lesson
        : "서비스가 상태를 저장한 시점과 예매 진행 서비스가 성공 응답을 받은 시점을 비교해 보세요."
    );
    if (announce)
      set("announcement", `${playback}. ${this.step}번째 사건. ${description}`);
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
          state.decision === "cancel"
            ? phase < 2
              ? state.status === "cancelled"
                ? "Cancel 확인"
                : "Cancel 진행"
              : "진행하지 않음"
            : ended && state.status !== "complete"
              ? phase < state.phase
                ? "응답 확인"
                : phase > state.phase
                  ? state.status === "failed"
                    ? "실행하지 않음"
                    : "진행 보류"
                  : state.status === "failed"
                    ? "승인 거절로 중단"
                    : "결과 확인 필요"
              : phase < state.phase
                ? "응답 확인"
                : phase === state.phase
                  ? state.status === "complete"
                    ? "응답 확인"
                    : "현재 단계"
                  : "대기";
    });
    this.querySelectorAll<HTMLElement>(
      "[data-known-seat], [data-known-payment], [data-known-ticket]"
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
