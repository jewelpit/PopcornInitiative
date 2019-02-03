import * as m from "mithril";

function createView() {
  return {
    view() {
      return m("div", "This is my content");
    }
  };
}

m.mount(document.body, createView());
