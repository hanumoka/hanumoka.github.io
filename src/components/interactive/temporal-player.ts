import { scenarios, type Scenario } from "./temporal-model";

class TemporalFlow extends HTMLElement {
  private scenario: Scenario = "success";
  private step = 0;
  private playing = false;
  private speed = 1;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private controller: AbortController | undefined;

  connectedCallback() {
    this.controller?.abort();
    this.controller = new AbortController();
    const { signal } = this.controller;
    this.querySelectorAll<HTMLElement>("[data-controls]").forEach(
      el => (el.hidden = false)
    );
    this.addEventListener(
      "click",
      event => {
        const button = (event.target as Element).closest<HTMLButtonElement>(
          "button"
        );
        if (!button) return;
        const scenario = button.dataset.scenario;
        if (scenario === "success" || scenario === "retry") {
          this.pause();
          this.scenario = scenario;
          this.step = 0;
          this.buildNavigation();
        } else if (button.dataset.step !== undefined) {
          this.pause();
          this.step = Number(button.dataset.step);
        } else {
          switch (button.dataset.action) {
            case "play":
              if (this.playing) this.pause();
              else {
                if (this.step === this.steps.length - 1) this.step = 0;
                this.playing = true;
                this.schedule();
              }
              break;
            case "previous":
              this.pause();
              this.step = Math.max(0, this.step - 1);
              break;
            case "next":
              this.pause();
              this.step = Math.min(this.steps.length - 1, this.step + 1);
              break;
            case "reset":
              this.pause();
              this.step = 0;
              break;
          }
        }
        this.update(true);
      },
      { signal }
    );
    this.querySelector<HTMLInputElement>("[data-seek]")?.addEventListener(
      "input",
      event => {
        this.pause();
        this.step = Number((event.target as HTMLInputElement).value);
        this.update(true);
      },
      { signal }
    );
    this.querySelector<HTMLSelectElement>("[data-speed]")?.addEventListener(
      "change",
      event => {
        this.speed = Number((event.target as HTMLSelectElement).value);
        if (this.playing) this.schedule();
      },
      { signal }
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          this.pause();
          this.update();
        }
      },
      { signal }
    );
    document.addEventListener("astro:before-swap", () => this.pause(), {
      signal,
    });
    this.buildNavigation();
    this.update();
  }

  disconnectedCallback() {
    this.pause();
    this.controller?.abort();
  }

  private get steps() {
    return scenarios[this.scenario];
  }

  private pause() {
    clearTimeout(this.timer);
    this.playing = false;
  }

  private schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (!this.isConnected || !this.playing) return;
      this.step = Math.min(this.steps.length - 1, this.step + 1);
      if (this.step === this.steps.length - 1) this.pause();
      this.update();
      if (this.playing) this.schedule();
    }, 3600 / this.speed);
  }

  private buildNavigation() {
    const nav = this.querySelector("[data-step-nav]");
    if (!nav) return;
    nav.replaceChildren(
      ...this.steps.map((step, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.step = String(index);
        button.textContent = `${index + 1}. ${step.label}`;
        button.setAttribute("aria-label", `${index + 1}단계: ${step.label}`);
        return button;
      })
    );
  }

  private update(announce = false) {
    const current = this.steps[this.step];
    this.dataset.playing = String(this.playing);
    this.dataset.currentStep = String(this.step);
    this.dataset.scenario = this.scenario;
    const setText = (selector: string, value: string) => {
      const el = this.querySelector(selector);
      if (el) el.textContent = value;
    };
    setText(
      "[data-status]",
      this.step === 0 && !this.playing ? "재생 준비" : current.status
    );
    setText("[data-step-count]", `${this.step + 1} / ${this.steps.length}`);
    setText(
      "[data-attempt]",
      current.attempt ? `액티비티 시도 ${current.attempt}` : "액티비티 실행 전"
    );
    setText("[data-step-title]", current.title);
    setText("[data-step-description]", current.description);
    setText(
      '[data-action="play"]',
      this.playing
        ? "일시정지"
        : this.step === this.steps.length - 1
          ? "다시 재생"
          : "재생"
    );
    if (announce)
      setText("[data-announcement]", `${this.step + 1}단계. ${current.title}`);
    this.querySelectorAll<SVGElement>("[data-node]").forEach(
      el =>
        (el.dataset.active = String(
          current.nodes.includes(el.dataset.node ?? "")
        ))
    );
    this.querySelectorAll<SVGElement>("[data-edge]").forEach(
      el => (el.dataset.active = String(el.dataset.edge === current.edge))
    );
    this.querySelectorAll<HTMLButtonElement>("button[data-scenario]").forEach(
      el =>
        el.setAttribute(
          "aria-pressed",
          String(el.dataset.scenario === this.scenario)
        )
    );
    this.querySelectorAll<HTMLButtonElement>("button[data-step]").forEach(
      el => {
        if (Number(el.dataset.step) === this.step)
          el.setAttribute("aria-current", "step");
        else el.removeAttribute("aria-current");
      }
    );
    const previous = this.querySelector<HTMLButtonElement>(
      '[data-action="previous"]'
    );
    const next = this.querySelector<HTMLButtonElement>('[data-action="next"]');
    if (previous) previous.disabled = this.step === 0;
    if (next) next.disabled = this.step === this.steps.length - 1;
    const seek = this.querySelector<HTMLInputElement>("[data-seek]");
    if (seek) {
      seek.max = String(this.steps.length - 1);
      seek.value = String(this.step);
      seek.setAttribute(
        "aria-valuetext",
        `${this.step + 1}단계: ${current.label}`
      );
    }
    this.querySelector("[data-event-log]")?.replaceChildren(
      ...this.steps
        .slice(Math.max(0, this.step - 2), this.step + 1)
        .map(step => {
          const li = document.createElement("li");
          li.textContent = step.event;
          return li;
        })
    );
  }
}

if (!customElements.get("temporal-flow"))
  customElements.define("temporal-flow", TemporalFlow);
