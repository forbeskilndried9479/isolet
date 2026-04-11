import { createIsolet } from "isolet-js/runtime";
import iconUrl from "./icon.svg";

export { iconUrl };

export const widget = createIsolet({
  name: "basic-widget",
  css: __ISOLET_CSS__,
  mount(container, props: { label: string }) {
    container.innerHTML = `<div class="widget"><img src="${iconUrl}" />${props.label}</div>`;
  },
});
