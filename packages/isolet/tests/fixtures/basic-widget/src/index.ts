import { createIsolet } from "isolet-js/runtime";

export const widget = createIsolet({
  name: "basic-widget",
  css: __ISOLET_CSS__,
  mount(container, props: { label: string }) {
    container.innerHTML = `<div class="widget">${props.label}</div>`;
  },
});
