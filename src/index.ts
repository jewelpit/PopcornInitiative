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

interface SingleState {
  waitingPlayers: string[];
  actedPlayers: string[];
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
                actedPlayers: []
              });
            }
          }
        },
        "Fight!"
      )
    );
  }

  private static _game(activeGame: GameState) {
    const currentState = activeGame.current();
    return m(
      "div",
      m("h1", "Already acted"),
      currentState.actedPlayers.map(player => m(".entity .acted", player)),
      m("h1", "Waiting to act"),
      currentState.waitingPlayers.map((player, idx) =>
        m(
          ".entity",
          {
            onclick: () => {
              App._act(activeGame, idx);
            }
          },
          player
        )
      ),
      m(
        ".button-row",
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
        )
      )
    );
  }

  private static _act(activeGame: GameState, idx: number) {
    const currentState = activeGame.current();
    const actedPlayer = currentState.waitingPlayers[idx];
    activeGame.push({
      waitingPlayers: currentState.waitingPlayers
        .slice(0, idx)
        .concat(currentState.waitingPlayers.slice(idx + 1)),
      actedPlayers: currentState.actedPlayers.concat([actedPlayer])
    });
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
