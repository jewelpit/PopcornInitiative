import * as m from "mithril";

function assert(condition: boolean, message?: string) {
  if (condition) {
    return;
  }

  const msg = message != null ? message : "Assertion failed";
  throw new Error(msg);
}

function nonNull<T>(item: T | null | undefined) {
  if (item != null) {
    return item;
  }

  throw new Error("Item was null");
}

function moveTop<T>(popper: T[], pusher: T[]) {
  const top = nonNull(popper.pop());
  pusher.push(top);
}

function without<T>(arr: T[], idx: number) {
  return arr.slice(0, idx).concat(arr.slice(idx + 1));
}

interface SingleState {
  waitingPlayers: string[];
  actedPlayers: string[];
  deadPlayers: string[];
  addedPlayers: string[];
}

class GameState {
  private _undoStack: SingleState[];
  private _redoStack: SingleState[];

  constructor(init: SingleState) {
    this._undoStack = [init];
    this._redoStack = [];
  }

  current() {
    return this._undoStack[this._undoStack.length - 1];
  }

  push(newState: SingleState) {
    this._undoStack.push(newState);
    this._redoStack = [];
  }

  canUndo() {
    // Always preserve the first element
    return this._undoStack.length > 1;
  }

  canRedo() {
    return this._redoStack.length > 0;
  }

  undo() {
    assert(this.canUndo());
    moveTop(this._undoStack, this._redoStack);
  }

  redo() {
    assert(this.canRedo());
    moveTop(this._redoStack, this._undoStack);
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
      this._activeGame == null ? this._main() : this._game()
    );
  }

  private _main() {
    return m(
      "div",
      m("h1", "Combatants"),
      this._entities.map((entity, idx) =>
        m(
          ".entity",
          m(".entity-text", entity),
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
              if (text != null && text !== "") {
                this._entities.push(text);
              }
              (entity as any).value = "";
            }
          }
        },
        "Add new combatant"
      ),
      m(".spacer"),
      m(
        "button",
        {
          class: "centered-block",
          onclick: () => {
            if (this._entities.length > 0) {
              this._activeGame = new GameState({
                waitingPlayers: this._entities,
                actedPlayers: [],
                deadPlayers: [],
                addedPlayers: []
              });
            }
          }
        },
        "Fight!"
      )
    );
  }

  private _game() {
    const activeGame = nonNull(this._activeGame);
    const currentState = activeGame.current();
    const renderEntity = (
      entity: string,
      entityType: "waiting" | "acted" | "dead",
      idx: number
    ) =>
      m(
        entityType === "acted"
          ? ".entity .acted"
          : entityType === "dead"
          ? ".entity .dead"
          : ".entity",
        m(
          ".entity-text",
          {
            onclick: () => {
              if (entityType === "waiting") {
                App._act(activeGame, idx);
              }
            }
          },
          entity
        ),
        entityType !== "dead"
          ? [
              m(
                ".close-button",
                {
                  onclick: () => {
                    App._kill(activeGame, entityType, idx);
                  }
                },
                "☠️"
              )
            ]
          : []
      );

    const renderList = (list: m.Vnode[]) => {
      if (list.length === 0) {
        return [m(".italic", "None")];
      } else {
        return list;
      }
    };

    return m(
      "div",
      m("h1", "Already acted"),
      renderList(
        currentState.actedPlayers.map((entity, idx) =>
          renderEntity(entity, "acted", idx)
        )
      ),
      m("h1", "Waiting to act"),
      renderList(
        currentState.waitingPlayers.map((entity, idx) =>
          renderEntity(entity, "waiting", idx)
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
              if (text != null && text !== "") {
                activeGame.push({
                  ...currentState,
                  waitingPlayers: currentState.waitingPlayers.concat(text),
                  addedPlayers: currentState.addedPlayers.concat(text)
                });
              }
              (entity as any).value = "";
            }
          }
        },
        "Add new combatant"
      ),
      m("h1", "Dead"),
      renderList(
        currentState.deadPlayers.map((entity, idx) =>
          renderEntity(entity, "dead", idx)
        )
      ),
      m(".spacer"),
      m(
        ".button-row",
        m(".flex-spacer"),
        m(
          "button",
          { disabled: !activeGame.canUndo(), onclick: () => activeGame.undo() },
          "Undo"
        ),
        m(
          "button",
          {
            disabled: currentState.waitingPlayers.length != 0,
            onclick: () => {
              activeGame.push({
                ...currentState,
                waitingPlayers: currentState.actedPlayers.slice(),
                actedPlayers: []
              });
            }
          },
          "Next round"
        ),
        m(
          "button",
          { disabled: !activeGame.canRedo(), onclick: () => activeGame.redo() },
          "Redo"
        ),
        m(".flex-spacer"),
        m(
          "button",
          {
            onclick: () => {
              if (confirm("End fight?")) {
                this._activeGame = null;
                this._entities = this._entities.concat(
                  currentState.addedPlayers
                );
              }
            }
          },
          "End fight"
        )
      )
    );
  }

  private static _act(activeGame: GameState, idx: number) {
    const currentState = activeGame.current();
    const actedPlayer = currentState.waitingPlayers[idx];
    activeGame.push({
      ...currentState,
      waitingPlayers: currentState.waitingPlayers
        .slice(0, idx)
        .concat(currentState.waitingPlayers.slice(idx + 1)),
      actedPlayers: currentState.actedPlayers.concat([actedPlayer])
    });
  }

  private static _kill(
    activeGame: GameState,
    entityType: "waiting" | "acted",
    idx: number
  ) {
    const currentState = activeGame.current();
    const deadPlayer =
      entityType === "waiting"
        ? currentState.waitingPlayers[idx]
        : currentState.actedPlayers[idx];
    activeGame.push({
      ...currentState,
      waitingPlayers:
        entityType === "waiting"
          ? without(currentState.waitingPlayers, idx)
          : currentState.waitingPlayers,
      actedPlayers:
        entityType === "acted"
          ? without(currentState.actedPlayers, idx)
          : currentState.actedPlayers,
      deadPlayers: currentState.deadPlayers.concat([deadPlayer])
    });
  }
}

m.mount(
  nonNull(document.getElementById("app")),
  new App([
    "Dissection Dissertator",
    "Illuminated Bun-Sen",
    "Illuminated Re-Ser-Char"
  ])
);
