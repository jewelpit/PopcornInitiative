import * as m from "mithril";

const entities = [
  "Dissection Dissertator",
  "Illuminated Bun-Sen",
  "Illuminated Re-Sear-Char"
];

function createView() {
  return {
    view() {
      return m(
        "ul",
        entities.map(entity =>
          m(
            "li",
            {
              onclick: function() {
                entities.push("Click!");
              }
            },
            entity
          )
        )
      );
    }
  };
}

m.mount(document.body, createView());
