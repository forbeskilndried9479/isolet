import { createIsolet } from "isolet-js/runtime";

export const widget = createIsolet({
  name: "no-automount-widget",
  mount(container, props: { label: string }) {
    container.innerHTML = `<div>${props.label}</div>`;
  },
});
