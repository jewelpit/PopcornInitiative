import * as m from "mithril";

interface SingleState {}

class GameState {
  private _undoStack: SingleState[];
  private _index: number;

  constructor(init: SingleState) {
    this._undoStack = [init];
    this._index = 0;
  }
}

class App {
  private _activeGame: GameState | null;

  constructor(private _entities: string[]) {
    this._activeGame = null;
  }

  view() {
    return m(
      ".wrapper",
      this._activeGame == null ? this._main() : App._game(this._activeGame)
    );
  }

  private _main() {
    return m(
      "div",
      m("h1", "Combatants"),
      this._entities.map((entity, idx) =>
        m(
          ".entity",
          entity,
          m(
            ".close-button",
            { onclick: () => this._entities.splice(idx, 1) },
            "X"
          )
        )
      ),
      m("input", { type: "text", id: "new-entity" }),
      m(
        "button",
        {
          onclick: () => {
            const entity = document.getElementById("new-entity");
            if (entity != null) {
              const text = (entity as any).value as string | undefined | null;
              if (text != null) {
                this._entities.push(text);
              }
              (entity as any).value = "";
            }
          }
        },
        "Add new combatant"
      )
    );
  }

  private static _game(activeGame: GameState) {
    return m("Active game");
  }
}

m.mount(
  document.body,
  new App([
    "Dissection Dissertator",
    "Illuminated Bun-Sen",
    "Illuminated Re-Ser-Char"
  ])
);
