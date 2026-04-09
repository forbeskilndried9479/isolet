import { createIsolet } from "isolet-js";
import { react } from "isolet-js/react";
import { vanilla } from "isolet-js/vanilla";
import { Counter } from "./counter.js";

// -- Shared widget CSS --

const widgetCss = `
  .widget {
    font-family: system-ui, -apple-system, sans-serif;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background: #1a1a2e;
    color: #e0e0e0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .widget button {
    padding: 0.25rem 0.625rem;
    border-radius: 0.25rem;
    border: 1px solid #404060;
    background: #2a2a4a;
    color: #e0e0e0;
    cursor: pointer;
    font-size: 0.8125rem;
  }
  .widget button:hover {
    background: #3a3a6a;
  }
`;

const reactCss = `
  .react-counter {
    font-family: system-ui, -apple-system, sans-serif;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background: #1a2e1a;
    color: #e0e0e0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .react-counter button {
    padding: 0.25rem 0.625rem;
    border-radius: 0.25rem;
    border: 1px solid #406040;
    background: #2a4a2a;
    color: #e0e0e0;
    cursor: pointer;
    font-size: 0.8125rem;
  }
  .react-counter button:hover {
    background: #3a6a3a;
  }
`;

// -- Vanilla counter mount function --

const vanillaCounter = vanilla<{ label: string }>(
  (container, props) => {
    let count = 0;

    const render = () => {
      container.innerHTML = `
        <div class="widget">
          <span>${props.label}: ${count}</span>
          <button data-inc>+</button>
          <button data-dec>-</button>
        </div>
      `;
    };

    render();

    const onClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.matches("[data-inc]")) {
        count++;
        render();
      } else if (target.matches("[data-dec]")) {
        count--;
        render();
      }
    };

    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  },
);

// -- Create isolets --

interface WidgetMap {
  [key: string]: ReturnType<typeof createIsolet>;
}

const widgets: WidgetMap = {
  "shadow-vanilla": createIsolet({
    name: "shadow-vanilla",
    mount: vanillaCounter,
    css: widgetCss,
    isolation: "shadow-dom",
  }),
  "scoped-vanilla": createIsolet({
    name: "scoped-vanilla",
    mount: vanillaCounter,
    css: widgetCss,
    isolation: "scoped",
  }),
  "shadow-react": createIsolet({
    name: "shadow-react",
    mount: react(Counter),
    css: reactCss,
    isolation: "shadow-dom",
  }),
  "none-vanilla": createIsolet({
    name: "none-vanilla",
    mount: vanillaCounter,
    css: widgetCss,
    isolation: "none",
  }),
};

// -- Mount all widgets --

let updateCount = 0;

for (const [id, widget] of Object.entries(widgets)) {
  const target = document.getElementById(id);
  if (target) widget.mount(target, { label: "Counter" });
}

// -- Wire up controls --

document.addEventListener("click", (e) => {
  const button = (e.target as HTMLElement).closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const targetId = button.dataset.target;
  if (!action || !targetId) return;

  const widget = widgets[targetId];
  if (!widget) return;

  if (action === "update") {
    updateCount++;
    widget.update({ label: `Updated (${updateCount})` });
  } else if (action === "unmount") {
    widget.unmount();
  }
});
